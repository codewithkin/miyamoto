import type { Metadata } from "next";
import Link from "next/link";

import { Clause, LegalPage } from "@/components/legal";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The agreement between you and Founderling Ltd. for your use of Miyamoto.",
};

const CONTENTS = [
  { id: "who-we-are", label: "1 · Who we are" },
  { id: "what-the-app-is", label: "2 · What the app is" },
  { id: "your-account", label: "3 · Your account" },
  { id: "subscriptions", label: "4 · Subscriptions & refunds" },
  { id: "acceptable-use", label: "5 · Acceptable use" },
  { id: "content", label: "6 · Content & ownership" },
  { id: "not-medical", label: "7 · Not medical advice" },
  { id: "liability", label: "8 · Liability & changes" },
  { id: "contact", label: "9 · Contact" },
];

export default function TermsPage() {
  return (
    <SiteShell>
      <LegalPage
        title="Terms of Service"
        updated="Last updated 12 August 2026 · effective on download"
        summary="Miyamoto is an AI writing tool, not a person and not a therapist. Be 13 or older. Pay for what you subscribe to; cancel through your app store. Don't abuse the service or resell its output. We can't promise the advice is right for you — you decide what to act on."
        contents={CONTENTS}
      >
        <Clause id="who-we-are" title="1 · Who we are">
          <p>
            Miyamoto — Meet the Masters (“the app”) is operated by Founderling Ltd., registered in
            Kenya, contactable at{" "}
            <a href="mailto:support@miyamoto.app" style={linkStyle}>
              support@miyamoto.app
            </a>
            . These terms are the agreement between you and us for your use of the app and this
            site.
          </p>
        </Clause>

        <Clause id="what-the-app-is" title="2 · What the app is">
          <p>
            The app generates written responses in the styles of historical figures using a large
            language model. The figures are dramatised interpretations based on public historical
            record. They are not the real people, their estates, or their representatives, and
            quotations may be paraphrased. Responses are generated, may be inaccurate, and are
            provided for reflection and general guidance only.
          </p>
        </Clause>

        <Clause id="your-account" title="3 · Your account">
          <p>
            You sign in with Google or Apple; we never ask for a password. You must be at least 13
            (or the minimum age in your country) to hold an account, and you&apos;re responsible for
            what happens under it. You can delete your account at any time from Profile → Settings →
            Delete account, or from{" "}
            <Link href="/delete-account" style={linkStyle}>
              our deletion page
            </Link>
            .
          </p>
        </Clause>

        <Clause id="subscriptions" title="4 · Subscriptions & refunds">
          <p>
            Free accounts include three questions per day. Miyamoto Pro is sold as a monthly
            subscription ($9.99/month, auto-renewing until cancelled) or a one-time lifetime
            purchase ($149). Prices vary by region and store. Free trials convert to a paid term
            unless cancelled at least 24 hours before they end.
          </p>
          <p>
            All billing is handled by Apple or Google. Manage or cancel in your App Store or Play
            Store account settings — cancelling in the app alone does not stop billing. Refunds are
            granted by the store under its own policy; we can&apos;t issue them directly.
          </p>
        </Clause>

        <Clause id="acceptable-use" title="5 · Acceptable use">
          <p>
            Don&apos;t use the app to seek help committing crimes or harming people, to upload other
            people&apos;s private material, to scrape or resell generated content, to
            reverse-engineer the service, or to impersonate us. We may suspend accounts that do. If
            someone is in immediate danger, contact your local emergency service — not the app.
          </p>
        </Clause>

        <Clause id="content" title="6 · Content & ownership">
          <p>
            What you write stays yours. You grant us a limited licence to process it so the app can
            answer you. The app itself — its name, design, artwork and the way the Masters are
            written — belongs to us. Responses you receive are yours to use personally; don&apos;t
            publish them as though a historical figure said them.
          </p>
        </Clause>

        <Clause id="not-medical" title="7 · Not medical advice">
          <p>
            Miyamoto is not a medical device and does not provide medical, psychological, legal or
            financial advice. It is not a crisis service and no human reviews your messages in real
            time. If you&apos;re struggling with your mental health, please speak to a qualified
            professional or a local crisis line.
          </p>
        </Clause>

        <Clause id="liability" title="8 · Liability & changes">
          <p>
            The app is provided “as is”. To the extent the law allows, we&apos;re not liable for
            decisions you take after reading a response, or for indirect losses; where liability
            can&apos;t be excluded it is limited to what you paid us in the previous twelve months.
            We may update these terms and will post the new date here; material changes get an
            in-app notice. These terms are governed by Kenyan law, without affecting consumer rights
            you have at home.
          </p>
        </Clause>

        <Clause id="contact" title="9 · Contact">
          <p>
            Questions about these terms?{" "}
            <a href="mailto:support@miyamoto.app" style={linkStyle}>
              support@miyamoto.app
            </a>{" "}
            — we reply within two business days.
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
