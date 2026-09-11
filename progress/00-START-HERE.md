# START HERE

You are picking up **Miyamoto — Meet the Masters**, a mobile app where you
bring a real problem from your life and a historical figure answers it in
their own voice. This file is self-contained.

> Read `progress/AGENT-PROCESS.md` for *how* work is done here.
> This file is *what* to build next.

**Last updated:** session 8 (2026-09-11).

---

## ⚠️ Read this first

**Session 8, later** (plan 14, built). The server and its database moved
to **Coolify**. The container now migrates and seeds its own database on
every start (D-051), which settles the old "wire `migrate deploy` in"
item. Email sign-in exists for seeded accounts only, and the server keeps
a Pro reviewer account for Play review from `REVIEWER_EMAIL` and
`REVIEWER_PASSWORD` (D-052). What to type into Play Console is in
`systems/06-auth.md`. **Plan 15** (built): the app's paywall buys the
chosen package directly and shows the store's own prices. Pressing buy
used to open RevenueCat's paywall on top of ours (D-053). **Plan 13**
(built):
- The chat is drawn as bubbles, with the charge as its own, and each
  letter writes itself out (D-054).
- The first message no longer vanishes when history lands after it.
- A letter finished after someone left the app reaches them (D-055).
  Push to a closed app needs the owner's Firebase setup
  (`systems/13-notifications.md`).
- Out of questions offers an ad for three more or Pro, everywhere, and
  other Masters are Pro only (D-056).
- There are two retention nudges, no more (D-057).

**Plan 16** (built): the keyboard no longer crowds the chat. The composer
rides on the keyboard, the latest message stays in view, and fields on
scrolling screens and sheets rise above it (D-058).

**Session 8** (plan 12, built). The owner signed in on a phone and landed in
the right place, so the round trip works. Sending a chat message then came
back `POST /ai 401`: the chat transport was the one request that didn't
carry the session. Every request now goes through `lib/server-fetch.ts`,
and `pnpm check-types` fails on one that doesn't (D-047). **Onboarding is
now one question** (D-048): sign in, say what's troubling you, and land in
the real chat with Musashi and the problem in the composer. The nine quiz
screens after it are deleted. Buttons show their work, and predictable
results appear on the tap (D-049). The marketing site's Vercel build no
longer type-checks the database package it never touches (D-050).

**Sessions 6–7.** The server now runs on **Render**
(`https://miyamoto-server.onrender.com`). Vercel's separate type-check broke
every deploy there (D-042, `systems/12-deploys.md`). Production's database
turned out to be a leftover from an unrelated app; with the owner's
confirmation it was reset, migrated and seeded (D-043). Google sign-in now
reaches the server. **Plan 09** (built) fixes the round trip back into the
app: the session is finished from the returning link itself, so a relaunch
mid-sign-in (the dev launcher) or Android's browser promise giving up can't
lose it, and errors come back into the app instead of stranding the browser
on the API's "OK" page (D-044, `systems/06-auth.md`). **Plan 08** (extending
welcome's craft across the app) is built: ScreenHero, You, Adversity,
Masters, chat's empty state; Settings reviewed and left as is. The rules a
new screen is held to are D-045. **Plan 10** (built) held onboarding to the
same bar: one step header, whose-answer faces on the sample problems, a
sample charge drawn like chat's, a face on the carrying nudge, welcome's
ink Musashi on 3/4, and pressure shown as intensity. **Plan 11** (built)
replaced the proof screen, at the owner's decision, with "Your first week":
Days 1–7 at the chosen pressure, from the real Path (D-046). Payoff, forging
and the reminder preview now quote the same real Day 1 and the Path's real
thirty days.

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
   trailer format at all. The owner's first attempt (session 8) never
   reached the model: it was the 401 fixed in `3bb051d`. The next send
   from the phone is the first real one, and the first to stream through
   `expo/fetch`.
2. **Sign-in works on a phone (session 8).** The owner signed in on a
   development build and landed in the right place. Not yet seen: still
   signed in after a restart, and the new "You were signed out" path.
   `systems/06-auth.md` has the flow and the troubleshooting table.
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
| Screen 01 "Try it — no account" and "I already have one" | Welcome's one button is "Continue with Google"; one question runs after it, then the real chat | D-004, D-038, D-040, D-048. Nothing works without an account, so the old promise was untrue. |
| Screens 02–12, the onboarding quiz | One screen: what's troubling you, then the chat with it in the composer | D-048. The owner's call: a real conversation with a real Master straight away. |
| Screen 01's layout | A full-bleed ink hero, the four faces, one white Google pill | D-040. Redesigned at the owner's request after a reference app. |
| Sign-in offers Apple and Google | Google only; Apple commented out | D-039. |
| The design's entry choreography | Restrained everywhere except the paywall | D-036. The owner's call: serious, not showy. Forging and the offer, the other two exceptions, were removed with the quiz (D-048). |
| Selection shown with blade marks | A green tick in a circle; an empty ring when not chosen | D-037. |
| Screen 05 is a Master picker | It is a ladder; Musashi is claimed automatically | D-005. Only Musashi is unlocked at Day 1. |
| Mandela appears throughout | Withdrawn from the app | D-006. Estate enforces personality rights. |
| Offer and paywall: "Day 7, 14 and 21" | "Day 7 and 21", derived from the Master list | D-006, D-033. Day 14 was Mandela's unlock and is now empty. |
| Screen 14's chat card: "Your trial" | "Your charge" | D-035. A Trial and a Charge must never share a name. |
| Screen 15: a Master's letter set as bare text, the card beneath it | Bubbles: the person right in indigo, the Master left in raised ink with their face, the charge its own bubble | D-054. The owner's call (session 8): it should read as messages. |
| Screen 09, social proof: a user count, a rating, two testimonials | Removed. It became "Your first week" (D-046), then went with the quiz (D-048) | Every figure on the original had nothing behind it. |

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
| Onboarding, 2 screens | **Built, auth-first** | Welcome (which is sign-in, D-040) in `(auth)`, then one question in `(onboarding)/problem.tsx`, which claims the account and opens the chat (D-048). Sign-in seen on a phone; the question not yet. |
| Analytics | **Built**, never seen to send | TelemetryDeck through `track()`; four funnel steps plus sign-in failures (D-041, `systems/10-analytics.md`). |
| Onboarding persistence | **Built** | The problem screen claims directly and says so if it fails. `useClaimDraft` in the app shell still sends a draft an older build finished offline. Idempotent on the server (D-034). |
| Session routing | **Built** | One gate, `app/(app)/_layout.tsx`: no session → `/welcome`; new account → the first question; otherwise the app. A refused session goes back to welcome with the reason (D-047). |
| Requests to the server | **Built** | All through `lib/server-fetch.ts`, enforced by `pnpm check-types` (D-047). |
| Feedback | **Built** | `<Button loading>`, row spinners, optimistic trial, charge, Master, reminders and counter (D-049). |
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
- **Keyboard handling is keyboard-controller's**, never React Native's
  `KeyboardAvoidingView` (D-058). On Android the keyboard covers the window
  rather than resizing it, and React Native's view does nothing about that.
- **Every request to the server goes through `lib/server-fetch.ts`** (D-047).
  `pnpm check-types` fails otherwise. Don't silence the check; route the
  request.
- **Checking a bundle for a string:** Hermes stores any string with a
  non-ASCII character (an ellipsis, a curly quote) as UTF-16, so a plain
  `grep` reports it missing. Search for the UTF-16LE bytes too.
- **`npx expo export` can segfault as it exits,** sometimes before the
  bundle is written. If the `.hbc` is missing, run it again.

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
2. **The first chat on a device** — sign-in works on the owner's phone
   (session 8) and lands in the right place. What remains: the first
   message reaching the model now that it carries the session (`3bb051d`),
   the letter streaming in, and still being signed in after a restart. The
   Render log the owner shared in session 8 had no `Rate limiting could not
   determine a client IP` line. If it ever appears, set `trustedProxies`
   (`systems/06-auth.md`).
3. **A device pass** — 05 T04. Now covers far more than it did: the gate,
   the one-question onboarding and its claim, loading states and the
   optimistic updates, the permission prompt, three kinds of notification,
   the charge card, history.
4. **One figure the app cannot back, still.** The paywall quotes a named
   user ("Tomás, finished the 30 days"), design copy with no one behind it.
   It's legal exposure once the app is live, so it's the owner's call before
   launch (D-046). The rest (payoff's "2.4× more often", the offer's
   "Aisha", the proof screen) went with the quiz in session 8 (D-048).
5. **Pressure can't be changed.** Since onboarding became one question
   (D-048), every new account is Firm, and no screen or procedure changes
   it. If the owner wants the choice back, it's small: `account.setPressure`
   (it updates `onboardingProfile.pressure`, and the Path already reads it)
   plus a three-option row in Settings.
6. **Firebase, for letters to a closed app.** Push needs a Firebase
   project, its `google-services.json` in the build, the FCM V1 key in EAS,
   and a new development build. The steps are in
   `systems/13-notifications.md`. Until then, letters reach an app in the
   background but not a closed one.
7. **Verify rewarded ads on the server.** `chat.grantBonus` takes the
   phone's word that an ad was watched, which is why ads are capped at five
   a day (D-056). AdMob's server-side verification callback would let the
   cap go.
8. **Portrait quality and rights.** Curie's source is 120px and Sun Tzu's
   128px, so both go soft above about 64pt. The Musashi portraits, the
   welcome hero and the icon are *Vagabond* artwork. **The owner has chosen
   to keep it for now (session 5).** Do not replace it unasked, and do not
   raise it again as new; it stays tracked under 05 T01.
9. **A finished but unclaimed draft is per device, not per account.**
   Mostly moot since session 8: the problem screen claims directly and
   never leaves a finished draft behind. Only a draft an older build
   finished offline can still reach another account on the same phone. The
   fix is still small (store the user id in the draft, drop it on
   mismatch) and still not built.
10. **Day 14 has no Master.** Withdrawing Mandela emptied it. The copy is now
   true ("Day 7 and 21"), but the Path's pacing is the owner's call — move
   Curie to 14, add a Master, or leave the gap.
11. **The app icon** — 05 T01. Currently copyrighted *Vagabond* artwork.
   Owner's call to commission.
12. **RevenueCat** — 03 T01, T03. Keys, dashboard products, the webhook URL
   and secret, then a sandbox pass.
13. **Message bodies in the data export** — unblocked, unplanned, unbuilt.
14. **Mandela on the marketing site** — owner said later, separately.
15. **Enter the Data safety form in Play Console.** The answers are in
    `systems/11-play-data-safety.md`, and the privacy policy already
    matches them. Only the owner can submit the form.
16. **Settled (session 8): schema changes reach production by deploying.**
    The owner moved the server and database to Coolify, and the container
    now runs `prisma migrate deploy` and the content seed on every start
    (D-051, `systems/12-deploys.md`). The first start on the new, empty
    database creates every table and seeds the content. Watch that first
    deploy's log for `[boot]` lines.

## Waiting on the owner

A Google OAuth client and an HTTPS server address (blocks sign-in on a
phone), `SMTP_*`, RevenueCat keys, `REVENUECAT_WEBHOOK_AUTH` and the
dashboard webhook, an original app icon, larger Curie and Sun Tzu portraits,
a device with an EAS development build, a decision about Day 14, a
decision about the paywall's "Tomás" quote, whether pressure should be
choosable again, and the Data safety form entered in Play Console (answers
ready). Apple sign-in is off, so
Apple credentials are no longer needed.

---

## The test

> **A man opens this at 5am, alone, after the worst week of his year, and he
> has already decided nobody can help him. Does what you built give him one
> thing to do before breakfast — or does it flatter him?**

If a change makes the app warmer, softer or more encouraging, it is probably
wrong. Everything else in this repository is downstream of that sentence.
