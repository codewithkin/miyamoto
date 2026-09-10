# START HERE

You are picking up **Miyamoto — Meet the Masters**, a mobile app where you
bring a real problem from your life and a historical figure answers it in
their own voice. This file is self-contained.

> Read `progress/AGENT-PROCESS.md` for *how* work is done here.
> This file is *what* to build next.

**Last updated:** end of session 5 (2026-09-10).

---

## ⚠️ Read this first

**Session 5** (plan 07, done): welcome *is* the sign-in screen now, with
one "Continue with Google" button and no `/sign-in` route (D-040). It was
redesigned around a full-bleed ink hero of Musashi. TelemetryDeck
analytics count the funnel welcome -> sign-in -> onboarding done -> first
message (D-041, `systems/10-analytics.md`).

**Session 4 rebuilt onboarding around sign-in** (plan 06, done): sign-in
comes first and the quiz after it (D-038), Google is the only provider
(D-039), motion is restrained everywhere but three screens (D-036), choices
are marked with a real tick (D-037), and every Master mentioned shows their
face.

**Three things have never happened, and nothing built so far proves them:**

1. **No Master reply has ever been generated.** `OPENROUTER_API_KEY` **is
   now set** in `apps/server/.env`, so this is finally unblocked — 01 T12 is
   the next task. Citation enforcement, the charge, refunds and history have
   only ever seen fixture replies. The first real reply may not follow the
   trailer format at all.
2. **Nobody has signed in on a phone.** There are no Google credentials yet,
   and `BETTER_AUTH_URL` is `http://localhost:3000` while the app points at
   `http://192.168.1.5:3000`. Google cannot redirect a phone to either.
   `systems/06-auth.md` is the step-by-step; the server prints what is wrong
   at boot, under `[auth]`.
3. **Nothing has run on a device.** Every screen in plans 06 and 07 was
   typechecked and bundled (`expo export`), never seen. No signal has
   reached TelemetryDeck yet. The signal body and hash were checked
   locally in Node; nothing was sent. The same goes for everything
   before it: onboarding persistence, the permission prompt, both daily
   reminders, the streak warning, the charge card.

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
| Screen 01 "Try it — no account" and "I already have one" | Welcome's one button is "Continue with Google"; the quiz runs after it | D-004, D-038, D-040. Nothing works without an account, so the old promise was untrue. The sample answers still give the aha with no model call. |
| Screen 01's layout | A full-bleed ink hero, the four faces, one white Google pill | D-040. Redesigned at the owner's request after a reference app. |
| Sign-in offers Apple and Google | Google only; Apple commented out | D-039. |
| The design's entry choreography | Restrained everywhere except forging, the offer and the paywall | D-036. The owner's call: serious, not showy. |
| Selection shown with blade marks | A green tick in a circle; an empty ring when not chosen | D-037. |
| Screen 05 is a Master picker | It is a ladder; Musashi is claimed automatically | D-005. Only Musashi is unlocked at Day 1. |
| Mandela appears throughout | Withdrawn from the app | D-006. Estate enforces personality rights. |
| Offer and paywall: "Day 7, 14 and 21" | "Day 7 and 21", derived from the Master list | D-006, D-033. Day 14 was Mandela's unlock and is now empty. |
| Screen 14's chat card: "Your trial" | "Your charge" | D-035. A Trial and a Charge must never share a name. |

---

## Your task

**`plans/01-master-corpus.md` T12.** The key is set. Run the same ten
problems against all four active Masters and read them side by side.
Before judging the voices, check the server log for `[ai] … rejected` — if
drafts are being refused, the trailer format is the first problem, not the
voice.

After that, the best unplanned candidate is message bodies in the data
export. `loadThreadHistory` in `apps/server` can already read them. Add it
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
| Onboarding, 12 screens | **Built, auth-first** | Welcome (which is sign-in, D-040) in `(auth)`, the quiz in `(onboarding)` after sign-in (D-038). Never run on a device. |
| Analytics | **Built**, never seen to send | TelemetryDeck through `track()`; four funnel steps plus sign-in failures (D-041, `systems/10-analytics.md`). |
| Onboarding persistence | **Built** | Claimed from the app shell once the offer screen marks the draft `finishedAt`; retried until confirmed; idempotent on the server (D-034). |
| Session routing | **Built** | One gate, `app/(app)/_layout.tsx`: no session → `/welcome`; new account → the quiz; otherwise the app. |
| Google sign-in | **Built**, never completed | Needs the owner's OAuth client and an HTTPS server URL — `systems/06-auth.md`. |
| App shell, 8 screens + 3 overlays | **Built** | Path, Adversity, Chat, You, story, Masters, paywall, sheets. |
| Design system | **Built** | Tokens; blade marks for progress; restrained motion with an `expressive` opt-in (D-036); `BladeTick` for selection (D-037); Ionicons through `components/icon.tsx`; Master portraits through `components/master-avatar.tsx`. |
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
  in session 3. Session 4 did it once more in `packages/env`: three stray
  `.js` files next to the `.ts`, which could shadow them. In a package, use
  `npx tsc --noEmit`.
- **A new screen is calm by default** (D-036). Only wrap one in
  `<MotionTone value="expressive">` if the owner asks for it.
- **Route groups add no path segment,** so only one `index.tsx` may resolve
  to `/`. That one is `(app)/index.tsx`; welcome is `/welcome`. After adding
  or moving a route, regenerate typed routes by starting Metro briefly
  (`CI=1 npx expo start`), or `tsc` rejects the new href.
- **Do not run prettier.** The repo has no prettier config, so it
  reformats to 80 columns against code written at about 100. Session 5 had
  to revert a whole layout file.
- **Every new analytics signal** goes into the `SignalType` union and the
  table in `systems/10-analytics.md`, in the same commit, and never carries
  content (D-041).
- **The hero is generated.** `python designs/make-hero.py` rebuilds
  `hero-musashi.jpg` from `icon.png`. Replacing the icon means re-running it.
- **Portraits are cut once, offline.** `python designs/crop-portraits.py`
  writes `avatar-*.png` from the supplied `master-*.png`. The component
  assumes squares; do not position faces at runtime.
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
   check on D-013. The key is set; nothing blocks it.
2. **Google sign-in, end to end** — the owner's OAuth client and an HTTPS
   address for the server (`systems/06-auth.md`). Until then no one can get
   past welcome on a phone, which also blocks item 3. TelemetryDeck will
   show it as `Auth.signInFailed` with `reason: provider-off`.
3. **A device pass** — 05 T04. Now covers far more than it did: sign-in, the
   gate, the reworked onboarding, the claim, the permission prompt, three
   kinds of notification, the charge card, history.
4. **Figures the app cannot back.** "Your dojo is ready" says Firm-pressure
   users "finish 2.4× more often", with bars at 18% and 43%. The offer and
   paywall quote named users ("Aisha", "Tomás"). All of it is design copy
   with no data behind it. That is legal exposure once the app is live, so
   it is the owner's call: replace with real numbers after launch, or cut.
5. **Portrait quality and rights.** Curie's source is 120px and Sun Tzu's
   128px, so both go soft above about 64pt. Both Musashi images are
   *Vagabond* artwork, the same open risk as the app icon.
6. **A finished but unclaimed draft is per device, not per account.** If
   one person finishes onboarding offline, signs out, and someone else
   signs in on that phone before the claim lands, the second account gets
   the first person's answers. That is rare, and the fix is small: store
   the user id in the draft and drop it on mismatch. It is not built.
7. **Day 14 has no Master.** Withdrawing Mandela emptied it. The copy is now
   true ("Day 7 and 21"), but the Path's pacing is the owner's call — move
   Curie to 14, add a Master, or leave the gap.
8. **The app icon** — 05 T01. Currently copyrighted *Vagabond* artwork.
   Owner's call to commission.
9. **RevenueCat** — 03 T01, T03. Keys, dashboard products, the webhook URL
   and secret, then a sandbox pass.
10. **Message bodies in the data export** — unblocked, unplanned, unbuilt.
11. **Mandela on the marketing site** — owner said later, separately.
12. **The privacy policy and Play data safety must mention analytics**
    before launch. The wording is in `systems/10-analytics.md`, "Before
    launch".

## Waiting on the owner

A Google OAuth client and an HTTPS server address (blocks sign-in on a
phone), `SMTP_*`, RevenueCat keys, `REVENUECAT_WEBHOOK_AUTH` and the
dashboard webhook, an original app icon, larger Curie and Sun Tzu portraits,
a device with an EAS development build, a decision about Day 14, and a
decision about the payoff figures and testimonials, and a line about
TelemetryDeck in the privacy policy. Apple sign-in is off, so Apple
credentials are no longer needed.

---

## The test

> **A man opens this at 5am, alone, after the worst week of his year, and he
> has already decided nobody can help him. Does what you built give him one
> thing to do before breakfast — or does it flatter him?**

If a change makes the app warmer, softer or more encouraging, it is probably
wrong. Everything else in this repository is downstream of that sentence.
