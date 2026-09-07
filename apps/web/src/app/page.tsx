import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

/**
 * The landing page.
 *
 * One promise, the loop, the library, the path, proof, price, download —
 * in that order, because the price only makes sense after the loop has
 * been explained and the proof only lands after the price is known.
 */

const MASTERS = [
  { name: "Musashi", era: "Duelist · 1584–1645", domains: "Career · fear · rivals" },
  { name: "Seneca", era: "Stoic · 4 BC–65 AD", domains: "Anxiety · loss · control" },
  { name: "Mandela", era: "Statesman · 1918–2013", domains: "Betrayal · conflict" },
  { name: "Marie Curie", era: "Physicist · 1867–1934", domains: "Focus · grind" },
  { name: "Sun Tzu", era: "General · 5th c. BC", domains: "Business · negotiation" },
];

const STEPS = [
  {
    n: "1",
    title: "Their story",
    body: "The moment in their own life that matched yours — told plainly, with the parts that hurt left in.",
  },
  {
    n: "2",
    title: "The lesson",
    body: "What it actually taught them. No affirmations, no “you've got this”.",
  },
  {
    n: "3",
    title: "Your trial",
    body: "One action, today, with a deadline. Mark it done and the streak grows.",
  },
];

const WOUNDS = [
  "Passed over at work",
  "Someone I trusted lied",
  "Can't stop procrastinating",
  "Scared of a conversation",
];

const ACTS = [
  { label: "Face it", days: "Days 1–7" },
  { label: "Control it", days: "Days 8–14" },
  { label: "Endure it", days: "Days 15–21" },
  { label: "Become it", days: "Days 22–30" },
];

const section: React.CSSProperties = {
  maxWidth: "var(--page-max)",
  margin: "0 auto",
  padding: "96px 24px",
};

const eyebrow: React.CSSProperties = {
  fontFamily: "var(--font-condensed)",
  fontSize: 12,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "var(--text-faint)",
  margin: 0,
};

export default function LandingPage() {
  return (
    <SiteShell>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section style={{ ...section, paddingTop: 88, paddingBottom: 64 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 16px",
            borderRadius: "var(--radius-pill)",
            background: "var(--ink-surface)",
            border: "1px solid var(--ink-border)",
            marginBottom: 32,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--indigo-light)",
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 14, color: "var(--text-muted)" }}>
            10,431 people on a trial today
          </span>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-mincho)",
            fontSize: "clamp(40px, 7vw, var(--size-hero))",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
            margin: "0 0 24px",
            maxWidth: 900,
          }}
        >
          Ask the people who survived worse.
        </h1>

        <p
          style={{
            fontSize: "var(--size-lead)",
            lineHeight: 1.6,
            color: "var(--text-muted)",
            maxWidth: "var(--measure)",
            margin: "0 0 40px",
          }}
        >
          Bring a real problem. Musashi, Seneca, Mandela, Curie or Sun Tzu writes back with the
          moment from their own life that matched — and one thing for you to do today.
        </p>

        <div id="get" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <StoreButton label="App Store" sub="Download on the" />
          <StoreButton label="Google Play" sub="Get it on" />
          <span style={{ color: "var(--text-faint)", fontSize: 14, marginLeft: 8 }}>
            3 free questions a day
          </span>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section id="how" style={section}>
        <p style={eyebrow}>How it works</p>
        <h2
          style={{
            fontFamily: "var(--font-mincho)",
            fontSize: "clamp(30px, 4vw, var(--size-display))",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            margin: "16px 0 48px",
            maxWidth: 760,
          }}
        >
          Every answer ends in one thing to do today.
        </h2>

        <div
          style={{
            display: "grid",
            gap: 20,
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          }}
        >
          {STEPS.map((s) => (
            <div
              key={s.n}
              style={{
                background: "var(--ink-surface)",
                border: "1px solid var(--ink-border)",
                borderRadius: "var(--radius-xl)",
                padding: 28,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-condensed)",
                  fontSize: 26,
                  color: "var(--indigo-light)",
                }}
              >
                {s.n}
              </span>
              <h3
                style={{
                  fontSize: "var(--size-body-lg)",
                  color: "var(--text-primary)",
                  margin: "10px 0 8px",
                }}
              >
                {s.title}
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: 15, margin: 0, lineHeight: 1.6 }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── The Masters ──────────────────────────────────────────── */}
      <section id="masters" style={section}>
        <p style={eyebrow}>The Masters</p>
        <h2
          style={{
            fontFamily: "var(--font-mincho)",
            fontSize: "clamp(28px, 3.2vw, var(--size-heading))",
            color: "var(--text-primary)",
            margin: "16px 0 40px",
          }}
        >
          Five people. None of them will comfort you.
        </h2>

        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {MASTERS.map((m) => (
            <div
              key={m.name}
              style={{
                background: "var(--ink-surface)",
                border: "1px solid var(--ink-border)",
                borderRadius: "var(--radius-card)",
                padding: 24,
              }}
            >
              <span
                style={{
                  display: "block",
                  width: 18,
                  height: 4,
                  borderRadius: "var(--radius-blade)",
                  background: "var(--indigo)",
                  marginBottom: 16,
                }}
              />
              <h3
                style={{
                  fontFamily: "var(--font-mincho)",
                  fontSize: 22,
                  color: "var(--text-primary)",
                  margin: "0 0 6px",
                }}
              >
                {m.name}
              </h3>
              <p style={{ color: "var(--text-faint)", fontSize: 13, margin: "0 0 4px" }}>{m.era}</p>
              <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>{m.domains}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── The library ──────────────────────────────────────────── */}
      <section style={section}>
        <p style={eyebrow}>The library</p>
        <h2
          style={{
            fontFamily: "var(--font-mincho)",
            fontSize: "clamp(28px, 3.2vw, var(--size-heading))",
            color: "var(--text-primary)",
            margin: "16px 0 32px",
          }}
        >
          20 adversities, named the way you&apos;d say them
        </h2>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {WOUNDS.map((w) => (
            <span
              key={w}
              style={{
                padding: "12px 20px",
                borderRadius: "var(--radius-pill)",
                background: "var(--ink-inset)",
                border: "1px solid var(--ink-border)",
                color: "var(--text-body-alt)",
                fontSize: 15,
              }}
            >
              {w}
            </span>
          ))}
        </div>
      </section>

      {/* ── The 30-day path ──────────────────────────────────────── */}
      <section style={section}>
        <p style={eyebrow}>The 30-day path</p>
        <h2
          style={{
            fontFamily: "var(--font-mincho)",
            fontSize: "clamp(28px, 3.2vw, var(--size-heading))",
            color: "var(--text-primary)",
            margin: "16px 0 40px",
          }}
        >
          Four acts. One trial a day. Masters you earn.
        </h2>

        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          }}
        >
          {ACTS.map((a, i) => (
            <div key={a.label}>
              <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
                {Array.from({ length: 7 }, (_, j) => (
                  <span
                    key={j}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: "var(--radius-blade)",
                      background: i === 0 ? "var(--indigo)" : "var(--ink-border-bright)",
                    }}
                  />
                ))}
              </div>
              <h3
                style={{
                  fontSize: "var(--size-body-lg)",
                  color: "var(--text-primary)",
                  margin: "0 0 4px",
                }}
              >
                {a.label}
              </h3>
              <p style={{ color: "var(--text-faint)", fontSize: 14, margin: 0 }}>{a.days}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Proof ────────────────────────────────────────────────── */}
      <section style={section}>
        <blockquote
          style={{
            fontFamily: "var(--font-mincho)",
            fontSize: "clamp(24px, 3vw, 34px)",
            lineHeight: 1.35,
            color: "var(--text-primary)",
            maxWidth: "var(--measure)",
            margin: "0 0 20px",
          }}
        >
          “Day 9 was ‘send the email you&apos;re scared of&apos;. I sent it. Got the meeting.”
        </blockquote>
        <p style={{ color: "var(--text-faint)", fontSize: 15, margin: "0 0 48px" }}>
          Tomás · finished the 30 days
        </p>

        <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: "var(--font-condensed)",
              fontSize: "var(--size-display)",
              color: "var(--gold)",
            }}
          >
            4.8
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: 15 }}>
            from 2,140 ratings — “the only app that asks something of me”
          </span>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────── */}
      <section id="pricing" style={section}>
        <h2
          style={{
            fontFamily: "var(--font-mincho)",
            fontSize: "clamp(26px, 3.4vw, 38px)",
            lineHeight: 1.2,
            color: "var(--text-primary)",
            margin: "0 0 12px",
            maxWidth: 760,
          }}
        >
          Free for three questions a day. $149 once for the rest.
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--size-body-lg)", margin: "0 0 32px" }}>
          Monthly $9.99 · Lifetime $149 · no ads on either.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
            href="#get"
            style={{
              background: "var(--indigo)",
              color: "var(--text-primary)",
              padding: "16px 32px",
              borderRadius: "var(--radius-pill)",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Download free
          </Link>
          <Link
            href="/terms#subscriptions"
            style={{
              border: "1px solid var(--ink-border)",
              color: "var(--text-body)",
              padding: "16px 32px",
              borderRadius: "var(--radius-pill)",
              textDecoration: "none",
            }}
          >
            See pricing
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}

function StoreButton({ label, sub }: { label: string; sub: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: "column",
        padding: "12px 26px",
        borderRadius: "var(--radius-md)",
        background: "var(--ink-surface)",
        border: "1px solid var(--ink-border)",
        color: "var(--text-primary)",
        lineHeight: 1.2,
      }}
    >
      <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{sub}</span>
      <span style={{ fontSize: 17, fontWeight: 700 }}>{label}</span>
    </span>
  );
}
