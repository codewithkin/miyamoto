# START HERE

You are picking up **Miyamoto — Meet the Masters**, a mobile app where you
bring a real problem from your life and a historical figure answers it in
their own voice. This file is self-contained.

> Read `progress/AGENT-PROCESS.md` for *how* work is done here.
> This file is *what* to build next.

**Last updated:** end of session 3 (2026-09-10).

---

## ⚠️ Read this first

**Everything buildable without the owner is built.** Plans 01–04 are done
except 01 T12 and 03 T01/T03, all three of which wait on something only the
owner can supply.

**Two things have never happened, and nothing built so far proves them:**

1. **No Master reply has ever been generated.** `OPENROUTER_API_KEY` is
   missing. Citation enforcement, the charge, refunds and history are all
   verified against the real database and Mastra store with fixture replies
   — never with a real model. The first real reply may not follow the
   trailer format at all.
2. **Nothing has run on a device.** Onboarding persistence, the session
   redirect, the permission prompt, both daily reminders, the streak warning
   and the charge card are typechecked and, where the logic could be pulled
   out, run. None has been seen.

The database is seeded: 5 Masters (4 active), 28 Moments, 14 quotations, 20
stories, 30 Path days. Re-seed any time with `pnpm --filter @miyamoto/db
db:seed`; it is idempotent.

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
| Offer and paywall: "Day 7, 14 and 21" | "Day 7 and 21", derived from the Master list | D-006, D-033. Day 14 was Mandela's unlock and is now empty. |
| Screen 14's chat card: "Your trial" | "Your charge" | D-035. A Trial and a Charge must never share a name. |

---

## Your task

**If `OPENROUTER_API_KEY` is now set:** `plans/01-master-corpus.md` T12. Run
the same ten problems against all four active Masters and read them side by
side. Before judging the voices, check the server log for `[ai] … rejected`
— if drafts are being refused, the trailer format is the first problem, not
the voice.

**If it is not:** nothing in the plans is buildable. The best unplanned
candidate is message bodies in the data export — no longer blocked in
principle, because `loadThreadHistory` in `apps/server` can read them. Add it
to a plan before building it.

```bash
# get oriented
git log --oneline | head -30
python designs/extract.py

# the only safe way to typecheck everything
pnpm check-types
```

Nothing is uncommitted. The tree is clean.

---

## What Miyamoto is, in five rules

1. **The Masters never comfort** (D-001). No sympathy, no validation, no "that
   sounds hard", no exclamation marks. The user has somewhere else for that.
2. **Every answer ends in one concrete thing to do today** (D-002). Small
   enough to finish before sleeping. Never two options.
3. **A Master never invents their own life** (D-007). The corpus is the only
   permitted biography, tiered by how well attested it is (D-008), and a
   reply that tells a life event without citing it is refused (D-030).
4. **Masters are earned, not chosen** (D-005). Musashi from Day 1; the rest
   arrive on Days 7 and 21 or behind Pro.
5. **The Master meets the present** (D-011). Names the modern thing, says he
   had no such thing, crosses to what it actually is. *That crossing is the
   product.*

---

## What is already built

| Area | State | What "built" means here |
|---|---|---|
| Onboarding, 12 screens | **Built** | Never run on a device. |
| Onboarding persistence | **Built** | Claimed from the app shell, retried until confirmed, idempotent on the server (D-034). Verified server-side. |
| Session routing | **Built** | Signed-in users skip onboarding; signed-out users cannot see the shell. |
| App shell, 8 screens + 3 overlays | **Built** | Path, Adversity, Chat, You, story, Masters, paywall, sheets. |
| Design system | **Built** | Tokens, blade marks, 18 entry presets, press interaction with haptics. |
| Marketing site, 5 pages | **Built and deployed** | Still shows Mandela; the owner wants that removed separately. |
| Account deletion | **Built and verified** | Web loop tested end to end against a real account; cascade proven. |
| Master corpus | **Built and seeded** | 4 active Masters, tiered and cited; Mandela withdrawn with his corpus kept. |
| Citation enforcement | **Built** | Buffered, validated, retried, refunded (D-030–D-032). Verified with fixtures, never with a model. |
| Charges | **Built** | Written on every accepted reply, handed over as a card, completable. |
| Chat history | **Built** | `/ai/history` from Mastra; opens a thread on what was said. |
| Notifications | **Built** | Prompt once, two daily reminders with the day's trial, streak warning only on the day it would break. Never seen to fire. |
| RevenueCat | **Webhook built**; client inert | Webhook verified with synthetic events. Awaiting keys, dashboard, device. |
| Pro | **One definition** | `isPro` in `packages/api/src/lib/usage.ts`; every gate calls it (D-018). |

---

## Read this before you write a line

- **Nothing has ever run on a device.** Do not tick a "Done when" that says
  "on device".
- **Run `tsc -b` only from `apps/server`**, or use `pnpm check-types`. At the
  repo root it writes `.js` beside every source file — 110 of them, twice,
  in session 3.
- **Parallel shell calls share one working directory.** Start every call with
  an absolute `cd`.
- **Write files containing escape sequences with the file tool,** not a
  Python heredoc.
- **`packages/ui` is web-only shadcn.** The native app does not use it.
- **`apps/web` is a marketing site.** No app features, no sign-in.
- **Prisma is not on the tRPC context** (D-016). Putting it back breaks
  declaration emit with TS2883.
- **`packages/api` cannot import Mastra.** Anything that reads message
  content is a route in `apps/server` (D-014).
- **`DeletionRequest.userId` is a plain column, not a relation.** Deliberate,
  so the audit row survives the cascade it records. Do not "fix" it.
- **`react-native-google-mobile-ads` is pinned exactly** (D-023).
- **Mail failures are swallowed on purpose** (D-025). Check `[mail]` in
  deployment logs, never the UI.
- **The seed throws before it writes** on a collapsed or unattested corpus
  (D-008, D-013). Fix the corpus, not the assertion.
- **Never loosen `checkReply`** to make refusals stop. Refusals are the
  system working; fix the corpus or the correction text.
- **PowerShell 5.1 has no `&&`.** Use `;` or separate commands.

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

1. **The voice evaluation** — 01 T12. The first real reply, and the only
   check on D-013. Needs the key.
2. **A device pass** — 05 T04. Now covers far more than it did: the claim,
   the redirect, the permission prompt, three kinds of notification, the
   charge card, history.
3. **Day 14 has no Master.** Withdrawing Mandela emptied it. The copy is now
   true ("Day 7 and 21"), but the Path's pacing is the owner's call — move
   Curie to 14, add a Master, or leave the gap.
4. **The app icon** — 05 T01. Currently copyrighted *Vagabond* artwork.
   Owner's call to commission.
5. **RevenueCat** — 03 T01, T03. Keys, dashboard products, the webhook URL
   and secret, then a sandbox pass.
6. **Message bodies in the data export** — unblocked, unplanned, unbuilt.
7. **Mandela on the marketing site** — owner said later, separately.

## Waiting on the owner

`OPENROUTER_API_KEY` (blocks every Master reply), Google/Apple OAuth
credentials, `SMTP_*`, RevenueCat keys, `REVENUECAT_WEBHOOK_AUTH` and the
dashboard webhook, an original app icon, a device with an EAS development
build, and a decision about Day 14.

---

## The test

> **A man opens this at 5am, alone, after the worst week of his year, and he
> has already decided nobody can help him. Does what you built give him one
> thing to do before breakfast — or does it flatter him?**

If a change makes the app warmer, softer or more encouraging, it is probably
wrong. Everything else in this repository is downstream of that sentence.
