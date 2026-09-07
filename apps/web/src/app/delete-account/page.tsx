"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { SiteShell } from "@/components/site-shell";
import { trpc } from "@/utils/trpc";

/**
 * Account deletion — the web route Google Play requires.
 *
 * Submitting starts the process; it does not finish it. The form is
 * unauthenticated, so erasing on submission would let anyone delete an
 * account by typing its email address. A confirmation link goes to the
 * address on the account instead, and the page says so plainly rather than
 * implying the data is already gone.
 */

const DELETED = [
  "Your account, name and email",
  "Every conversation, trial, journal note and attachment",
  "Your streak, Bushido score and earned Masters",
];

const TIMELINE = [
  { when: "Right away", what: "Sign-in stops working and the account is locked." },
  { when: "Within 72 hours", what: "Conversations, trials and attachments are erased from live systems." },
  { when: "Within 30 days", what: "Backups roll over and the last copies are gone." },
];

export default function DeleteAccountPage() {
  const [email, setEmail] = useState("");
  const [understood, setUnderstood] = useState(false);

  const request = useMutation(trpc.support.requestDeletion.mutationOptions());
  const canSubmit = email.includes("@") && understood && !request.isPending;

  return (
    <SiteShell>
      <div style={{ maxWidth: "var(--measure-narrow)", margin: "0 auto", padding: "72px 24px" }}>
        <p style={eyebrow}>Your data</p>
        <h1
          style={{
            fontFamily: "var(--font-mincho)",
            fontSize: "clamp(34px, 5vw, var(--size-legal))",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            margin: "12px 0 16px",
          }}
        >
          Delete your account and data
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--size-body-lg)", margin: "0 0 40px" }}>
          You can do this in the app — Profile → Settings → Delete account — or start it here with
          the email you signed in with.
        </p>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ ...eyebrow, marginBottom: 14 }}>What gets deleted</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {DELETED.map((d) => (
              <div key={d} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span
                  style={{
                    width: 14,
                    height: 4,
                    borderRadius: "var(--radius-blade)",
                    background: "var(--green)",
                    marginTop: 9,
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: "var(--text-body)" }}>{d}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginTop: 4 }}>
              <span
                style={{
                  width: 14,
                  height: 4,
                  borderRadius: "var(--radius-blade)",
                  background: "var(--gold)",
                  marginTop: 9,
                  flexShrink: 0,
                }}
              />
              <span style={{ color: "var(--text-muted)", fontSize: 15 }}>
                Purchase receipts are kept up to 7 years for tax and fraud law, with no conversation
                content attached.
              </span>
            </div>
          </div>
        </section>

        {request.isSuccess ? (
          <div
            style={{
              background: "var(--ink-surface)",
              border: "1px solid var(--indigo)",
              borderRadius: "var(--radius-lg)",
              padding: 24,
              marginBottom: 40,
            }}
          >
            <h2 style={{ ...eyebrow, color: "var(--indigo-light)", marginBottom: 8 }}>
              Check your email
            </h2>
            <p style={{ margin: 0, color: "var(--text-body)", lineHeight: 1.7 }}>
              {request.data.message}
            </p>
            <p style={{ margin: "12px 0 0", color: "var(--text-faint)", fontSize: 14 }}>
              Nothing has been deleted yet. The link is what starts the erase.
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (canSubmit) request.mutate({ email });
            }}
            style={{
              display: "grid",
              gap: 18,
              marginBottom: 40,
              background: "var(--ink-surface)",
              border: "1px solid var(--ink-border)",
              borderRadius: "var(--radius-xl)",
              padding: 28,
            }}
          >
            <h2 style={{ ...eyebrow, margin: 0 }}>Request deletion</h2>

            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontSize: 15, color: "var(--text-body)" }}>Email on the account</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </label>

            <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
                style={{ marginTop: 4, accentColor: "var(--red)", width: 18, height: 18 }}
              />
              <span style={{ fontSize: 15, color: "var(--text-body)", lineHeight: 1.6 }}>
                I understand this can&apos;t be undone and my 30-day path will not be recoverable.
              </span>
            </label>

            {request.isError ? (
              <p style={{ color: "var(--red)", fontSize: 14, margin: 0 }}>
                That didn&apos;t go through. Email privacy@miyamoto.app from the address on your
                account instead.
              </p>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                background: canSubmit ? "var(--red-tint)" : "var(--ink-inset)",
                color: canSubmit ? "var(--red)" : "var(--text-faint)",
                border: `1px solid ${canSubmit ? "var(--red)" : "var(--ink-border)"}`,
                padding: "16px 32px",
                borderRadius: "var(--radius-pill)",
                fontSize: 16,
                fontWeight: 700,
                cursor: canSubmit ? "pointer" : "not-allowed",
                fontFamily: "inherit",
              }}
            >
              {request.isPending ? "Starting…" : "Delete my account"}
            </button>
          </form>
        )}

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ ...eyebrow, marginBottom: 16 }}>Timeline</h2>
          <div style={{ display: "grid", gap: 16 }}>
            {TIMELINE.map((t) => (
              <div key={t.when} style={{ display: "grid", gap: 4 }}>
                <span
                  style={{
                    fontFamily: "var(--font-condensed)",
                    fontSize: 15,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--indigo-light)",
                  }}
                >
                  {t.when}
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: 15 }}>{t.what}</span>
              </div>
            ))}
          </div>
        </section>

        <aside
          style={{
            background: "var(--gold-tint-deep)",
            border: "1px solid var(--gold-tint)",
            borderRadius: "var(--radius-lg)",
            padding: 20,
            marginBottom: 24,
          }}
        >
          <h2 style={{ ...eyebrow, color: "var(--parchment)", marginBottom: 8 }}>
            Cancel your subscription first
          </h2>
          <p style={{ margin: 0, color: "var(--text-body)", fontSize: 15, lineHeight: 1.7 }}>
            Deleting the account doesn&apos;t cancel billing — Apple and Google own that. Cancel in
            your store settings, then delete here.
          </p>
        </aside>

        <p style={{ color: "var(--text-faint)", fontSize: 15, margin: 0 }}>
          Prefer email? Write to{" "}
          <a href="mailto:privacy@miyamoto.app" style={linkStyle}>
            privacy@miyamoto.app
          </a>{" "}
          from the address on your account and we&apos;ll confirm within two business days.
        </p>
      </div>
    </SiteShell>
  );
}

const eyebrow: React.CSSProperties = {
  fontFamily: "var(--font-condensed)",
  fontSize: 12,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "var(--text-faint)",
  margin: 0,
};

const inputStyle: React.CSSProperties = {
  background: "var(--ink-inset)",
  border: "1px solid var(--ink-border)",
  borderRadius: "var(--radius-md)",
  padding: "14px 16px",
  color: "var(--text-primary)",
  fontSize: 16,
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box",
};

const linkStyle: React.CSSProperties = {
  color: "var(--indigo-light)",
  textDecoration: "underline",
  textUnderlineOffset: 3,
};
