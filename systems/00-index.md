# Systems

Why things are the way they are, and the rules that span every screen.

**Precedence.** Where a systems doc and a design file disagree about how
something *looks*, the design file wins. Where they disagree about a
*behaviour* no single screen can express — "the Masters never comfort",
"streaks count Trials only" — these docs win.

| Doc | What it holds |
|---|---|
| `01-architecture.md` | Monorepo shape, apps, packages, what talks to what |
| `02-data-layer.md` | The Prisma/Mastra split, day boundaries, the free counter |
| `03-design-system.md` | Tokens, blade marks, motion, type |
| `04-masters.md` | The Master template and the truthfulness guardrails |
| `06-auth.md` | Google sign-in end to end, and why it fails on phones |
| `05-tone.md` | How the *app* speaks — distinct from how a Master speaks |
| `10-analytics.md` | TelemetryDeck: every signal, what it carries, the funnel |
| `11-play-data-safety.md` | The Play Data safety form, answer by answer, and when to revisit it |
| `09-decisions.md` | Numbered decision log. Cite by number in code. |

Start with `09-decisions.md` if you are looking for why something is odd.
