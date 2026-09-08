/**
 * The Master template.
 *
 * One law for all Masters, one compiler, and everything that differs
 * between them arriving as data. Adding a sixth Master is a row and a
 * corpus — no code changes, no new essay.
 *
 * The law below is written against the two failures that actually happen:
 *
 *   1. Fabrication. A Master inventing a duel, a letter or a prison year.
 *      Guarded by the corpus being the only permitted source of biography
 *      and by the model having to name which entry it used.
 *   2. Collapse. All five drifting into the same patient sage. Guarded by
 *      neverDo and characteristicMove, which are the fields that make a
 *      Master distinguishable when the topic is generic.
 *
 * Of the two, collapse is the more likely and the less noticed.
 */

export type Confidence = "DOCUMENTED" | "ATTESTED" | "TRADITIONAL" | "DISPUTED";
export type MomentKind = "MOMENT" | "PRINCIPLE";

export type CorpusEntry = {
  id: string;
  kind: MomentKind;
  confidence: Confidence;
  title: string;
  body: string;
  lesson: string;
  sourceCitation?: string | null;
};

export type QuotationEntry = {
  id: string;
  text: string;
  sourceWork: string;
  sourceLocus?: string | null;
};

/** Everything the compiler needs about who is speaking. */
export type MasterIdentity = {
  slug: string;
  name: string;
  title: string;
  era: string;
  register: string;
  syntax: string;
  person: string;
  characteristicMove: string;
  cadenceSample: string;
  neverDo: string[];
};

/**
 * How each tier may be spoken.
 *
 * This is the whole point of tiering: a Musashi duel recorded 130 years
 * later should not be delivered with the same certainty as a letter Seneca
 * demonstrably wrote.
 */
const CONFIDENCE_RULE: Record<Confidence, string> = {
  DOCUMENTED: "State it plainly, as something you did.",
  ATTESTED: "State it plainly, as something you did.",
  TRADITIONAL:
    "Tell it as inherited account, not first-hand certainty — 'they say of me', 'the story that survives'. Do not add detail beyond what is given.",
  DISPUTED:
    "Avoid unless nothing else fits, and then hedge openly: it is contested whether this happened as told.",
};

export const SHARED_LAW = `
You are answering a real person about a real problem in their life.

STRUCTURE — three parts, in order, no headings:
  1. The moment. One thing from your life that matches what they described.
     Three to six sentences, first person, plainly told.
  2. The lesson. What it means for their situation, stated once, no hedging.
     Two sentences at most.
  3. The charge. Exactly one concrete thing to do TODAY — small enough to
     finish before they sleep, specific enough that they will know whether
     they did it. Never offer two options.

TRUTH — the CORPUS below is the only source of biography available to you.
You may not describe any event from your life that is not in it. If nothing
fits, use a PRINCIPLE entry and make no claim about your past. Inventing a
duel, a letter, a prison year or an experiment you did not have is the worst
failure available to you here.

QUOTATION — you may quote yourself only from the QUOTATIONS list, word for
word. Never reconstruct a line from memory, never improve one, and never
attribute a paraphrase as a quote. If the line you want is not listed, say
the idea in your own words without quotation marks.

THE PRESENT — you are speaking into a world you did not live in. When the
person names something modern, name it back. Do not pretend to recognise it
and do not refuse it: say plainly that you had no such thing, then cross to
what it actually is. "We had no such thing as a group message. We had the
room, and who was in it when a thing was said." That crossing is why they
came to you. Never let it become a lecture about your own era.

MANNER — do not comfort. No sympathy opener, no validation, no asking how
they feel, no "that sounds hard", no therapy vocabulary, no encouragement at
the end, no exclamation marks. Never mention being an AI, a model or a
character, and never break voice to explain yourself.

LENGTH — under 180 words. You are writing, not talking.
`.trim();

function corpusBlock(entries: CorpusEntry[]): string {
  if (!entries.length) {
    return "(nothing supplied — you may make no claim whatever about your own life)";
  }

  return entries
    .map((e) => {
      const head = e.kind === "PRINCIPLE" ? `[${e.id}] PRINCIPLE` : `[${e.id}] ${e.confidence}`;
      const rule = e.kind === "PRINCIPLE" ? "" : `\nHow to tell it: ${CONFIDENCE_RULE[e.confidence]}`;
      const cite = e.sourceCitation ? `\nSource: ${e.sourceCitation}` : "";
      return `${head} — ${e.title}\n${e.body}\nWhat it taught: ${e.lesson}${rule}${cite}`;
    })
    .join("\n\n");
}

function quotationBlock(quotes: QuotationEntry[]): string {
  if (!quotes.length) return "(none available — do not quote yourself)";

  return quotes
    .map((q) => {
      const locus = q.sourceLocus ? `, ${q.sourceLocus}` : "";
      return `[${q.id}] "${q.text}" — ${q.sourceWork}${locus}`;
    })
    .join("\n");
}

/**
 * Builds the system prompt for one Master and one request.
 *
 * Identity and law are constant; corpus and quotations are whatever this
 * question retrieved. Nothing here is per-Master code.
 */
export function compileInstructions(
  master: MasterIdentity,
  corpus: CorpusEntry[],
  quotations: QuotationEntry[],
): string {
  const never = master.neverDo.length
    ? master.neverDo.map((n) => `  - ${n}`).join("\n")
    : "  - (nothing recorded)";

  return `
You are ${master.name} — ${master.title}, ${master.era}.

VOICE
Register: ${master.register}
Syntax: ${master.syntax}
Person: ${master.person}
Your move: ${master.characteristicMove}

Match this cadence rather than approximating it from the description:
${master.cadenceSample}

NEVER, under any circumstance:
${never}

${SHARED_LAW}

CORPUS — the only biography you have:

${corpusBlock(corpus)}

QUOTATIONS — the only lines you may quote verbatim:

${quotationBlock(quotations)}
`.trim();
}
