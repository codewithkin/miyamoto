import db from "@miyamoto/db";
import { env } from "@miyamoto/env/server";

/**
 * Push notifications, through Expo's push service (plan 13).
 *
 * The phone registers its Expo push token (account.registerPushToken), and
 * the server sends to every token a person holds. Expo relays to Firebase
 * Cloud Messaging on Android, which is why pushes need the app built with
 * the owner's google-services.json and the FCM key uploaded to EAS. Until
 * then the phone has no token to register, and this sends nothing.
 *
 * Never throws. A notification that doesn't go out is logged under [push];
 * whatever triggered it (a letter already saved) is never undone over it.
 */

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/** The Android channel letters arrive on. The app creates it (lib/notifications). */
export const LETTERS_CHANNEL = "letters";

export type PushMessage = {
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
};

/** Whether a string is shaped like an Expo push token, so junk is never stored. */
export function isExpoPushToken(token: string): boolean {
  return /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token);
}

/**
 * The start of a letter for a notification: whole words up to `max`
 * characters, then "…", the way messaging apps preview a message. A letter
 * that fits is shown whole, with no dots.
 */
export function previewOf(text: string, max = 90): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max + 1);
  const atWord = cut.lastIndexOf(" ");
  return `${(atWord > max * 0.6 ? cut.slice(0, atWord) : flat.slice(0, max)).replace(/[\s,;:.—-]+$/, "")}…`;
}

type Ticket = { status: "ok" | "error"; details?: { error?: string } };

/** Sends to every install the person has. Resolves to how many tokens took it. */
export async function sendPush(userId: string, message: PushMessage): Promise<number> {
  let tokens: string[];
  try {
    const rows = await db.pushToken.findMany({ where: { userId }, select: { token: true } });
    tokens = rows.map((r) => r.token);
  } catch (e) {
    // Most likely the table isn't there yet: a database not migrated since
    // push tokens were added. Nothing to send to.
    console.warn("[push] could not read push tokens", e);
    return 0;
  }
  if (tokens.length === 0) return 0;

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        ...(env.EXPO_ACCESS_TOKEN ? { authorization: `Bearer ${env.EXPO_ACCESS_TOKEN}` } : {}),
      },
      body: JSON.stringify(
        tokens.map((to) => ({
          to,
          title: message.title,
          body: message.body,
          data: message.data ?? {},
          channelId: message.channelId ?? LETTERS_CHANNEL,
          priority: "high",
          sound: "default",
        })),
      ),
    });
    if (!res.ok) {
      console.warn(`[push] Expo answered ${res.status}`);
      return 0;
    }
    const { data } = (await res.json()) as { data?: Ticket[] };
    // An uninstalled app's token is dead for good. Drop it, so it isn't
    // tried on every letter from now on.
    const dead = tokens.filter((_, i) => data?.[i]?.details?.error === "DeviceNotRegistered");
    if (dead.length) {
      await db.pushToken.deleteMany({ where: { token: { in: dead } } }).catch(() => {});
    }
    return (data ?? []).filter((t) => t.status === "ok").length;
  } catch (e) {
    console.warn("[push] send failed", e);
    return 0;
  }
}
