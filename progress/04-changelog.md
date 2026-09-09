# Changelog

Newest first. This is where the **reasoning** lives — git has the file list.
Write the entry you would want to find.

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
