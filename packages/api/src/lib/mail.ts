import { env } from "@miyamoto/env/server";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Transactional mail, over SMTP.
 *
 * `sendMail` never throws and never reports failure to the caller. A bad
 * credential, an unreachable host or a rejected recipient is logged with
 * enough detail to diagnose from deployment logs, and the caller carries on
 * as though the message went out.
 *
 * That is deliberate. The one route that sends mail is account deletion,
 * where the response must look identical whether or not the address has an
 * account — otherwise the page becomes a way to test which emails are
 * registered. Branching the reply on delivery success would leak exactly
 * that, because delivery is only ever attempted for addresses that exist.
 *
 * The cost is that a user whose email silently failed is left waiting, so
 * the copy on both surfaces names privacy@miyamoto.app as the fallback for
 * anyone whose link never arrives.
 */

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null;

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    // 465 is implicit TLS; everything else upgrades with STARTTLS.
    secure: (env.SMTP_PORT ?? 587) === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });

  return transporter;
}

const FROM = () => env.SMTP_FROM ?? "Miyamoto <no-reply@miyamoto.app>";

/**
 * Sends a message. Always resolves.
 *
 * Failures are logged under [mail] and swallowed — see the note above for
 * why the caller is not told.
 */
export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const tx = getTransporter();

  if (!tx) {
    console.error(
      "[mail] not sent: SMTP is not configured (need SMTP_HOST, SMTP_USER, SMTP_PASS)",
      { to: opts.to, subject: opts.subject },
    );
    return;
  }

  try {
    const info = await tx.sendMail({
      from: FROM(),
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
    });

    // A 2xx from the server is not the same as a delivered message: a
    // recipient can be accepted at the envelope and rejected afterwards.
    if (info.rejected?.length) {
      console.error("[mail] recipient rejected", {
        to: opts.to,
        rejected: info.rejected,
        response: info.response,
      });
      return;
    }

    console.info("[mail] sent", { to: opts.to, subject: opts.subject, id: info.messageId });
  } catch (e) {
    console.error("[mail] send failed", {
      to: opts.to,
      subject: opts.subject,
      error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    });
  }
}

/**
 * The deletion confirmation.
 *
 * Plain text on purpose. It is a destructive, time-limited link, and the
 * fewer places it can be mangled or re-rendered by a mail client, the
 * better.
 */
export function deletionEmail(token: string) {
  const base = env.WEB_URL ?? "https://miyamoto.app";
  const url = `${base}/delete-account/confirm?token=${token}`;

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
