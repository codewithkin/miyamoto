# Changelog

Newest first. This is where the **reasoning** lives — git has the file list.
Write the entry you would want to find.

---

## Session 5 — 2026-09-10

**Welcome became the sign-in screen and got a real design, and TelemetryDeck
now counts the funnel. Plan 07, 10 commits.**

### One screen (D-040)

With Google as the only provider, "Get started" opened a screen whose only
content was the same button. Welcome's button now runs the sign-in itself,
and `/sign-in` is deleted. The sign-in logic moved into
`lib/use-google-sign-in.ts`. That keeps the screen about the design, and it
gives analytics a failure category that never carries a server message.

### The design

The owner's reference was a food app with a full-bleed photo, a big title
and one black pill. The only image in the repo big enough to fill a phone's
width is the 1024px icon drawing. `designs/make-hero.py` inverts it to light
lines on ink, duotones it to the palette and bakes in the fade to
`ink.base`. So the screen needs no gradient library and shows no seam, and
at 107KB it costs little. Over it sit the wordmark, the four Masters' faces,
a 40pt title, one line of promise and a white "Continue with Google" pill
with Google's four-colour G, as its branding asks. The legal line under it
links to the real terms and privacy pages, now kept in `lib/links.ts` so
settings cannot drift from them.

### Analytics (D-041)

The TelemetryDeck React Native guide monkey-patches `globalThis.crypto`
with `expo-crypto`. That is a native module, so it would have meant a new
EAS development build. The SDK source showed a `subtleCrypto` option, so
`@noble/hashes` (pure JS) is passed in and nothing global is touched. A
local Node check confirmed the hash matches Node's crypto and the signal
body is correctly shaped. Nothing was sent.

The React SDK also has a trap: with `testMode` undefined, it reads
`window.location.hostname`. React Native has `window` but no `location`,
so the read throws. `testMode` is always passed.

Identity is a random per-install id, never the account. That keeps one
person's welcome-to-first-message path a single funnel across sign-in, and
it means nothing personal leaves the phone. `systems/10-analytics.md` has
the signals, the payloads and how to build the funnel.

### Found along the way

- `prettier` reformatted a file to 80 columns; the repo has no config and
  is written at about 100. The file was reverted and the edit redone. It
  is now a trap in START-HERE.
- `pnpm add` re-resolved three `expo` peer entries in the lockfile to
  native's react 19.2.3. The web app still resolves 19.2.8.

### Not proven

Nothing ran on a device, and no signal has reached TelemetryDeck. The app
bundles for Android (`expo export`) with the SDK, `@noble/hashes` and the
hero. The first real signals will come from a development build, so they
appear only with the dashboard's Test Mode toggle on.

### Flags for the owner

- **The privacy policy and Play data safety** must mention TelemetryDeck
  before launch. Suggested wording is in `systems/10-analytics.md`.
- **The hero is Vagabond artwork**, like the icon it comes from.

---

## Session 4 — 2026-09-10

**Onboarding rebuilt around sign-in, the motion calmed, faces for the
Masters, and every screen given one thing to look at. Plan 06, 23 commits.**

The owner's brief was that the app should feel serious, not showy. The
first screen was also lying, and several screens gave the eye nowhere to
land.

### Auth-first (D-038, D-039)

"Try it — no account" was untrue, because nothing works without an
account. Welcome now has one "Get started" that goes to Google sign-in, and
the quiz runs after it. The hard part was the claim. It used to fire when
a draft reached the sign-in screen. Moving onboarding after sign-in without
moving that trigger would have saved an empty draft the moment anyone
signed in, and skipped them past the quiz for good. So B1 and B4 landed as
one commit. The draft is now claimed when the offer screen marks it
`finishedAt`.

Routing is one gate in `app/(app)/_layout.tsx`. A root `app/index.tsx` gate
was tried first and collided with `(app)/index.tsx`, because route groups
add no path segment. Welcome moved to `/welcome` instead.

Google is the only provider; Apple is commented out in three places. The
server now prints the redirect URI to register at boot, and warns when
`BETTER_AUTH_URL` cannot work from a phone. It currently cannot:
`BETTER_AUTH_URL` is `http://localhost:3000` while the app talks to
`http://192.168.1.5:3000`. `systems/06-auth.md` covers the fix from
nothing.

### Restraint (D-036)

Rather than editing every screen, the presets themselves changed. Every
entry is now a 220ms settle with at most 6px of rise, nothing arrives from
the side, and delays are compressed to 40%. The owner asked to keep the
original choreography on forging, the offer and the paywall, so it survives
behind an `expressive` motion tone that only those three opt into. A new
screen is calm unless it asks otherwise.

### Legibility

- **The 4/4 bug had two causes.** `Touchable` put the caller's style on an
  inner view, so a `flex: 1` chip collapsed to zero width and showed no
  label. The screen also did not scroll, so on a short phone the time row
  overflowed and painted over "Unbreakable". Both are fixed, and the time
  is now its own section.
- **Ticks (D-037).** The slash in a box read as nothing. A selection is
  now a green circle with a checkmark. Options that are one of several show
  an empty ring, and multi-select chips show a "+".
- **Icons.** Text glyphs (← › ✕ + ↑) and blade marks used as bullets were
  replaced with Ionicons through `components/icon.tsx`. Blade marks stay
  wherever they mean progress.
- **Faces.** `designs/crop-portraits.py` cuts a square around each face,
  once. Sun Tzu's portrait is 1:2 with the face in the top third, so a
  centred crop showed his robe. `MasterAvatar` is in onboarding, chat, the
  roster, the switch sheet, stories and home. Locked Masters show as dimmed
  faces with a lock badge, where they used to be dimmed rows.
- **Focus.** On the payoff, home and offer screens, one card now has a
  coloured ground and a heavy border, and nothing else does. The offer
  leads with a solid gold 60% OFF block beside a 52pt red-edged countdown.
  Once today's trial is done, home offers the next move instead of going
  quiet.

### Found along the way

- The evening reminder, and its preview, came from Seneca, who is locked
  until Day 7. Both reminders now come from the user's own Master.
- "5 masters to earn" was still hardcoded from the Mandela era.
- The aha screen still said a typed problem "takes an account". It called
  an authored sample "1 of 3 free answers" and had two buttons with no
  handlers.
- The session-4 decisions were first cited in code as D-031 to D-034, and
  those numbers were already taken. They were renumbered to D-036 to D-039
  before anything was recorded.
- A `tsc` run in `packages/env` left three `.js` files beside the sources.
  This is the trap START-HERE already warns about. They were deleted.

### Not proven

Nothing in this session ran on a device. Every screen was typechecked and
the app bundled with `expo export`, which proves that the imports and the
portrait assets resolve, and nothing more. Nobody has completed a Google
sign-in.

### Flags for the owner

- **Figures with no data behind them:** "2.4× more often", 18% vs 43%, and
  the named testimonials on the offer and paywall. They are design copy.
  Replace them with real numbers after launch, or cut them.
- **Soft portraits:** Curie (120px) and Sun Tzu (128px) go soft above about
  64pt.
- **The Musashi portraits are *Vagabond* artwork**, the same risk as the
  icon.
- **The draft is per device, not per account.** If a finished draft is
  still unclaimed when a different account signs in on the same phone, the
  second account gets it. That is rare, and not fixed.

---

## Session 3 — 2026-09-10

**Every remaining buildable todo in plans 01–04, four gaps no plan had, and
three bugs found only by running things. 26 commits.**

The honest summary first: a great deal is now built and verified, and two
things are still unproven by any of it. No Master has ever replied to anyone,
and nothing has run on a phone.

### Found by reading before building

Four gaps were added to the plans before any code, because none was in them:
nothing ever created a Charge; three of five Pro gates ignored `expiresAt`;
nothing read the session at launch; and a new user's Chat tab had no thread
to send on. Two more surfaced mid-session: chat never loaded a thread's
history, which was added to the plan as 01 T11b before it was built, and
refusals reached the screen as raw JSON, which was small enough to fix
directly in one commit.

And one that had been shipping: **sign-in routed to `/(drawer)`, a group
that does not exist.** Every successful sign-in landed on not-found.

### Mandela, withdrawn properly

Deactivating him was one line. Doing it without breaking D-007 was not:
reassigning his four library stories to Seneca would have had Seneca
narrating Rivonia as his own life, in the seed, where no citation check can
see it. Each was retold from the new Master's own corpus — Nero sending word
(Tacitus), the letter from Corsica to his mother, De Ira to Novatus, Curie's
attic. The first draft of the De Ira line added a clause that is not in the
work, and it was cut before commit.

Removing him also broke copy no grep for "mandela" would find: "five
people", "all five", "The other four" — and "No waiting for Day 7, 14 or 21"
on the offer and paywall, where Day 14 was his. That count and those days
are now derived from the Master list (D-033). **Day 14 is now empty, and
that is the owner's call.**

Musashi's onboarding sample, the first thing any visitor reads, was also
stating the Yoshioka duel as first-hand fact and citing Go Rin No Sho, which
names no opponent. It now says "They tell a story of me".

### Citations, charges, refunds — the Master system, enforced

T11 asked for a decision on streaming, and the answer is not to stream
(D-030). A streamed sentence has been read; an invented duel cannot be
withdrawn by rejecting it afterwards. So a reply is generated in full with
memory read-only, validated, retried once with a correction, and released
sentence by sentence. Only the accepted exchange enters Mastra's history.

The reply ends in two machine lines, `<<<charge: …>>>` and `<<<cited: ID>>>`
(D-031). The charge becomes a Charge row due on the user's local date and a
card under the letter — labelled "Your charge", overriding screen 14's "Your
trial" because the naming rule outranks one screen (D-035). A question spent
on an answer never delivered is refunded (D-032).

### Onboarding persistence

The claim is idempotent and the first claim wins (D-034). The race check
failed the first time: Prisma's upsert is not atomic on insert, so two
concurrent claims both inserted Profile and one threw. Now retried on P2002,
and three concurrent claims produce one row, three rounds running. The
first thread is created in the same transaction, titled with the user's own
words, and Chat offers that problem back unsent.

### Notifications

Prompt once, remember a refusal and never re-ask. Two daily reminders in the
exact shape screen 10 previewed — the morning carrying the day's real trial.
A streak warning only on the day the streak would break, which exposed that
the home screen was showing streaks users had already lost.

### RevenueCat, ahead of the keys

The webhook needs a secret, not the store keys, so it was built. It never
grants on doubt, ignores stale expirations, and revokes on transfer without
granting.

### What was verified, and how

No model was called and no device was used. Everything else ran against
real code paths, the real database and Mastra's real store, with users and
threads created for each check and deleted after it:

| Check | Result |
|---|---|
| Withdrawn Master through every procedure | refused; switch refused with a real thread |
| Expired-but-flagged subscription | free in all four gates; lifetime and future expiry Pro |
| Claim: fresh, retry on Day 12, 3×3 concurrent | answers kept, Day 12 kept, 1/1/1 rows |
| Webhook, 12 synthetic events | every case, including 401, 503, stale expiry, transfer |
| Citation validator | 13 fixtures, then 9 with charges; no trailer leaks |
| Charge loop | listed, accepted, Bushido 0 → 5 → 5 |
| History round trip | 24 messages in order, charge re-attached as ACCEPTED |
| Streak shown / at risk | 4 cases against the database |
| Streak warning time, chat error text | 5 and 10 fixtures, logic pulled out of React Native |
| Whole monorepo | `pnpm check-types`, 4 of 4 |

### What went wrong on my side

`tsc -b` ran at the repo root twice, because parallel shell calls share one
working directory and a `cd` in one moved the next. Each time it wrote about
110 `.js` files across every app and package. Both times they were
inventoried, confirmed untracked and minutes old, and deleted; nothing
tracked was touched. A Python heredoc also turned an escaped newline into a
real one and broke a string, caught by `tsc`. All three are now in
AGENT-PROCESS as local facts.

---

## Session 2 — 2026-09-09

**The corpus the reset emptied, rebuilt as something that can be checked
rather than admired. Six commits.**

The database was seeded again at the end of this session: 5 Masters, 28
Moments, 14 quotations. Chat is no longer blocked on data — only on
`OPENROUTER_API_KEY`.

### The seed did not compile

Worth saying first, because it changes how session 1 reads. The schema moved
to voice fields in `53cb261` and the seed was never moved with it, so
`packages/db/prisma/seed/index.ts` had not type-checked since. That is why
chat was down. The reset emptied the database; the seed could not refill it.

The lesson is the one in AGENT-PROCESS and it was skipped: run the toolchain
in minute five. `tsc` said this in nine seconds.

### Voice, as five fields and a prohibition list

The paragraphs from `53cb261^` were mined rather than rewritten, so it is the
same Musashi — split into fields that can be inspected one at a time. Each
`cadenceSample` carries a modern-bridge line, because D-011 is the product
and a model asked to invent the crossing from an adjective produces a lecture
about the past instead.

`characteristicMove` is now enforced unique at seed time. Two Masters sharing
one is where the collapse in D-013 starts, and it is invisible in a diff of
five prose blocks that each read well alone.

### The corpus is less well attested than it read

Tiering it honestly was the substantive work, and the result is unflattering,
which is the point:

| | tiers |
|---|---|
| musashi | TRADITIONAL 3, DOCUMENTED 1 |
| seneca | DOCUMENTED 1, ATTESTED 3 |
| curie | DOCUMENTED 2, ATTESTED 2 |
| sun-tzu | TRADITIONAL 1, DISPUTED 1, PRINCIPLE 2 |

Three bodies claimed more than their sources support and were cut back.
Seneca asserted his innocence of the adultery charge — the charge is Dio's
and Seneca never answers it. Mandela named the warder he seated at his
inauguration — that former warders were his guests is well attested, which
men is not. Curie fainted from hunger in her attic — that is Ève Curie's
1937 biography, not Marie's own notes, and it is the single most repeated
detail of her student years.

Sun Tzu was restructured rather than tiered. Two of his three entries made no
claim about his life at all, and one of them said *"I wrote it because"*,
which is the one thing about him that is genuinely contested. Both became
principles, which left his biography as what it honestly is: one traditional
story. The Boju command was added as the corpus's only `DISPUTED` row —
Sima Qian credits him, the Zuo Zhuan is far closer to that war and does not
mention him.

### Which immediately found a bug

A tier nothing occupies is a tier nobody checks. Putting the first entry in
`DISPUTED` made a two-year-old assumption fail out loud: `CONFIDENCE_BIAS`
gave it −8, but retrieval then took the top `limit` entries, and Sun Tzu has
four entries against a limit of four. Everything was returned regardless of
score. `retrieveContext("sun-tzu", "Zqxwv plimth garnok yulbrat")` came back
with his contested claim to have commanded at Boju.

D-008 asks for eligibility and the code was doing ranking. Now a `DISPUTED`
entry is carried only if it matched a theme *and* out-scored the best
non-disputed entry.

### Three checks that throw before a row is written

Each was made to fail once, deliberately, which is the half of that rule that
usually gets skipped:

- `assertDistinctMoves` — duplicate `characteristicMove`, fewer than three
  `neverDo`, fewer than two principles.
- `assertCorpusIsAttested` — a `MOMENT` with no tier or no citation. This one
  matters because the seed writer defaults a missing confidence to `ATTESTED`:
  a legend that forgot its tier would be spoken with *more* certainty than a
  letter Seneca demonstrably wrote, arriving by omission rather than decision.
- The quotation floor — two per Master, each naming a work.

### What was verified, and how

No model was called; `OPENROUTER_API_KEY` is still missing. Everything below
was run against the real code paths and a real database.

- The principle floor (D-009): `retrieveContext` for all four active Masters
  with `"Zqxwv plimth garnok yulbrat, snerfle wompus?"`. All four returned a
  principle.
- The `DISPUTED` fix: three questions — nonsense, unrelated-but-real, and
  one about credit and reputation. Only the third offers Boju.
- Quotations: a question about regret pulls Musashi's Dokkōdō line, anxiety
  pulls Seneca's Letter 13.
- One compiled prompt read end to end (Musashi, 6,864 chars).
- `pnpm check-types` clean across all nine packages.

**Not verified:** whether the four actually *sound* different. That is T12,
it needs the key, and it is the only check that catches D-013. Everything
here makes collapse harder to write; none of it proves collapse has not
happened.

---

## Session 1 — 2026-09-09

**Scaffolded from a bare Better-T-Stack template to a deployed marketing
site, a complete app UI, and a Master system whose guardrails are structural
rather than hopeful. 100+ commits.**

### Foundation

Design tokens extracted from the two standalone design files rather than
invented — every colour, type step, radius and space traced to a screen.
Motion tokens are the native expansion of the six CSS keyframes the design
carried, since a static export cannot express motion.

The blade mark system replaced every checkbox, dot, spinner and progress
ring. State is carried by fill rather than shape, which is what makes a rail
of them read as one continuous edge. The 2px radius was the most-used value
in the entire design and is the reason the UI reads as edged.

### The app

Twelve onboarding screens and eight app screens plus three overlays, each
element on its own entry beat — nothing on an onboarding screen arrives at
the same time as anything else. Later, a `Touchable` layer added press
feedback with haptics matched to consequence, so a refused Master is *felt*
as a warning before it is read.

### The Master system — the substantive work

This started as five hand-written voice essays and a prompt that asked the
model nicely not to invent history. It is now structural:

- **Voice is data.** `register`, `syntax`, `person`, `characteristicMove`,
  `cadenceSample`, `neverDo` are columns compiled into the prompt at request
  time. A sixth Master is a row and a corpus, not another essay.
- **Confidence is tiered** (D-008), because the five are not equally
  documented. Seneca's letters are extant text; Musashi's duels come largely
  from an account written ~130 years after his death; Sun Tzu may not have
  been one person. The tier drives retrieval weight *and* how a claim may be
  phrased.
- **`PRINCIPLE` entries** (D-009) guarantee a Master always has something
  real to stand on. The insight worth keeping: an unanchored Master is the
  state in which models invent, so "nothing matched" is made unreachable
  rather than discouraged.
- **Quotation moved to a table** (D-010). Forbidding quotation makes the
  product weaker; letting the model quote from memory guarantees eventual
  misattribution, which for this app is the most embarrassing failure
  available.
- **The modern bridge** (D-011) is written into the law as product, not
  guardrail. The Master names the modern thing, says he had no such thing,
  and crosses to what it actually is.

**The owner's framing changed one thing materially.** I had proposed the
Master decline to recognise modern objects. The owner pointed out that
bringing Musashi *into today* is the entire value proposition. The rule now
requires the crossing and forbids only the adjacent failure — the crossing
becoming a lecture about his own era.

**My own view, recorded because it is a bet:** the likelier failure is not
fabrication but collapse — all Masters drifting into the same patient sage
(D-013). It degrades quietly and no single reply looks wrong. `neverDo` and
`characteristicMove` exist for it, and `plans/01-master-corpus.md` T12 is the only check that
would catch it.

### The marketing site

Five pages, deployed. The two store-required utility pages are real: support
writes to the database (verified end to end in a browser) and account
deletion was tested against a real account through the emailed-token flow.

### Divergences from the specs

- **"Try it — no account"** (design screen 01) versus auth-required. Resolved
  by making the four sample problems fixed with *authored* answers, so the
  aha lands with no model call, no quota spend and no anonymous rows.
- **Screen 05 became a ladder, not a picker**, once only Musashi was
  unlocked at Day 1. Rendered from data, so unlocking someone is a data
  change.
- **Mandela withdrawn** on the owner's instruction (D-006), app screens only.
  `active: false` rather than deleted, so his corpus survives if reversed.

### Bugs found by looking rather than by building

Three the build never caught, all in the marketing site, all found by opening
the page:

1. **Every Mincho heading was rendering in DM Sans.** next/font set its
   variables on `<body>`; `tokens.css` reads them from `:root`, which cannot
   see them. Build was green throughout.
2. **`next dev` was entirely broken** — Turbopack cannot resolve its own
   internal font module under pnpm's isolated linker. Production built fine.
3. **Support and delete-account had no page titles** — `"use client"` pages
   cannot export metadata. Those are the exact two URLs a store reviewer
   opens.

The lesson is Pillar 6's: three layers agreeing with each other while
disagreeing with reality.

### Mistakes worth recording

- **A regex rewrite mangled six files.** A blanket `})}` → `}}` replacement
  destroyed arrow functions inside style props. Reverted from git and redone
  by hand with exact matches. Nothing survived, but it was in history briefly.
- **`git add -A` produced one oversized commit** covering routing,
  interactions and overlays. I had flagged the risk in an earlier response
  and shipped it anyway. Fix: stage explicit paths, never `-A`.
- **`git stash -u` plus `filter-branch` deleted the design file from disk**
  during the history rewrite. Recovered byte-for-byte from the pre-rewrite
  blob. No loss, but it came close.
- **I read a caret range as a pinned version.** Copied `^16.3.4` from
  word-hug's manifest when its *lockfile* pinned 16.3.4 exactly; ours floated
  to 16.5.0 and broke the Android build on Kotlin metadata. Read the
  resolved version, not the spec.

### What is verified and what is not

**Verified by execution:** all four packages typecheck; `next build` emits
seven static routes; the server boots and `/ai` returns 401 unauthenticated;
the support form writes to Postgres; the deletion cascade was proven with a
seeded account (user, profile, progress, threads, charges, usage all to zero,
audit row surviving); `expo prebuild` completes; expo-doctor 21/21.

**Not verified:** anything on a device. No screen in this app has ever
rendered on hardware. No Master has ever answered — `OPENROUTER_API_KEY` is
absent, so the entire chat path is typechecked and unexercised. Docker images
are statically checked only; Docker is not installed on the owner's machine.

### Next

`plans/01-master-corpus.md` T04. The database is empty and chat is down until
the corpus is re-seeded — that has to come before anything else, because
nothing downstream is testable without it.

Then T12, the voice evaluation, **before** authoring more corpus. The corpus
is tuned to the voice; finding out the voice is wrong afterwards means
rewriting both.
