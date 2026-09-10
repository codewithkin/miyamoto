# 01 — Master corpus and guardrails

**Status: built to T11b. T12 is next, and it is blocked on `OPENROUTER_API_KEY`.**

The schema, compiler and generation path landed in session 1. The corpus
itself landed in session 2 — voice fields, tiers, principles and quotations
— along with one retrieval bug it exposed.

> **The database is seeded again.** The reset of 2026-09-09 is undone:
> 5 Masters, 28 Moments (20 of them biographical, 8 principles), 14
> quotations. Chat is no longer blocked on data. It is still blocked on
> `OPENROUTER_API_KEY`, which is a different problem and the owner's.

Session 3 withdrew Mandela (T08–T10), made citation enforced rather than
requested (T11, D-030–D-032), wrote the charge a Master hands over (T11a)
and opened chat on its history (T11b). What remains is T12, the voice
evaluation — the only real check on D-013, and the first thing that will
show whether a real model follows the trailer format at all.

**Depends on:** nothing outstanding.
**Read first:** `systems/04-masters.md`, then `systems/09-decisions.md`
D-007 to D-013.

---

## Done

## T01 — Master voice fields, Moment tiers, Quotation table

- [x] `53cb261`
- **Commit:** `Make a Master data rather than an essay`
- **Touches:** `packages/db/prisma/schema/masters.prisma`
- **Done when:** schema validates, pushes, and a Master's voice is entirely
  expressible as columns.

## T02 — The template compiler

- [x] `109628d`
- **Commit:** `Add the Master template compiler`
- **Touches:** `apps/server/src/mastra/template.ts`
- **Done when:** one law, one compiler, and per-Master identity arrives only
  as arguments.

## T03 — Generation path rewired to the compiler

- [x] `da9b818`
- **Commit:** `Compile the prompt from the Master's row instead of a hardcoded essay`
- **Touches:** `mastra/masters.ts`, `mastra/index.ts`, `mastra/retrieval.ts`,
  `routes/ai.ts`
- **Done when:** no per-Master prose remains in code; an agent with no
  compiled prompt refuses rather than improvising.

## T04 — Backfill voice fields and `neverDo` for the four active Masters

- [x] `876c09b`
- **Commit:** `seed: give each Master a voice that can be diffed`
- **Touches:** `packages/db/prisma/seed/masters.ts`
- **Done when:** every active Master has all five voice fields and at least
  three `neverDo` entries, and no two Masters share a
  `characteristicMove`.
- **Note:** the old hand-written voice paragraphs are in git history at
  `53cb261^` — mine them rather than rewriting from scratch.

## T05 — Tier every Moment and add `sourceCitation`

- [x] `f2a41d5`
- **Commit:** `seed: tier the corpus by how well attested it is`
- **Depends on:** T04
- **Touches:** `packages/db/prisma/seed/masters.ts`
- **Done when:** every `MOMENT` has a confidence and a citation naming a work.
- **Be honest here.** Musashi's duels are largely `TRADITIONAL` — the
  *Nitenki* is hagiography written ~130 years later. Seneca's letters are
  `DOCUMENTED`. Marking a legend `ATTESTED` because it makes a better answer
  is the exact failure this system exists to prevent (D-008).

## T06 — `PRINCIPLE` entries per Master

- [x] `af7ecc2`
- **Commit:** `seed: give every Master something to stand on when nothing matches`
- **Depends on:** T05
- **Done when:** each active Master has ≥2 `PRINCIPLE` entries making no
  biographical claim, and retrieval returns one for a question matching
  nothing (D-009).

## T07 — Seed the `Quotation` table

- [x] `770d615`
- **Commit:** `seed: the lines a Master may quote verbatim`
- **Depends on:** T04
- **Done when:** each Master has ≥2 verified quotations with work and locus.
- **Excluded on purpose:** "Resentment is like drinking poison", "The
  greatest glory in living" (both routinely misattributed to Mandela), and
  "Every battle is won before it is fought" as Sun Tzu — a loose modern
  rendering. An app whose promise is that these were real people cannot be
  caught misquoting them (D-010).

## T07a — A DISPUTED entry must be earned, not merely ranked last

- [x] `d9060bd`
- **Commit:** `fix(server): stop DISPUTED entries riding along on a short corpus`
- **Depends on:** T05
- **Touches:** `apps/server/src/mastra/retrieval.ts`
- **Note (session 2):** not in the original plan. Found while verifying T06
  against the real retrieval path, and added here before being fixed.
- **The bug:** `CONFIDENCE_BIAS` gives `DISPUTED` −8, but retrieval then
  takes `scored.slice(0, limit)`. Where a Master has no more entries than
  the limit, *everything* is returned and the bias only reorders it. Sun Tzu
  has four entries and the limit is four, so his `DISPUTED` Boju claim was
  returned for the nonsense question `"Zqxwv plimth garnok yulbrat"`.
  Ranking was doing the work D-008 asks eligibility to do.
- **Done when:** a `DISPUTED` entry is returned only if it matched at least
  one theme *and* scored at or above the best non-disputed entry — and the
  nonsense question no longer returns Boju while a question about
  credit and reputation still does.

## T08 — Reassign Mandela's stories, deactivate him

- [x] `0ead343`
- **Commit:** `seed: withdraw Mandela from the app`
- **Depends on:** T05
- **Touches:** `packages/db/prisma/seed/masters.ts`, `seed/adversity.ts`
- **Done when:** `active: false`, `rightsNote` explains why (D-006), and his
  four stories are reassigned — `trusted-lied`, `estranged-family`,
  `cant-forgive` to Seneca; `no-routine` to Curie. `trusted-lied` is one of
  the four onboarding samples, so it cannot simply vanish.
- **Note (session 3):** reassigning a story means rewriting its body. Seneca
  cannot tell the Rivonia trial as his own life — that is D-007 broken in
  the seed itself. Each reassigned story is retold from the new Master's
  corpus, and its lesson and action kept where they still fit.

## T09 — Filter inactive Masters from every query

- [x] `e59a51e`
- **Commit:** `feat(api): withdraw inactive Masters from every surface`
- **Depends on:** T08
- **Touches:** `packages/api/src/routers/library.ts`, `chat.ts`
- **Done when:** `library.masters`, `switchMaster` and story queries all
  exclude inactive Masters, and switching to one is refused server-side.

## T10 — Remove Mandela from the native app screens

- [x] `5494ba6`
- **Commit:** `feat(native): drop Mandela from onboarding and samples`
- **Depends on:** T09
- **Touches:** `apps/native/content/onboarding-options.ts`,
  `apps/native/content/sample-answers.ts`
- **Done when:** he appears nowhere in the app, and the `betrayed` sample
  answer is a Seneca moment (his exile, condemned by men he knew) rather
  than a Mandela one.
- **Out of scope:** the marketing site. The owner wants him removed there
  later, separately.
- **Note (session 3):** the `betrayed` sample uses Seneca's Nero moment, not
  his exile. "Condemned by men he knew" is not in the corpus — the exile
  entry records a charge from Dio and nothing about who brought it — while
  Nero, whom he tutored, ordering his death is `ATTESTED` (Tacitus, Annals
  XV) and is exactly a trusted person turning. It also matches the
  reassigned `trusted-lied` library story, so the sample and the library
  tell one story rather than two.

## T11 — Citation enforcement

- [x] `f2d47c0`
- **Commit:** `feat(server): make the model name the corpus entry it used`
- **Depends on:** T06
- **Touches:** `apps/server/src/routes/ai.ts`, `mastra/template.ts`
- **Done when:** the model returns which `Moment` id it drew on; a reply
  making a first-person historical claim while citing nothing is rejected
  and retried once (D-012).
- **Watch:** this interacts with streaming. Structured output and a token
  stream do not compose for free — decide whether to validate post-stream
  and regenerate, or to buffer the first sentence. Record the choice.

## T11a — Write the Charge a Master hands over

- [x] `ab9b5e5` + `cc74337`
- **Commit:** `feat(server): record the charge at the end of every answer`
- **Depends on:** T11
- **Touches:** `apps/server/src/routes/ai.ts`, `mastra/template.ts`
- **Note (session 3):** not in the original plan. `chat.charges` and
  `respondToCharge` exist and nothing ever creates a `Charge` row, so the
  Bushido score cannot move from chat at all and D-003 is half-built. T11
  already makes the model emit a machine-readable trailer; the charge rides
  in the same trailer.
- **Done when:** an accepted reply writes one `Charge` due on the user's
  local today (D-017), attributed to the thread and Master, and the trailer
  never reaches the device.

## T11b — Chat opens on its history

- [x] `d3ca7be` + `6da674c`
- **Commit:** `feat(server): return a thread's history` then
  `feat(native): open a thread on what was already said`
- **Depends on:** T11
- **Touches:** `apps/server/src/routes/ai.ts`, `apps/native/app/(app)/chat.tsx`
- **Note (session 3):** not in the original plan. Mastra owns message
  content (D-014) and T11 saves every accepted exchange there, but nothing
  reads it back: `useChat` starts empty on every open, so a user returning
  to a thread sees a blank screen above the Master's name. The promise of
  switching Master "without losing the thread" is kept on the server and
  broken on the screen.
- **Done when:** an authenticated route returns an owned thread's messages
  from Mastra, refusing threads the caller does not own, and the chat screen
  opens a thread with them in place.

---

## Next

## T12 — Voice evaluation

- [ ] `pending-T12`
- **Commit:** `chore: evaluate Master voices against ten problems`
- **Depends on:** T04, T06, T07
- **Done when:** the same ten problems have been run against all four active
  Masters and the outputs read side by side.
- **Why this exists:** the entire product is the voice, and D-013 says the
  likely failure is all four collapsing into one patient sage — which no
  single reply looks wrong. This is the only check that catches it.
- **Blocked on:** `OPENROUTER_API_KEY`.
