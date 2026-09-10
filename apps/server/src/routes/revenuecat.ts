import { timingSafeEqual } from "node:crypto";

import db from "@miyamoto/db";
import { env } from "@miyamoto/env/server";
import type { Hono } from "hono";

/**
 * RevenueCat webhooks, written to our own Subscription row.
 *
 * The device asks RevenueCat directly for instant gating, and that is fine
 * for deciding what to draw. It is not fine for deciding what to allow: the
 * free counter, the Master switch and the library all read Subscription
 * through isPro, because a gate the client can answer is not a gate (D-018).
 * This route is how that row learns anything.
 *
 * Three rules shape it:
 *
 *   - Nothing unauthenticated writes. The Authorization header must match
 *     REVENUECAT_WEBHOOK_AUTH, compared in constant time. With the variable
 *     unset the route answers 503 rather than accepting anything.
 *   - Never grant on doubt (D-021). An event that does not carry the Pro
 *     entitlement grants nothing; a transfer revokes from the old account and
 *     does not grant to the new one, which re-syncs on its next event.
 *   - Acknowledge what cannot be applied. RevenueCat retries any non-2xx, so
 *     an anonymous or unknown app_user_id gets 200 and a log line rather than
 *     an error it will resend forever.
 */

/** Must match PRO_ENTITLEMENT in apps/native/lib/purchases.tsx. */
export const PRO_ENTITLEMENT = "miyamoto_meet_the_masters_pro";

type RevenueCatEvent = {
  id?: string;
  type: string;
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  entitlement_ids?: string[] | null;
  entitlement_id?: string | null;
  product_id?: string;
  expiration_at_ms?: number | null;
  store?: string;
  transferred_from?: string[];
  transferred_to?: string[];
};

/** Events after which the entitlement is live. */
const GRANTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "PRODUCT_CHANGE",
  "NON_RENEWING_PURCHASE",
  "SUBSCRIPTION_EXTENDED",
  "TEMPORARY_ENTITLEMENT_GRANT",
]);

function authorised(header: string | undefined): boolean {
  const secret = env.REVENUECAT_WEBHOOK_AUTH;
  if (!secret || !header) return false;
  const given = Buffer.from(header);
  // The dashboard sends the configured value verbatim; accept it with or
  // without a Bearer prefix so the configuration is not a guessing game.
  return [secret, `Bearer ${secret}`].some((candidate) => {
    const expected = Buffer.from(candidate);
    return expected.length === given.length && timingSafeEqual(expected, given);
  });
}

function isAnonymous(id: string): boolean {
  return id.startsWith("$RCAnonymousID:");
}

/**
 * The account this event belongs to.
 *
 * appUserID is bound to the Better-Auth user id at login (D-021), so
 * app_user_id is normally the answer. Aliases are checked too, for a
 * purchase made anonymously and aliased to the account afterwards.
 */
async function resolveUserId(event: RevenueCatEvent): Promise<string | null> {
  const candidates = [event.app_user_id, event.original_app_user_id, ...(event.aliases ?? [])].filter(
    (id): id is string => typeof id === "string" && id.length > 0 && !isAnonymous(id),
  );
  if (!candidates.length) return null;
  const user = await db.user.findFirst({ where: { id: { in: candidates } }, select: { id: true } });
  return user?.id ?? null;
}

function carriesPro(event: RevenueCatEvent): boolean {
  const ids = event.entitlement_ids ?? (event.entitlement_id ? [event.entitlement_id] : []);
  return ids.includes(PRO_ENTITLEMENT);
}

function storeName(store: string | undefined): string | null {
  if (store === "APP_STORE" || store === "MAC_APP_STORE") return "app_store";
  if (store === "PLAY_STORE") return "play_store";
  return store ? store.toLowerCase() : null;
}

export function registerRevenueCatWebhook(app: Hono) {
  app.post("/webhooks/revenuecat", async (c) => {
    if (!env.REVENUECAT_WEBHOOK_AUTH) {
      console.error("[revenuecat] webhook received but REVENUECAT_WEBHOOK_AUTH is not set");
      return c.json({ error: "NOT_CONFIGURED" }, 503);
    }
    if (!authorised(c.req.header("Authorization"))) {
      return c.json({ error: "UNAUTHORIZED" }, 401);
    }

    const body = (await c.req.json().catch(() => null)) as { event?: RevenueCatEvent } | null;
    const event = body?.event;
    if (!event?.type) return c.json({ error: "BAD_REQUEST" }, 400);

    if (event.type === "TEST") return c.json({ ok: true, ignored: "TEST" });

    if (event.type === "TRANSFER") {
      // Revoke from the accounts the purchase left. Granting to the account
      // it arrived at would need an expiry this event does not carry, and
      // granting without one is granting on doubt.
      const from = (event.transferred_from ?? []).filter((id) => !isAnonymous(id));
      const revoked = from.length
        ? await db.subscription.updateMany({
            where: { userId: { in: from } },
            data: { entitlementActive: false, willRenew: false },
          })
        : { count: 0 };
      return c.json({ ok: true, applied: "TRANSFER", revoked: revoked.count });
    }

    const userId = await resolveUserId(event);
    if (!userId) {
      console.warn(`[revenuecat] ${event.type} for no known account; acknowledged and ignored`);
      return c.json({ ok: true, ignored: "UNKNOWN_USER" });
    }

    const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms) : null;
    const identity = {
      // Only bind the RevenueCat id when it is this account's own id; an
      // alias belonging to someone else would collide on the unique column.
      ...(event.app_user_id === userId ? { revenueCatUserId: userId } : {}),
      productId: event.product_id ?? null,
      store: storeName(event.store),
    };

    if (GRANTS.has(event.type)) {
      if (!carriesPro(event)) return c.json({ ok: true, ignored: "OTHER_ENTITLEMENT" });

      const lifetime = expiresAt === null;
      const data = {
        ...identity,
        entitlementActive: true,
        expiresAt,
        plan: lifetime ? ("LIFETIME" as const) : ("MONTHLY" as const),
        willRenew: !lifetime && event.type !== "NON_RENEWING_PURCHASE",
      };
      await db.subscription.upsert({
        where: { userId },
        create: { userId, ...data },
        update: data,
      });
      return c.json({ ok: true, applied: event.type });
    }

    if (event.type === "CANCELLATION") {
      // Cancelling stops renewal, not access. The entitlement runs to
      // expiresAt, and isPro refuses it the moment that passes even if the
      // EXPIRATION event never arrives.
      await db.subscription.updateMany({ where: { userId }, data: { willRenew: false } });
      return c.json({ ok: true, applied: "CANCELLATION" });
    }

    if (event.type === "EXPIRATION") {
      // Webhooks can arrive out of order. An expiration for a period that a
      // renewal has already extended past must not switch Pro off.
      const current = await db.subscription.findUnique({
        where: { userId },
        select: { expiresAt: true },
      });
      if (current?.expiresAt && expiresAt && current.expiresAt.getTime() > expiresAt.getTime()) {
        return c.json({ ok: true, ignored: "STALE_EXPIRATION" });
      }
      await db.subscription.updateMany({
        where: { userId },
        data: { entitlementActive: false, willRenew: false },
      });
      return c.json({ ok: true, applied: "EXPIRATION" });
    }

    // BILLING_ISSUE, SUBSCRIPTION_PAUSED and anything newer: the store's
    // grace period governs access, and expiresAt already encodes it.
    return c.json({ ok: true, ignored: event.type });
  });
}
