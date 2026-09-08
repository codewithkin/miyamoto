import { env } from "@miyamoto/env/server";

/**
 * Transactional mail.
 *
 * Sent through Resend's REST API directly rather than through its SDK — one
 * fetch, no dependency, and nothing to keep in step with a client library
 * for the two messages this app sends.
 *
 * Without RESEND_API_KEY nothing is sent and `sendMail` says so in its
 * return value. Callers must not report success on the strength of having
 * called this: a deletion page that claims an email is on its way when no
 * provider is configured is worse than one that admits it.
 */

export type MailResult =
  | { sent: true }
  | { sent: false; reason: "NOT_CONFIGURED" | "FAILED"; detail?: string };

const FROM = "Miyamoto <no-reply@miyamoto.app>";

export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
}): Promise<MailResult> {
  if (!env.RESEND_API_KEY) {
    return { sent: false, reason: "NOT_CONFIGURED" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [opts.to],
        subject: opts.subject,
        text: opts.text,
      }),
    });

    if (!res.ok) {
      return { sent: false, reason: "FAILED", detail: `HTTP ${res.status}` };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: "FAILED", detail: e instanceof Error ? e.message : undefined };
  }
}

/**
 * The deletion confirmation.
 *
 * Plain text on purpose. It is a destructive, time-limited link, and the
 * fewer places it can be mangled or re-rendered by a client, the better.
 */
export function deletionEmail(token: string) {
  const url = `${env.WEB_URL ?? "https://miyamoto.app"}/delete-account/confirm?token=${token}`;

  return {
    subject: "Confirm you want your Miyamoto account deleted",
    text: [
      "Someone asked to delete the Miyamoto account for this address.",
      "",
      "If that was you, open this link within 24 hours to confirm. Nothing is",
      "deleted until you do.",
      "",
      url,
      "",
      "Everything goes: your account, every conversation and trial, your",
      "streak, your Bushido score and the Masters you earned. It does not",
      "come back.",
      "",
      "If you have a subscription, cancel it in your App Store or Play Store",
      "settings — deleting the account does not stop billing.",
      "",
      "If this wasn't you, ignore this email and nothing will happen. The",
      "link expires on its own.",
      "",
      "— Miyamoto",
    ].join("\n"),
  };
}
