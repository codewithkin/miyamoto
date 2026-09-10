# The Master system

How a historical figure becomes something an agent can add without writing
an essay, and what stops the model inventing their life.

Read this before touching anything under `apps/server/src/mastra/`.

---

## The governing idea

**A Master is data. The law is shared code. The model only renders.**

If a Master's identity cannot be expressed as a row plus a corpus, the
template has failed and adding the sixth will mean writing another essay.

| Layer | Where | Changes per Master? |
|---|---|---|
| The law — structure, truth, manner, the present | `mastra/template.ts` `SHARED_LAW` | No |
| Identity — voice fields, `neverDo` | `master` row | Yes, as data |
| Corpus — moments and principles | `moment` rows | Yes, as data |
| Quotations | `quotation` rows | Yes, as data |
| Model | `mastra/masters.ts` | Only if one needs a stronger model |

---

## Adding a Master

1. Write the `master` row: `register`, `syntax`, `person`,
   `characteristicMove`, `cadenceSample`, `neverDo`, `rightsNote`.
2. Write 4–8 `MOMENT` entries with a real `sourceCitation` and an honest
   `confidence`.
3. Write 2–3 `PRINCIPLE` entries — positions they held, no biographical
   claim. **Not optional** (D-009).
4. Write any `quotation` rows, verbatim, with work and locus.
5. Seed. There is no step 6; no code changes.

The seed refuses before it writes a row if you skip any of that: a
`characteristicMove` another Master already has, fewer than three `neverDo`,
fewer than two `PRINCIPLE` entries, fewer than two quotations, or a `MOMENT`
with no confidence or no citation. Those are `assertDistinctMoves` and
`assertCorpusIsAttested` in `packages/db/prisma/seed/index.ts`. Fix the
corpus, never the assertion — the second one exists because the seed writer
defaults a missing confidence to `ATTESTED`, so an untiered legend would be
spoken with more certainty than a letter Seneca demonstrably wrote.

### The fields, and what each is actually for

**`register`** — the emotional temperature. *"cold, declarative,
contemptuous of excuses but never of the person"*.

**`syntax`** — mechanics, concretely. *"Subject, verb, object. Rarely over
twelve words. No subordinate clauses."* Vague syntax is why Masters blur.

**`characteristicMove`** — the one thing they always do to a problem. This
is the highest-value field. Musashi relocates you on the ground; Seneca
separates what is in your control from what you imagined; Curie treats you
as a failed experiment with a setup problem. If two Masters have the same
move, one of them is redundant.

**`cadenceSample`** — real cadence to match rather than approximate from a
description. A model imitating a sample beats a model interpreting an
adjective.

**`neverDo`** — the negative space, and the guardrail against the failure
that actually happens (D-013). Musashi never reaching for Zen enlightenment
— he was pointedly irreligious in the *Dokkōdō*. Curie never dramatising her
own hardship. Write these as prohibitions a reader could check.

---

## The three guardrails

### 1. Fabrication — the corpus is the only biography (D-007)

Anything a Master claims about their own life that is not a `Moment` row is
a fabrication. The prompt says so; retrieval supplies the entries; the model
must cite which one it used (D-012).

This is enforced, not requested (session 3). Every reply ends with
`<<<charge: …>>>` and `<<<cited: ID>>>`. The server strips both, rejects a
reply that tells a life event without citing a `MOMENT` it was actually
given, retries once with a correction, and refuses — refunding the question —
if the retry fails too (D-030, D-031, D-032). The life-claim detector in
`checkReply` is only a tripwire; the citation is the proof.

### 2. Confidence — not all Masters are equally documented (D-008)

| Tier | Means | How it may be spoken |
|---|---|---|
| `DOCUMENTED` | Primary source, usually their own writing | Plainly |
| `ATTESTED` | Contemporary or near-contemporary record | Plainly |
| `TRADITIONAL` | Later or hagiographic account | *"the story that survives"* — never first-hand certainty |
| `DISPUTED` | Contested by historians | Hedged, and retrieved last |

Retrieval biases on this, so given two equal matches the better-attested
wins, and `DISPUTED` must out-match everything else by a distance.

**Be honest when writing the seed.** Musashi's duels are mostly `TRADITIONAL`
— the *Nitenki* is hagiography written long after. Seneca's letters are
`DOCUMENTED`. Marking a legend `ATTESTED` because it makes a better answer
is the exact failure this system exists to prevent.

### 3. The empty corpus — `PRINCIPLE` entries (D-009)

An unanchored Master is when a model invents. So retrieval always carries at
least one principle, and "nothing matched" is unreachable rather than
discouraged.

---

## The modern bridge (D-011)

This is not a guardrail. **It is the product.**

The user asks Musashi about a Slack thread. He does not say he doesn't know
what Slack is, and he does not pretend to have used one. He names it, says
plainly he had no such thing, and crosses to what it actually is:

> *"We had no such thing as a group message. We had the room, and who was in
> it when a thing was said."*

The adjacent failure is the crossing turning into a lecture about his own
era. Forbidden in the same rule.

---

## What to check when a Master reads wrong

| Symptom | Likely cause | Fix |
|---|---|---|
| Reaches for a contested claim unprompted | Eligibility regressed to ranking | `DISPUTED` is filtered, not merely biased — see the note in `retrieval.ts` |
| Replies refused, users told "Ask again" | The model skips the trailer, or keeps telling events it was not given | `[ai] … rejected (REASON)` in the server log names why. Fix the corpus or `correctionFor`; never loosen `checkReply` |
| Sounds like every other Master | `characteristicMove` too vague, or `neverDo` too short | Sharpen the move; add prohibitions |
| Too gentle | `SHARED_LAW` manner clause losing to a soft `register` | Cool the register |
| Claims something not in the corpus | Retrieval returned nothing and the model improvised | Add a `PRINCIPLE`; check the citation rejection is firing |
| Quotes something almost right | Quoting from memory | The line must be a `quotation` row, or not quoted |
| Answers a modern thing stiffly | Bridge rule not landing | Add a modern-bridge line to `cadenceSample` |

---

## Files

| Path | What |
|---|---|
| `apps/server/src/mastra/template.ts` | The law and the compiler |
| `apps/server/src/mastra/retrieval.ts` | Scoring, confidence bias, the principle floor |
| `apps/server/src/mastra/masters.ts` | Model per Master — the only per-Master code |
| `apps/server/src/mastra/index.ts` | Agents, memory, the refuse-on-no-prompt default |
| `packages/db/prisma/schema/masters.prisma` | Master, Moment, Quotation |
| `packages/db/prisma/seed/masters.ts` | The corpus itself |
| `packages/db/prisma/seed/index.ts` | The seed-time checks that refuse a collapsed or unattested corpus |
