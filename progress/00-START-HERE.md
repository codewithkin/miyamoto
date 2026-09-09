# START HERE

You are picking up **Miyamoto — Meet the Masters**, a mobile app where you
bring a real problem from your life and a historical figure answers it in
their own voice. This file is self-contained.

> Read `progress/AGENT-PROCESS.md` for *how* work is done here.
> This file is *what* to build next.

**Last updated:** end of session 2 (2026-09-09).

---

## ⚠️ Read this first

**The database is seeded.** The reset of 2026-09-09 has been undone: 5
Masters, 28 Moments (20 biographical, 8 principles), 14 quotations, 20
stories, 30 Path days, 90 trials, 6 wounds. Re-run it any time with
`pnpm --filter @miyamoto/db db:seed` — it is idempotent.

**Chat is no longer blocked on data.** It is blocked on
`OPENROUTER_API_KEY`, which is the owner's to supply. No Master reply has
ever been generated.

---

## The rule that comes before everything else

**Build every screen from its design file.** Not from the token package.

```
1. designs/extracted/*     what a screen looks like        (highest)
2. systems/*               why, and rules spanning screens
3. apps/native/theme/*     a convenience for shared values
4. anything else           nothing
```

Where 1 and 2 disagree about **appearance**, 1 wins. Where they disagree
about a **behaviour** no single screen can express — "the Masters never
comfort", "streaks count Trials only" — 2 wins.

`designs/extracted/` is gitignored. Regenerate it:

```bash
python designs/extract.py
```

24 files: 23 app screens plus the web document, each with its visible copy
and its markup. The markup is the only place the real hex values live.

**Registered exceptions** (where a spec knowingly overrides a design):

| Design says | We do | Why |
|---|---|---|
| Screen 01 "Try it — no account" | Auth required before a real question | D-004. The four sample problems have authored answers, so the aha still lands with no model call. |
| Screen 05 is a Master picker | It is a ladder; Musashi is claimed automatically | D-005. Only Musashi is unlocked at Day 1. |
| Mandela appears throughout | Withdrawn from the app | D-006. Estate enforces personality rights. |

---

## Your task

Open `plans/01-master-corpus.md` and start at **T08**.

T01–T07a are done: the schema, the compiler, the generation path, and now
the corpus itself — voice fields, tiered moments, principles, quotations,
plus the retrieval fix that tiering exposed. What remains in that plan is
withdrawing Mandela (T08–T10), citation enforcement (T11), and the voice
evaluation (T12).

T08 is four commits of straightforward work and it has a trap in it:
`trusted-lied` is one of the four onboarding sample problems (D-004), so
Mandela's stories must be *reassigned*, not deleted.

```bash
# get oriented
git log --oneline | head -20
python designs/extract.py

# after seeding
pnpm --filter @miyamoto/db db:seed
```

Nothing is uncommitted. The tree is clean.

---

## What Miyamoto is, in five rules

1. **The Masters never comfort** (D-001). No sympathy, no validation, no "that
   sounds hard", no exclamation marks. The user has somewhere else for that.
2. **Every answer ends in one concrete thing to do today** (D-002). Small
   enough to finish before sleeping. Never two options.
3. **A Master never invents their own life** (D-007). The corpus is the only
   permitted biography, tiered by how well attested it is (D-008).
4. **Masters are earned, not chosen** (D-005). Musashi from Day 1; the rest
   arrive on Days 7, 14, 21 or behind Pro.
5. **The Master meets the present** (D-011). Names the modern thing, says he
   had no such thing, crosses to what it actually is. *That crossing is the
   product.*

---

## What is already built

| Area | State | What "built" means here |
|---|---|---|
| Onboarding, 12 screens | **Built** | Typechecks, per-element animation. Never run on a device. |
| App shell, 8 screens + 3 overlays | **Built** | Path, Adversity, Chat, You, story, Masters, paywall, sheets. |
| Design system | **Built** | Tokens, blade marks, 18 entry presets, press interaction with haptics. |
| Marketing site, 5 pages | **Built and deployed** | Landing, Terms, Privacy, Support, delete-account. On Vercel. |
| Account deletion | **Built and verified** | Web loop tested end to end against a real account; cascade proven. |
| Master template | **Built** | Schema, compiler, retrieval, citation-ready. |
| Master corpus | **Built and seeded** | 5 Masters, 28 Moments, 14 quotations. Tiered, cited, checked at seed time. |
| Notifications | Not started | Package installed, plugin registered, nothing scheduled. |
| RevenueCat | Groundwork, inert | Awaiting keys. |
| Onboarding persistence | **Missing** | Eleven screens of answers collected and discarded. |

---

## Read this before you write a line

- **Nothing has ever run on a device.** Everything is typechecked and built.
  That is not the same as run. Do not tick a "Done when" that says "on
  device".
- **`packages/ui` is web-only shadcn.** The native app does not use it.
- **`apps/web` is a marketing site.** No app features, no sign-in.
- **Prisma is not on the tRPC context** (D-016). Putting it back breaks
  declaration emit with TS2883.
- **`DeletionRequest.userId` is a plain column, not a relation.** Deliberate,
  so the audit row survives the cascade it records. Do not "fix" it.
- **`react-native-google-mobile-ads` is pinned exactly** (D-023). A caret
  floats to a version whose Kotlin metadata Expo 57 cannot read.
- **Mail failures are swallowed on purpose** (D-025). Check `[mail]` in
  deployment logs, never the UI.
- **PowerShell 5.1 has no `&&`.** Use `;` or separate commands.
- **Heredocs with apostrophes break in this shell.** Write files with the
  file tool rather than `cat <<EOF` when the content has prose in it.
- **The seed throws before it writes** if a Master duplicates another's
  `characteristicMove`, drops below three `neverDo` or two principles, or
  carries a `MOMENT` with no tier or citation. That is deliberate (D-008,
  D-013). Fix the corpus rather than the assertion.
- **`tsc` in minute five.** Session 2 opened with a seed that had not
  compiled since `53cb261` — the reason chat was down was one type error,
  and nine seconds of `tsc` would have said so at any point.

---

## How to work here

One todo, one commit. If the plan is wrong, change the plan first in its own
`docs(plan):` commit with a `**Note (session N):**`. Never diverge silently.

Before a batch: list the features, split into todos, then work. `CLAUDE.md`
carries this as a hard rule and the owner enforces it.

Destructive actions are authorised before launch (D-028) — **and must be
announced in the response that does them**, not buried in a commit message.
This reverses when marketing starts.

---

## Where things are

| Path | What | Tracked |
|---|---|---|
| `designs/raw/` | The two standalone exports, ~27MB | No |
| `designs/extracted/` | Per-screen readable files | No |
| `designs/extract.py` | Regenerates the above | **Yes** |
| `systems/` | Rules and the decision log | **Yes** |
| `plans/` | The work queue | **Yes** |
| `progress/` | This file, the changelog | **Yes** |
| `CLAUDE.md` | The working agreement | **Yes** |

`plans/`, `systems/` and `progress/` are tracked here, against the template's
default. The whole point is continuity across cold sessions, and untracked
notes do not survive a clone.

---

## Open items, in priority order

1. **Withdraw Mandela** — `plans/01-master-corpus.md` T08–T10.
2. **Citation enforcement** — T11. Interacts with streaming; read the note.
3. **Persist the onboarding draft** — `plans/04-onboarding-claim.md`. Users lose their quiz today.
4. **The app icon** — `plans/05-launch-readiness.md` T01. Currently copyrighted *Vagabond*
   artwork. Owner's call to commission.
5. **A device pass** — `plans/05-launch-readiness.md` T04.
6. **The voice evaluation** — T12. Blocked on the key, and the only check
   that catches D-013. Everything built so far makes collapse harder to
   write; none of it proves collapse has not happened.

## Waiting on the owner

`OPENROUTER_API_KEY` (blocks every Master reply), Google/Apple OAuth
credentials, `SMTP_*`, RevenueCat keys, and an original app icon.

---

## The test

> **A man opens this at 5am, alone, after the worst week of his year, and he
> has already decided nobody can help him. Does what you built give him one
> thing to do before breakfast — or does it flatter him?**

If a change makes the app warmer, softer or more encouraging, it is probably
wrong. Everything else in this repository is downstream of that sentence.
