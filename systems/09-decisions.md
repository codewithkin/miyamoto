# Decisions

Numbered, immutable, cited by number. When code does something that looks
wrong until you know why, the comment should say `(D-0NN)` rather than
"careful here".

A decision is never edited. If one is reversed, add a new one that says so
and mark the old **Superseded by D-0NN**.

---

## Product

**D-001 — The Masters never comfort.**
No sympathy opener, no validation, no "that sounds hard", no therapy
vocabulary, no encouragement, no exclamation marks. The product exists
because the user has somewhere else to go for sympathy. Enforced in the
shared law in `apps/server/src/mastra/template.ts`.

**D-002 — Every answer ends in one concrete action, today.**
Small enough to finish before sleeping, specific enough that the user knows
whether they did it. Never two options.

**D-003 — A *Trial* is an authored Path day. A *Charge* is what a Master
hands you in chat.**
They are separate tables with identical completion mechanics. Streaks count
Trials only, so a streak cannot be farmed from chat; the Bushido score
counts both.

**D-004 — Auth is required before the first real question.**
No anonymous sessions. The four onboarding sample problems are fixed and
have *authored* answers (`apps/native/content/sample-answers.ts`), which is
how the design's "Try it — no account" promise is kept without a model call,
a quota spend, or a throwaway user row.

**D-005 — Masters are earned, not chosen.**
Musashi from Day 1; Seneca Day 7, Mandela Day 14, Curie Day 21, Sun Tzu
behind Pro. Those are the three waits the paywall copy advertises. Onboarding
screen 05 is therefore a ladder, not a picker.

**D-006 — Mandela is withdrawn from the app.**
Died 2013 with an estate that actively enforces personality rights — a
different footing from Musashi (1645) or Sun Tzu (BC). `Master.active` is
false rather than deleting him, so his corpus survives if this reverses.
Still present on the marketing site; to be removed there later.
See `Master.rightsNote` — a sixth Master gets assessed before being written.

---

## The Masters' truthfulness

**D-007 — The corpus is the only permitted source of biography.**
A Master may not describe an event from their life that is not a `Moment`
row. This is the product's central promise and its largest liability.

**D-008 — Confidence is tiered, and the tier changes how a claim may be
spoken.**
`DOCUMENTED` / `ATTESTED` state plainly; `TRADITIONAL` must be told as
inherited account; `DISPUTED` must out-match everything else before it is
offered. The five Masters are not equally documented — Seneca's letters are
extant text, Musashi's duels come largely from an account written ~130 years
after his death, Sun Tzu may not have been one person — and the schema must
not pretend otherwise.

**D-009 — `PRINCIPLE` entries guarantee a Master always has something to
stand on.**
Retrieval always carries at least one. An unanchored Master is the state in
which models invent, so it is made unreachable rather than discouraged.

**D-010 — Quotation is allowed, and only from the `Quotation` table.**
Verbatim, never reconstructed from memory. Forbidding quotation entirely
makes the product weaker — "We suffer more often in imagination than in
reality" is *the* Seneca line — while letting the model quote from memory
guarantees eventual misattribution, which is the most embarrassing failure
available to an app whose promise is that these were real people.

**D-011 — The Master names modern things, then crosses to what they are.**
Not "I do not know what Slack is", and not pretending to have used it:
*"We had no such thing as a group message. We had the room, and who was in
it when a thing was said."* That crossing is the product. The adjacent
failure — the crossing becoming a lecture about his own era — is forbidden
in the same rule.

**D-012 — The model must cite the corpus entry it drew on.**
Structured output; a first-person historical claim citing nothing is
rejected and retried. Makes fabrication visible rather than something to
detect afterwards.

**D-013 — The likelier failure is collapse, not fabrication.**
All five drifting into the same patient sage degrades quietly and is not
obviously wrong on any single reply. `neverDo` and `characteristicMove`
exist for this and are the fields to strengthen first when a Master reads
generically.

---

## Architecture

**D-014 — Mastra owns conversation content; Prisma owns everything else.**
Mastra writes to the same Postgres in its own `mastra` schema, so its tables
cannot collide with a Prisma migration. `Thread` in Prisma holds only
metadata — owner, current Master, title. Both halves being rows in one
database is what makes cross-device sync free.

**D-015 — A Master's voice is data, not code.**
`register`, `syntax`, `person`, `characteristicMove`, `cadenceSample`,
`neverDo` are columns compiled into the prompt at request time. A sixth
Master is a row and a corpus, not another essay. What stays in code is the
model each Master runs on.

**D-016 — Prisma is not on the tRPC context.**
Putting it there makes every inferred tRPC type reference Prisma's generated
internals, which are not nameable across packages and break declaration emit
with TS2883. Routers import the client directly.

**D-017 — Every "day" is the user's local day, server-enforced.**
Stored as `YYYY-MM-DD` strings, resolved against `Profile.timezone`. The
free 3/day counter, streaks and Day 29 all depend on it. A UTC boundary
either hands out six free questions or breaks a streak the user kept.

**D-018 — The free counter is server-side only.**
A counter the client can edit is not a counter, and the whole Pro
proposition rests on it. The question is spent *before* the answer is
generated.

**D-019 — `prisma generate` must work without `DATABASE_URL`.**
`prisma.config.ts` falls back to an unusable placeholder, because generate
only reads the schema. Without this, `pnpm install` fails in any CI that has
no database — which is what broke the first EAS build. Anything that
actually connects still fails loudly and names the missing variable.

**D-020 — `output: "standalone"` is set everywhere except Vercel.**
Standalone and Vercel's build pipeline are mutually exclusive: standalone
skips the `.nft.json` trace files Vercel's own step then reads. Keyed off
the `VERCEL` env var so Docker and Vercel each get the output they can use.

---

## Payments, mail, stores

**D-021 — RevenueCat, `appUserID` bound to the Better-Auth user id.**
So entitlement follows the account rather than the install, and no mapping
table has to be kept in sync. A failed entitlement lookup returns false —
a network error must never silently grant Pro.

**D-022 — Expo Go does not work.** RevenueCat and the font config plugin
both need native modules. Development builds only.

**D-023 — `react-native-google-mobile-ads` is pinned exactly to 16.3.4.**
16.5.0 pulls `play-services-ads` 25.4.0, built with Kotlin 2.3 metadata that
Expo SDK 57's Kotlin 2.1 compiler cannot read. Pinned rather than ranged
because a lockfile refresh would float straight back into the same failure.

**D-024 — The rewarded ad grants nothing; the server does.**
`showRewardedAd` resolves true only on an earned reward. A broken ad unit
must not be able to mint free questions.

**D-025 — Mail failures are logged, never surfaced.**
`sendMail` always resolves. The deletion route's response must be identical
whether or not the address has an account, and delivery is only attempted
for addresses that exist — so branching on delivery would leak exactly which
emails are registered. Check `[mail]` in deployment logs, not the UI.

**D-026 — Web deletion never deletes on submission.**
The form is unauthenticated, so acting immediately would let anyone erase an
account by typing its email. A single-use 24h token is emailed; the
confirmation page does the erase, and is not auto-triggered on load so a
link-preview fetcher cannot destroy an account.

**D-027 — In-app deletion has no token but does require retyping the email.**
The session already proves identity, so a token would only make the
Play-required path worse. The retype is friction proportionate to an
irreversible outcome, not security.

---

## Process

**D-028 — Destructive actions are authorised before launch, on condition
they are announced.**
Resetting the database pre-launch is fine and announced in the response that
does it, never only in a commit message. Reverses when marketing starts.
See `CLAUDE.md`.

**D-029 — One todo, one commit.**
Where a change genuinely cannot be split — a Prisma file whose models are
mutually referential, a generated lockfile — the commit says so rather than
pretending it was scoped.
