"use client";

import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

import { SiteShell } from "@/components/site-shell";
import { trpc } from "@/utils/trpc";

/**
 * The other half of the deletion route.
 *
 * The token arrives in the emailed link. Confirming here is what actually
 * erases the account — the request page only ever created the token.
 *
 * The button is deliberately not auto-clicked on load: a link preview
 * fetcher or an over-eager mail client following the URL must not be able
 * to destroy someone's account on their behalf.
 */
export function ConfirmDeletion() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [confirmed, setConfirmed] = useState(false);

  const confirm = useMutation(trpc.support.confirmDeletion.mutationOptions());

  const missingToken = token.length < 16;
  const done = confirm.isSuccess && confirm.data.deleted;
  const rejected = confirm.isSuccess && !confirm.data.deleted;

  return (
    <SiteShell>
      <div style={{ maxWidth: "var(--measure-narrow)", margin: "0 auto", padding: "72px 24px" }}>
        <p style={eyebrow}>Your data</p>
        <h1
          style={{
            fontFamily: "var(--font-mincho)",
            fontSize: "clamp(32px, 4.5vw, var(--size-legal))",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            margin: "12px 0 16px",
          }}
        >
          {done ? "Your account is gone." : "Confirm deletion"}
        </h1>

        {done ? (
          <>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--size-body-lg)", margin: "0 0 32px" }}>
              Sign-in has stopped working. Conversations, trials and attachments are erased from
              live systems within 72 hours, and the last backup copies are gone within 30 days.
            </p>
            <aside style={noteStyle}>
              <p style={{ margin: 0, color: "var(--text-body)", fontSize: 15, lineHeight: 1.7 }}>
                If you had a subscription, cancel it in your App Store or Play Store settings —
                deleting the account does not stop billing.
              </p>
            </aside>
            <Link href="/" style={{ ...linkStyle, display: "inline-block", marginTop: 32 }}>
              Back to miyamoto.app
            </Link>
          </>
        ) : missingToken ? (
          <p style={{ color: "var(--text-muted)", fontSize: "var(--size-body-lg)", margin: 0 }}>
            This link is missing its confirmation token. Start again from the{" "}
            <Link href="/delete-account" style={linkStyle}>
              deletion page
            </Link>
            .
          </p>
        ) : rejected ? (
          <>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--size-body-lg)", margin: "0 0 24px" }}>
              This link has expired or has already been used. Links are good for 24 hours and work
              once.
            </p>
            <Link href="/delete-account" style={linkStyle}>
              Request a new one
            </Link>
          </>
        ) : (
          <>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--size-body-lg)", margin: "0 0 32px" }}>
              This is the last step. Everything below goes, and none of it comes back.
            </p>

            <div style={{ display: "grid", gap: 10, marginBottom: 32 }}>
              {[
                "Your account, name and email",
                "Every conversation, trial, journal note and attachment",
                "Your streak, Bushido score and earned Masters",
              ].map((d) => (
                <div key={d} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span
                    style={{
                      width: 14,
                      height: 4,
                      borderRadius: "var(--radius-blade)",
                      background: "var(--red)",
                      marginTop: 9,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: "var(--text-body)" }}>{d}</span>
                </div>
              ))}
            </div>

            <label
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                cursor: "pointer",
                marginBottom: 24,
              }}
            >
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                style={{ marginTop: 4, accentColor: "var(--red)", width: 18, height: 18 }}
              />
              <span style={{ fontSize: 15, color: "var(--text-body)", lineHeight: 1.6 }}>
                I&apos;m sure. Delete my account and everything in it.
              </span>
            </label>

            {confirm.isError ? (
              <p style={{ color: "var(--red)", fontSize: 14, margin: "0 0 16px" }}>
                That didn&apos;t go through. Email privacy@miyamoto.app from the address on your
                account instead.
              </p>
            ) : null}

            <button
              type="button"
              disabled={!confirmed || confirm.isPending}
              onClick={() => confirm.mutate({ token })}
              style={{
                background: confirmed ? "var(--red-tint)" : "var(--ink-inset)",
                color: confirmed ? "var(--red)" : "var(--text-faint)",
                border: `1px solid ${confirmed ? "var(--red)" : "var(--ink-border)"}`,
                padding: "16px 32px",
                borderRadius: "var(--radius-pill)",
                fontSize: 16,
                fontWeight: 700,
                cursor: confirmed && !confirm.isPending ? "pointer" : "not-allowed",
                fontFamily: "inherit",
              }}
            >
              {confirm.isPending ? "Deleting…" : "Delete everything"}
            </button>
          </>
        )}
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

const noteStyle: React.CSSProperties = {
  background: "var(--gold-tint-deep)",
  border: "1px solid var(--gold-tint)",
  borderRadius: "var(--radius-lg)",
  padding: 20,
};

const linkStyle: React.CSSProperties = {
  color: "var(--indigo-light)",
  textDecoration: "underline",
  textUnderlineOffset: 3,
};
