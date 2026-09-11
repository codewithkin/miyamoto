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
**Superseded in part by D-038:** the rule stands, but the "no account"
promise is gone. Sign-in now comes first, and the sample answers are shown
to a signed-in user.

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

---

## The Masters, enforced (session 3)

**D-030 — A Master's reply is validated before any of it is shown.**
Generated in full with memory read-only, checked against the corpus it was
given, retried once with a correction, then released sentence by sentence.
A token stream and a validated reply do not compose: a streamed sentence has
already been read, and an invented duel cannot be withdrawn by rejecting it
afterwards. The cost is latency, which the "is writing…" state covers. Only
the accepted exchange is saved to Mastra memory, so a rejected draft never
becomes something the Master "said".

**D-031 — The reply ends in two machine lines, not structured output.**
`<<<charge: …>>>` then `<<<cited: ID>>>`, both stripped server-side; the
charge becomes a Charge row and a card. A JSON envelope would put the letter
inside a string and make the Master's cadence depend on escaping. A first
draft gets no leniency on either line. A retry may omit the citation only if
it claims no life event, and may omit the charge. The truth rules are never
relaxed. See `checkReply` in `apps/server/src/mastra/template.ts`.

**D-032 — A question spent on an answer never delivered is refunded.**
A withdrawn Master, a model failure, a reply rejected twice. Spending first
(D-018) stands. A refund only follows a failure on our side and delivers
nothing, so it reopens no hole. It refunds the local date it was charged to.

**D-033 — Withdrawn is not locked.**
A locked Master or Pro story is returned with its content withheld, because
showing what has not been earned is the mechanic. A withdrawn one (`active`
false) is NOT_FOUND everywhere, deep links included, because there is
nothing to earn. Copy that counts Masters or names unlock days is derived
from the Master list, since withdrawing one stranded "five" and "Day 14" on
six screens.

**D-034 — The onboarding claim is idempotent, and the first claim wins.**
The device submits from the app shell until the server confirms, and clears
its draft only then. The server never overwrites answers, creates Profile
and PathProgress only if missing, and resolves concurrent claims to one row
(Prisma's upsert is not atomic on insert; P2002 is retried). A claim on Day
12 from a new phone changes nothing.

**D-035 — The chat card says "Your charge", not screen 14's "Your trial".**
The naming rule (CLAUDE.md, D-003) spans screens and outranks one screen's
copy: a Trial is an authored Path day and feeds the streak; a Charge does
not. Registered as a design exception in START-HERE.

---

## Onboarding rework (session 4)

**D-036 — Motion is restrained by default; three screens opt out.**
The owner found the motion over the top for a serious product. Every entry
preset now resolves to a short settle: 220ms, at most 6px of vertical
travel, nothing from the side, no bounce, spin, flip, roll or pinwheel, and
stagger delays compressed to 40%. The original choreography survives behind
an `expressive` motion tone, which forging, the one-time offer and the Pro
paywall opt into because the owner asked to keep them. The default is
calm, so a new screen is restrained unless it asks not to be. See
`MotionTone` in `apps/native/components/motion.tsx` and `restraint` in
`apps/native/theme/motion.ts`.

**D-037 — Selection is marked with a real tick, not a blade mark.**
Blade marks remain the brand's language for progress (rails, the charge
header, the forge). For "this is chosen" they failed: the owner could not
read a slash in a box as selected. `BladeTick` is a green circle with a
checkmark, and an empty ring when not chosen. Options that are one of
several show the ring (radio), and multi-select chips show a "+" until
picked. Blade marks used as generic bullets were replaced with icons too.

**D-038 — Sign-in comes first, and onboarding runs after it.**
A signed-out person can reach `/welcome` and `/sign-in`, nothing else.
`app/(app)/_layout.tsx` is the single gate. With no session it sends the
user to welcome. With a session and no finished draft, it asks the server
whether this account is onboarded, and sends a new account to the quiz.
Otherwise it opens the app. The draft is claimed when the offer screen
marks it `finishedAt`, not when sign-in was reached; claiming on arrival
would have saved an empty draft and skipped the quiz for good. A finished
draft counts as onboarded before the claim lands, so going offline at the
end never puts the user back in the quiz.

**D-039 — Google is the only sign-in provider, for now.**
Apple is commented out, not deleted, in three places: the env schema, the
provider block and the sign-in screen. `systems/06-auth.md` covers turning
it back on. The Google client is a *Web application*, because the server is
the OAuth client. The server prints the redirect URI to register at boot,
and warns if `BETTER_AUTH_URL` is localhost or plain http. Either one
leaves a phone stranded after the account chooser.

---

## Welcome and analytics (session 5)

**D-040 — Welcome is the sign-in screen.**
With one provider, a separate sign-in screen was a second tap to reach the
only thing a new person can do. Welcome's single button is "Continue with
Google" and runs the sign-in. `/sign-in` no longer exists. D-038 still
holds, except that a signed-out person can now reach only `/welcome`. The
sign-in logic lives in `apps/native/lib/use-google-sign-in.ts`. If Apple
returns, it gets a second button on welcome, not its own screen.

**D-041 — Analytics count installs, not people, and never content.**
TelemetryDeck, through `track()` in `apps/native/lib/telemetry.tsx`. The
identity is a random per-install id in SecureStore, salted and hashed by
the SDK. It is never the account id or the email. Payloads are short
enums, counts and slugs, never message text or anything the user typed.
Development builds report in test mode. The full list of signals is in
`systems/10-analytics.md`, and a new signal is added there in the same
commit.

---

## Deploys (session 6)

**D-042 — Vercel's Node.js runtime type-checks `apps/server` a second
time, on its own terms.**
Independently of `tsdown` (our real build, which already succeeds),
Vercel detects `apps/server/src/index.ts` as a server entrypoint and
type-checks it and everything it imports under settings we do not
control — one that does not support the "Path Mappings" or "Project
References" tsconfig features, by Vercel's own documentation. This is why
a change can pass `pnpm check-types` cleanly and still fail on Vercel:
`apps/server/tsconfig.json`'s unused `paths` entry, and a `createEnv` call
with no site to infer its `clientPrefix` type parameter from, both did.
See `systems/12-deploys.md` for the full account and what to check first
the next time this happens.

**D-043 — A database reset needs fresh, explicit consent, every time —
pre-launch destructive-action authorisation does not cover it on its
own.**
`CLAUDE.md`'s pre-launch rule authorises destructive changes to *our own*
data without asking each time, provided they are announced. It was
written for resetting our own dev/prod database, not for a case where
ownership of the data is itself in question. Production's real
`DATABASE_URL` turned out to hold a table set (`Guardian`, `PaymentOrder`,
a `STUDENT_SCHOLAR` plan enum) with no relationship to this schema — a
leftover from an unrelated project, not out-of-sync Miyamoto data. That
distinction is exactly the kind a wrong guess is expensive on, so it
stopped rather than running `--accept-data-loss` under the general
authorisation, named what it found, and proceeded only once the owner
confirmed the data was disposable — via `AskUserQuestion`, with
`PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` set for that one command,
per the standing rule for dangerous Prisma actions. See
`systems/12-deploys.md`.

---

## Sign-in round trip (session 7)

**D-044 — A sign-in is finished by the link back into the app, not only
by the browser promise that started it.**
The Better Auth Expo plugin stores the session only when
`openAuthSessionAsync` resolves "success". On Android that promise races the
app becoming active ("dismiss") against the link arriving, and a cold start
(Android reclaiming the app while Chrome is in front; in a development build,
the dev launcher) leaves no promise at all. Every link therefore passes
through `app/+native-intent.tsx`, and `lib/auth-redirect.ts` stores a
`cookie=` link's session in the plugin's own key and format, confirms it with
the server, and routes to the gate. It does this only if a sign-in started on
this install within the last ten minutes. The pending marker in SecureStore
is set when sign-in starts and cleared on read, so a link from anywhere else
can't sign the phone into another account, and the sign-in is recorded
exactly once. Errors come back the same way: the server's `onAPIError.errorURL`
is the app's welcome link, never the API's own page. Sessions last 60 days,
refreshed at most daily while the app is in use. See `systems/06-auth.md`.

---

## Screen craft (session 7)

**D-045 — A screen opens with something to look at, one action, and colour
that means something.**
The owner named welcome as the bar for every screen ("a full course meal").
What made it work, and so what a new screen is held to:
1. A visual anchor above the fold. It can be a face, an icon or a number,
   not only a photo.
2. Exactly one filled, high-contrast action.
3. A hierarchy that never flattens to two sizes: eyebrow, headline, a line
   of context, then body.
4. Colour tied to meaning. Indigo for structure and progress, gold for
   earned or premium, green for confirmed, red only for alerts.
5. Real information over placeholders: a face rather than an initial, a
   number rather than a bullet.
`components/screen-hero.tsx` is the opening for any screen without a photo.
The exception is lists whose platform convention is plain, such as Settings:
a nav-bar title and grouped rows are correct there, and a hero would be
decoration. See `plans/08-visual-craft.md`.

**D-046 — Onboarding shows only true things.**
No invented user counts, ratings, testimonials or completion rates, and no
claims of personalisation the app doesn't do. Numbers and previews come
from real content. The owner chose this for the proof screen (session 7).
It claimed "10,431 people are on a trial right now" and "4.8 from 2,140
ratings" and quoted two named users, all with nothing behind them. It is
now "Your first week": Days 1–7 at the chosen pressure, from the seeded Path
via `path.preview`. Applying the rule surfaced the same fault elsewhere,
now fixed:
- Payoff showed the Firm Day 1 trial to everyone.
- Payoff's caption said it was "chosen from your wounds" when the Path is
  authored.
- Payoff and forging counted 10 or 16 trials when every pressure has 30.
- Forging "matched wounds to Act I".
- The quiz said "most people pick three" and "most people start at Firm".
Still pending the owner: payoff's "finish 2.4× more often" comparison, and
the named quotes on the offer and paywall (open item 4 in START-HERE).
Pre-launch, those are the owner's call; before launch, they are this rule's.
**Note (session 8):** payoff, the offer and "Your first week" were removed
with the rest of the quiz (D-048). Of the figures above, only the paywall's
"Tomás" quote remains.

## Requests, onboarding and feedback (session 8)

**D-047 — Every request to the server goes through `serverFetch`.**
On native the session is a cookie the app attaches by hand, so it's
attached in exactly one place: `apps/native/lib/server-fetch.ts`. tRPC,
chat history and the chat transport all call it, and the transport uses its
streaming variant on `expo/fetch`, because React Native's own `fetch` can't
stream a response. The failure this prevents: the chat transport built its
own request without the cookie, and the first message after sign-in came
back `POST /ai 401` while every tRPC screen worked. `pnpm check-types` in
apps/native runs `scripts/check-server-fetch.mjs`, which fails on a bare
`fetch(` anywhere else, and on a `DefaultChatTransport` without our fetch.
A 401, or a tRPC `UNAUTHORIZED`, asks Better Auth whether the session is
still live. If it's gone, the app goes to welcome with "You were signed out.
Sign in to carry on." See `systems/06-auth.md`.

**D-048 — Onboarding is one question, then the real chat.**
The owner's call (session 8): sign in, say what's troubling you (pick one of
four or type it), and land in a real conversation with a real Master, the
problem in the composer, unsent (D-018 still holds). The problem screen
claims the account itself, with Musashi, Firm pressure, reminders off and
this phone's timezone, then replaces to the chat. Everything after it is
gone: the sample answer, wounds, the Master and pressure choices, forging,
payoff, the first week, reminders and the offer. This supersedes the quiz
half of D-038; sign-in first still stands. Every row goes to Musashi,
because he's the only Master a new account has (Seneca arrives on Day 7,
Curie on Day 21), and a face promising Seneca would be untrue in a real
chat (D-046). What the quiz set is now a default. Reminders start off and
Settings turns them on. Pressure is Firm, and **nothing in the app changes
it yet** (open item in START-HERE).

**D-049 — Buttons show their work.**
Anything that waits on the server or the store is visibly waiting:
`<Button loading>` keeps the variant's colour, swaps the icon for a
spinner, shows a working label and ignores presses. A row that starts a
request shows the spinner on that row and dims its siblings. A disabled
Button is drawn in ink with faint text, never as a translucent copy of
itself. Where the server's answer is predictable, the screen shows it on
the tap and puts the previous state back if the server refuses, with a line
saying so: completing today's trial, a charge, switching Master, a
reminder time, and the free-question count. Only what's predictable is
predicted. Streak and score, and whether you can still ask, stay the
server's. Queries are fresh for 30 seconds, refetch when the app returns to
the foreground, never retry a 4xx, and are dropped when the signed-in
account changes.

**D-050 — The marketing site's build doesn't type-check.**
`apps/web`'s one link to the backend is `import type { AppRouter }`. To
type-check it, tsc follows it into `packages/api` and `packages/db`, whose
generated Prisma client the Vercel web build never produces. So
`next.config.ts` sets `typescript.ignoreBuildErrors`. The site's types are
still checked by `pnpm check-types` wherever the client exists. See
`systems/12-deploys.md`.
