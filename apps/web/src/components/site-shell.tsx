import Link from "next/link";

/**
 * The header and footer every page shares.
 *
 * All five pages — landing, Terms, Privacy, Support and account deletion —
 * use this, so the store-required utility pages read as part of the same
 * property rather than as an afterthought bolted on to satisfy a reviewer.
 */

const NAV = [
  { href: "/#masters", label: "The Masters" },
  { href: "/#how", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/support", label: "Support" },
] as const;

export function SiteHeader() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: "1px solid var(--ink-border)",
        background: "color-mix(in srgb, var(--ink-base) 88%, transparent)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--page-max)",
          margin: "0 auto",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: 32,
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-mincho)",
            fontSize: 20,
            color: "var(--text-primary)",
            textDecoration: "none",
            letterSpacing: "-0.02em",
          }}
        >
          Miyamoto
        </Link>

        <nav style={{ display: "flex", gap: 24, flex: 1 }} className="site-nav">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                color: "var(--text-muted)",
                textDecoration: "none",
                fontSize: 15,
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/#get"
          style={{
            background: "var(--indigo)",
            color: "var(--text-primary)",
            padding: "10px 20px",
            borderRadius: "var(--radius-pill)",
            textDecoration: "none",
            fontSize: 15,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          Get the app
        </Link>
      </div>
    </header>
  );
}

const FOOTER = [
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms#subscriptions", label: "Subscription terms" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/support", label: "Support" },
      { href: "/delete-account", label: "Delete your account" },
    ],
  },
] as const;

const footerLinkStyle: React.CSSProperties = {
  color: "var(--text-muted)",
  textDecoration: "none",
  fontSize: 14,
};

export function SiteFooter() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--ink-border)",
        marginTop: 96,
        background: "var(--ink-void)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--page-max)",
          margin: "0 auto",
          padding: "56px 24px 40px",
          display: "grid",
          gap: 40,
          gridTemplateColumns: "minmax(260px, 2fr) 1fr 1fr",
        }}
        className="footer-grid"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span
            style={{
              fontFamily: "var(--font-mincho)",
              fontSize: 20,
              color: "var(--text-primary)",
            }}
          >
            Miyamoto
          </span>
          <p style={{ color: "var(--text-faint)", fontSize: 14, margin: 0, maxWidth: 340 }}>
            Meet the Masters. Historical figures answering the problem in front of you. Not a
            substitute for medical or mental-health care.
          </p>
        </div>

        {FOOTER.map((col) => (
          <div key={col.title} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span
              style={{
                fontFamily: "var(--font-condensed)",
                fontSize: 12,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--text-faint)",
              }}
            >
              {col.title}
            </span>
            {col.links.map((l) => (
              <Link key={l.href} href={l.href} style={footerLinkStyle}>
                {l.label}
              </Link>
            ))}
            {col.title === "Help" ? (
              <a href="mailto:support@miyamoto.app" style={footerLinkStyle}>
                support@miyamoto.app
              </a>
            ) : null}
          </div>
        ))}
      </div>

      <div
        style={{
          maxWidth: "var(--page-max)",
          margin: "0 auto",
          padding: "0 24px 40px",
          color: "var(--text-faint)",
          fontSize: 13,
        }}
      >
        © 2026 Founderling Ltd.
      </div>
    </footer>
  );
}

/** Wraps a page in the shared shell. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
