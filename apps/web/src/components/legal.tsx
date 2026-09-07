import Link from "next/link";

/**
 * The legal document layout.
 *
 * Terms and Privacy share this: a ~68-character measure, a contents rail,
 * and a plain-language summary above the fold. The summary is not
 * decoration — it is the part most people will actually read, so it says
 * the same things the clauses do, in words that do not need a lawyer.
 */

export function LegalPage({
  title,
  updated,
  summary,
  contents,
  children,
}: {
  title: string;
  updated: string;
  summary: string;
  contents: { id: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        maxWidth: "var(--page-max)",
        margin: "0 auto",
        padding: "72px 24px",
        display: "grid",
        gap: 56,
        gridTemplateColumns: "minmax(0, 1fr) 240px",
        alignItems: "start",
      }}
      className="legal-grid"
    >
      <article style={{ maxWidth: "var(--measure)" }}>
        <p
          style={{
            fontFamily: "var(--font-condensed)",
            fontSize: 12,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--text-faint)",
            margin: 0,
          }}
        >
          Legal
        </p>

        <h1
          style={{
            fontFamily: "var(--font-mincho)",
            fontSize: "clamp(34px, 5vw, var(--size-legal))",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            margin: "12px 0 8px",
          }}
        >
          {title}
        </h1>

        <p style={{ color: "var(--text-faint)", fontSize: 14, margin: "0 0 40px" }}>{updated}</p>

        {/* The part people actually read. */}
        <aside
          style={{
            background: "var(--gold-tint-deep)",
            border: "1px solid var(--gold-tint)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
            marginBottom: 48,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-condensed)",
              fontSize: 12,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--parchment)",
              margin: "0 0 12px",
            }}
          >
            The short version
          </h2>
          <p style={{ margin: 0, color: "var(--text-body)", lineHeight: 1.7 }}>{summary}</p>
        </aside>

        {children}
      </article>

      <nav
        style={{ position: "sticky", top: 96, display: "flex", flexDirection: "column", gap: 10 }}
        className="legal-toc"
      >
        <span
          style={{
            fontFamily: "var(--font-condensed)",
            fontSize: 12,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--text-faint)",
          }}
        >
          On this page
        </span>
        {contents.map((c) => (
          <Link
            key={c.id}
            href={`#${c.id}`}
            style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 14 }}
          >
            {c.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function Clause({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} style={{ scrollMarginTop: 96, marginBottom: 40 }}>
      <h2
        style={{
          fontFamily: "var(--font-mincho)",
          fontSize: "var(--size-title)",
          color: "var(--text-primary)",
          margin: "0 0 12px",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h2>
      <div style={{ color: "var(--text-body)", lineHeight: 1.75 }}>{children}</div>
    </section>
  );
}
