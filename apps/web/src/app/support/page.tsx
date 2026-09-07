"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { SiteShell } from "@/components/site-shell";
import { trpc } from "@/utils/trpc";

/**
 * Support — the reachable URL the App Store requires.
 *
 * The crisis notice sits above the form rather than below it, because
 * someone who needs it should not have to fill in a form to find it.
 */

const TOPICS = [
  { value: "BILLING", label: "Billing" },
  { value: "BUG", label: "A bug" },
  { value: "MY_DATA", label: "My data" },
  { value: "REPORT_CONTENT", label: "Report content" },
  { value: "OTHER", label: "Something else" },
] as const;

const FAQ = [
  {
    q: "How do I cancel my subscription?",
    a: "In your App Store or Play Store account settings — cancelling in the app doesn't stop billing.",
  },
  {
    q: "I paid but Pro isn't active",
    a: "Tap Restore purchase on the paywall. If it still doesn't unlock, send us the store receipt.",
  },
  {
    q: "Can I change my daily reminder?",
    a: "Profile → Trial reminders. You can also switch it off entirely.",
  },
  {
    q: "Are the Masters real people?",
    a: "No. They're AI interpretations based on the historical record, and quotes may be paraphrased.",
  },
];

export default function SupportPage() {
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<(typeof TOPICS)[number]["value"]>("BUG");
  const [details, setDetails] = useState("");

  const send = useMutation(trpc.support.sendMessage.mutationOptions());
  const canSend = email.includes("@") && details.trim().length >= 10 && !send.isPending;

  return (
    <SiteShell>
      <div
        style={{
          maxWidth: "var(--measure-narrow)",
          margin: "0 auto",
          padding: "72px 24px",
        }}
      >
        <p style={eyebrow}>Support</p>
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
          Something wrong? Tell us plainly.
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--size-body-lg)", margin: "0 0 40px" }}>
          One person reads every message. Replies within two business days, usually the same day.
        </p>

        {/* Above the form, deliberately. */}
        <aside
          style={{
            background: "var(--ink-surface)",
            border: "1px solid var(--red-tint)",
            borderRadius: "var(--radius-lg)",
            padding: 20,
            marginBottom: 40,
          }}
        >
          <h2 style={{ ...eyebrow, color: "var(--red)", marginBottom: 8 }}>In crisis?</h2>
          <p style={{ margin: 0, color: "var(--text-body)", fontSize: 15, lineHeight: 1.7 }}>
            Miyamoto isn&apos;t a crisis service and no one monitors messages in real time. If you
            or someone else is in danger, contact your local emergency number or a crisis line now.
          </p>
        </aside>

        {send.isSuccess ? (
          <div
            style={{
              background: "var(--ink-surface)",
              border: "1px solid var(--green)",
              borderRadius: "var(--radius-lg)",
              padding: 24,
              marginBottom: 48,
            }}
          >
            <h2 style={{ ...eyebrow, color: "var(--green-fg)", marginBottom: 8 }}>Sent</h2>
            <p style={{ margin: 0, color: "var(--text-body)" }}>
              We have it. You&apos;ll hear back at {email} within two business days.
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (canSend) send.mutate({ email, topic, details });
            }}
            style={{ display: "grid", gap: 20, marginBottom: 48 }}
          >
            <Field label="Your email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </Field>

            <Field label="What's this about?">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {TOPICS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTopic(t.value)}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "var(--radius-pill)",
                      border: `1px solid ${topic === t.value ? "var(--indigo-bright)" : "var(--ink-border)"}`,
                      background: topic === t.value ? "var(--indigo)" : "var(--ink-surface)",
                      color: topic === t.value ? "var(--text-primary)" : "var(--text-muted)",
                      fontSize: 15,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Details">
              <textarea
                required
                minLength={10}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="What happened, what you expected, and which device you're on…"
                rows={6}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              />
            </Field>

            {send.isError ? (
              <p style={{ color: "var(--red)", fontSize: 14, margin: 0 }}>
                That didn&apos;t send. Email support@miyamoto.app instead and we&apos;ll pick it up
                there.
              </p>
            ) : null}

            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <button
                type="submit"
                disabled={!canSend}
                style={{
                  background: canSend ? "var(--indigo)" : "var(--ink-inset)",
                  color: canSend ? "var(--text-primary)" : "var(--text-faint)",
                  border: "none",
                  padding: "16px 32px",
                  borderRadius: "var(--radius-pill)",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: canSend ? "pointer" : "not-allowed",
                  fontFamily: "inherit",
                }}
              >
                {send.isPending ? "Sending…" : "Send message"}
              </button>
              <span style={{ color: "var(--text-faint)", fontSize: 14 }}>
                or email{" "}
                <a href="mailto:support@miyamoto.app" style={linkStyle}>
                  support@miyamoto.app
                </a>
              </span>
            </div>
          </form>
        )}

        <h2
          style={{
            fontFamily: "var(--font-mincho)",
            fontSize: "var(--size-title)",
            color: "var(--text-primary)",
            margin: "0 0 20px",
          }}
        >
          Before you write
        </h2>
        <div style={{ display: "grid", gap: 12 }}>
          {FAQ.map((f) => (
            <div
              key={f.q}
              style={{
                background: "var(--ink-surface)",
                border: "1px solid var(--ink-border)",
                borderRadius: "var(--radius-md)",
                padding: 18,
              }}
            >
              <h3 style={{ fontSize: 16, color: "var(--text-primary)", margin: "0 0 6px" }}>
                {f.q}
              </h3>
              <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={{ fontSize: 15, color: "var(--text-body)" }}>{label}</span>
      {children}
    </label>
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
