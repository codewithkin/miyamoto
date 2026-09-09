# 01 — Master corpus and guardrails

**Status: in flight. This is the current work.**

Feature 1 (schema, compiler, generation path) is done and committed. What
remains is the corpus itself — the seed is empty because the schema change
required a database reset.

> **⚠️ The database is currently empty.** It was reset on 2026-09-09 to apply
> the new Master/Moment/Quotation schema, with the owner's confirmation. Chat
> will fail until T05–T08 land. This is expected, not a bug.

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

---

## Next

## T04 — Backfill voice fields and `neverDo` for the four active Masters

- [ ] `pending-T04`
- **Commit:** `seed: give each Master a voice that can be diffed`
- **Touches:** `packages/db/prisma/seed/masters.ts`
- **Done when:** every active Master has all five voice fields and at least
  three `neverDo` entries, and no two Masters share a
  `characteristicMove`.
- **Note:** the old hand-written voice paragraphs are in git history at
  `53cb261^` — mine them rather than rewriting from scratch.

## T05 — Tier every Moment and add `sourceCitation`

- [ ] `pending-T05`
- **Commit:** `seed: tier the corpus by how well attested it is`
- **Depends on:** T04
- **Touches:** `packages/db/prisma/seed/masters.ts`
- **Done when:** every `MOMENT` has a confidence and a citation naming a work.
- **Be honest here.** Musashi's duels are largely `TRADITIONAL` — the
  *Nitenki* is hagiography written ~130 years later. Seneca's letters are
  `DOCUMENTED`. Marking a legend `ATTESTED` because it makes a better answer
  is the exact failure this system exists to prevent (D-008).

## T06 — `PRINCIPLE` entries per Master

- [ ] `pending-T06`
- **Commit:** `seed: give every Master something to stand on when nothing matches`
- **Depends on:** T05
- **Done when:** each active Master has ≥2 `PRINCIPLE` entries making no
  biographical claim, and retrieval returns one for a question matching
  nothing (D-009).

## T07 — Seed the `Quotation` table

- [ ] `pending-T07`
- **Commit:** `seed: the lines a Master may quote verbatim`
- **Depends on:** T04
- **Done when:** each Master has ≥2 verified quotations with work and locus.
- **Excluded on purpose:** "Resentment is like drinking poison", "The
  greatest glory in living" (both routinely misattributed to Mandela), and
  "Every battle is won before it is fought" as Sun Tzu — a loose modern
  rendering. An app whose promise is that these were real people cannot be
  caught misquoting them (D-010).

## T08 — Reassign Mandela's stories, deactivate him

- [ ] `pending-T08`
- **Commit:** `seed: withdraw Mandela from the app`
- **Depends on:** T05
- **Touches:** `packages/db/prisma/seed/masters.ts`, `seed/adversity.ts`
- **Done when:** `active: false`, `rightsNote` explains why (D-006), and his
  four stories are reassigned — `trusted-lied`, `estranged-family`,
  `cant-forgive` to Seneca; `no-routine` to Curie. `trusted-lied` is one of
  the four onboarding samples, so it cannot simply vanish.

## T09 — Filter inactive Masters from every query

- [ ] `pending-T09`
- **Commit:** `feat(api): withdraw inactive Masters from every surface`
- **Depends on:** T08
- **Touches:** `packages/api/src/routers/library.ts`, `chat.ts`
- **Done when:** `library.masters`, `switchMaster` and story queries all
  exclude inactive Masters, and switching to one is refused server-side.

## T10 — Remove Mandela from the native app screens

- [ ] `pending-T10`
- **Commit:** `feat(native): drop Mandela from onboarding and samples`
- **Depends on:** T09
- **Touches:** `apps/native/content/onboarding-options.ts`,
  `apps/native/content/sample-answers.ts`
- **Done when:** he appears nowhere in the app, and the `betrayed` sample
  answer is a Seneca moment (his exile, condemned by men he knew) rather
  than a Mandela one.
- **Out of scope:** the marketing site. The owner wants him removed there
  later, separately.

## T11 — Citation enforcement

- [ ] `pending-T11`
- **Commit:** `feat(server): make the model name the corpus entry it used`
- **Depends on:** T06
- **Touches:** `apps/server/src/routes/ai.ts`, `mastra/template.ts`
- **Done when:** the model returns which `Moment` id it drew on; a reply
  making a first-person historical claim while citing nothing is rejected
  and retried once (D-012).
- **Watch:** this interacts with streaming. Structured output and a token
  stream do not compose for free — decide whether to validate post-stream
  and regenerate, or to buffer the first sentence. Record the choice.

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
