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
    body: "Your name, email and profile picture link from Google sign-in, and the sign-in sessions that keep you logged in (with the device and IP address each came from, for security). No password is created or stored for your account. The only accounts with a password are ones we create ourselves, such as the one app-store reviewers use.",
  },
  {
    label: "Your writing",
    body: "Messages you send to the Masters and their replies, the trials and charges you accept, your onboarding answers and your time zone — stored so the app can continue the conversation and count your days correctly.",
  },
  {
    label: "Photos",
    body: "The app asks for camera or photo access only at the moment you attach a photo. Photos are not uploaded to our servers.",
  },
  {
    label: "Notifications",
    body: "Only if you allow them. Your phone’s push token, a device address issued through Google’s Firebase Cloud Messaging and Expo, so a Master’s letter can reach you after you’ve left the app, along with the reminders you turn on. It is deleted when you sign out on that phone or delete your account.",
  },
  {
    label: "Anonymous analytics",
    body: "A small number of anonymous events — that the welcome screen was seen, that sign-in or onboarding finished, that a message was sent to a Master — plus the app version and operating system. They are counted with TelemetryDeck against a random ID created on your phone and hashed before it leaves it. They never contain your name, email, account, or anything you write, and they are not linked to your account.",
  },
  {
    label: "Ads",
    body: "Only if you choose to watch one for three more questions. Ads are served by Google AdMob, non-personalised only. To show the ad, measure it and prevent fraud, Google may collect your device’s advertising ID, IP address and how you interacted with the ad.",
  },
  {
    label: "Purchases",
    body: "A receipt from Google Play or the App Store, handled by RevenueCat, confirming your subscription state. We never see your card details.",
  },
];

export default function PrivacyPage() {
  return (
    <SiteShell>
      <LegalPage
        title="Privacy Policy"
        updated="Last updated 11 September 2026 · Founderling Ltd. is the data controller"
        summary="We store your name, email, your conversations and your trial history so the app works and remembers you. We count a few anonymous events to find where people get stuck — never your words, never linked to you. We don't sell your data and we don't use your conversations for advertising. You can export or delete everything, any time, and the account is gone within 30 days."
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
            interest), and to send you the reminders and letter notifications you allowed (consent,
            withdrawn any time in Settings or your phone&apos;s notification settings). Anonymous analytics tell us where people get stuck, so we can fix it
            (legitimate interest); they cannot identify you. We do not profile you for advertising
            and we do not use your conversations to train third-party models.
          </p>
        </Clause>

        <Clause id="who-else" title="Who else sees it">
          <p>
            Only the processors we need: our AI provider to generate a Master&apos;s reply, our
            hosting and database provider to store it, our email provider for account messages,
            RevenueCat and the app stores for billing, Expo and Google Firebase Cloud Messaging to
            deliver notifications you allowed, TelemetryDeck for anonymous analytics, and Google
            AdMob only when you choose to watch an ad. Each is bound by a data-processing
            agreement. We disclose data to authorities only where the law requires it. We never
            sell personal data.
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
