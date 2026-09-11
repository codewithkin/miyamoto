import db from "@miyamoto/db";
import { auth } from "@miyamoto/auth";
import { env } from "@miyamoto/env/server";

/**
 * The Google Play reviewer account (plan 14).
 *
 * Play's review needs a username and password that opens every part of
 * the app, paid content included, and its reviewers can't sign in with
 * Google accounts of their own. So on every start, when REVIEWER_EMAIL and
 * REVIEWER_PASSWORD are set, this makes sure that account:
 *
 *   - exists, with a verified email;
 *   - has a password credential with exactly that password (change the
 *     variable, restart, and the new one is in force);
 *   - is Pro for life, so nothing is behind a paywall they can't pay.
 *
 * It's left to go through onboarding like anyone else, and anything it does
 * in the app is kept between starts. Only its sign-in and plan are reset.
 *
 * The credential goes through Better Auth's own internal adapter and
 * password hasher, so it's stored exactly as a sign-up would store it. The
 * one value this file supplies itself is the credential's issuer, which the
 * library doesn't export. So after writing, it reads the credential back
 * through `findCredentialAccount`, the same lookup email sign-in uses. If a
 * Better Auth upgrade changes the format, the log says so here rather than
 * a reviewer finding out.
 *
 * Never throws: a missing reviewer account must not stop the server.
 */

/** Better Auth's issuer for local password credentials (`createLocalAccountIssuer("credential")`). */
const CREDENTIAL_ISSUER = "local:credential";

export async function ensureReviewerAccount(): Promise<void> {
  const email = env.REVIEWER_EMAIL?.toLowerCase();
  const password = env.REVIEWER_PASSWORD;
  if (!email || !password) return;

  try {
    const ctx = await auth.$context;
    const adapter = ctx.internalAdapter;

    const found = await adapter.findUserByEmail(email);
    const user =
      found?.user ??
      (await adapter.createUser(
        {
          email,
          name: env.REVIEWER_NAME ?? "Play Reviewer",
          emailVerified: true,
        },
        // The same provisioning source a sign-up records.
        { method: "email-password" },
      ));

    const credential = await adapter.findCredentialAccount(user.id);
    const current = credential?.password;
    const matches = current ? await ctx.password.verify({ hash: current, password }) : false;

    if (!matches) {
      const hash = await ctx.password.hash(password);
      if (credential) {
        await adapter.updatePassword(user.id, hash);
      } else {
        await adapter.linkAccount({
          userId: user.id,
          providerId: "credential",
          issuer: CREDENTIAL_ISSUER,
          accountId: user.id,
          password: hash,
        });
      }
      if (!(await adapter.findCredentialAccount(user.id))) {
        console.error(
          "[reviewer] the password was written but Better Auth can't find it: its credential format has changed. Update CREDENTIAL_ISSUER.",
        );
        return;
      }
    }

    // Pro for life, so Play's review reaches everything (its sign-in
    // declaration requires access to paid content).
    await db.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        plan: "LIFETIME",
        entitlementActive: true,
        expiresAt: null,
        store: "reviewer",
        productId: "reviewer",
      },
      update: { plan: "LIFETIME", entitlementActive: true, expiresAt: null },
    });

    console.log(`[reviewer] account ready${matches ? "" : " (password set)"}`);
  } catch (e) {
    console.error("[reviewer] could not prepare the reviewer account", e);
  }
}
