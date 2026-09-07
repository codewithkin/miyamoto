import type { Metadata } from "next";
import Link from "next/link";

import { Clause, LegalPage } from "@/components/legal";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What Miyamoto collects, why, who else sees it, how long we keep it, and how to delete it.",
};

const CONTENTS = [
  { id: "what-we-collect", label: "What we collect" },
  { id: "why", label: "Why we collect it" },
  { id: "who-else", label: "Who else sees it" },
  { id: "how-long", label: "How long we keep it" },
  { id: "your-rights", label: "Your rights" },
  { id: "children", label: "Children" },
  { id: "security", label: "Security & transfers" },
  { id: "contact", label: "Contact" },
];

const COLLECTED = [
  {
    label: "Account",
    body: "Name and email from Google or Apple sign-in. No password is ever created or stored.",
  },
  {
    label: "Your writing",
    body: "Messages you send, trials you accept, journal notes and quiz answers — stored so the app can continue the conversation.",
  },
  {
    label: "Attachments",
    body: "Images you attach are processed for context and deleted from our servers within 24 hours unless you turn on “keep image after answer”.",
  },
  {
    label: "Device & usage",
    body: "App version, OS, crash logs, and which screens are opened — used to fix bugs and understand which features earn their place.",
  },
  {
    label: "Purchases",
    body: "A receipt token from Apple or Google confirming your subscription state. We never see your card details.",
  },
];

export default function PrivacyPage() {
  return (
    <SiteShell>
      <LegalPage
        title="Privacy Policy"
        updated="Last updated 12 August 2026 · Founderling Ltd. is the data controller"
        summary="We store your name, email, your conversations and your trial history so the app works and remembers you. We don't sell your data and we don't use your conversations for advertising. Images you attach are read once for context and deleted. You can export or delete everything, any time, and the account is gone within 30 days."
        contents={CONTENTS}
      >
        <Clause id="what-we-collect" title="What we collect">
          <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
            {COLLECTED.map((c) => (
              <div
                key={c.label}
                style={{
                  background: "var(--ink-surface)",
                  border: "1px solid var(--ink-border)",
                  borderRadius: "var(--radius-md)",
                  padding: 18,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-condensed)",
                    fontSize: 12,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--indigo-light)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  {c.label}
                </span>
                <span style={{ fontSize: 15, color: "var(--text-muted)" }}>{c.body}</span>
              </div>
            ))}
          </div>
        </Clause>

        <Clause id="why" title="Why we collect it">
          <p>
            To run the app you asked for (contract), to keep it working and safe (legitimate
            interest), and to send you the trial reminders you enabled (consent — withdraw any time
            in Settings). We do not profile you for advertising and we do not use your conversations
            to train third-party models.
          </p>
        </Clause>

        <Clause id="who-else" title="Who else sees it">
          <p>
            Only the processors we need: our AI provider to generate a response, our hosting and
            database provider to store it, crash reporting, and the app stores for billing. Each is
            bound by a data-processing agreement. We disclose data to authorities only where the law
            requires it. We never sell personal data.
          </p>
        </Clause>

        <Clause id="how-long" title="How long we keep it">
          <p>
            Conversations and trials stay while your account is open. Delete your account and
            everything is erased within 30 days, except records we must keep for tax and fraud
            purposes (receipts, up to 7 years) and anonymous aggregate counts that can&apos;t
            identify you.
          </p>
        </Clause>

        <Clause id="your-rights" title="Your rights">
          <p>
            You can access, export, correct or delete your data, object to processing, or withdraw
            consent — from Settings in the app, from{" "}
            <Link href="/delete-account" style={linkStyle}>
              our deletion page
            </Link>
            , or by emailing{" "}
            <a href="mailto:privacy@miyamoto.app" style={linkStyle}>
              privacy@miyamoto.app
            </a>
            . If you&apos;re in the EU/UK you may also complain to your local data protection
            authority.
          </p>
        </Clause>

        <Clause id="children" title="Children">
          <p>
            The app is rated for teens and up and is not directed at children under 13. We
            don&apos;t knowingly collect their data; if you believe a child has an account, email us
            and we&apos;ll remove it.
          </p>
        </Clause>

        <Clause id="security" title="Security & transfers">
          <p>
            Data is encrypted in transit and at rest, and access is limited to staff who need it.
            Our providers may process data outside your country under standard contractual clauses
            or an equivalent safeguard.
          </p>
        </Clause>

        <Clause id="contact" title="Contact">
          <p>
            <a href="mailto:privacy@miyamoto.app" style={linkStyle}>
              privacy@miyamoto.app
            </a>{" "}
            · Founderling Ltd., Nairobi, Kenya
          </p>
        </Clause>
      </LegalPage>
    </SiteShell>
  );
}

const linkStyle: React.CSSProperties = {
  color: "var(--indigo-light)",
  textDecoration: "underline",
  textUnderlineOffset: 3,
};
