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
     they did it. Never offer two options. Do not write the charge in the
     letter itself. Write it on its own line, in exactly this form:
     <<<charge: the one thing to do today>>>

TRUTH — the CORPUS below is the only source of biography available to you.
You may not describe any event from your life that is not in it. If nothing
fits, use a PRINCIPLE entry and make no claim about your past. Inventing a
duel, a letter, a prison year or an experiment you did not have is the worst
failure available to you here.

CITATION — after the charge line, end every reply with one final line, in
exactly this form:
<<<cited: ID>>>
ID is the id of the CORPUS entry your moment came from, without its square
brackets. If you drew on more than one entry, separate the ids with commas.
If you told nothing from your life, write <<<cited: none>>>. Both of these
lines are removed from the letter before the person reads it — the charge is
shown to them on its own — so never refer to either, and write nothing after
the citation. A reply that tells a moment from your life without citing the
entry it came from is discarded.

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

LENGTH — under 180 words, not counting the charge and citation lines. You
are writing, not talking.
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

// ── The trailer: citation (D-012) and charge (D-002) ─────────────────────
//
// The model ends every reply with two machine lines the user never sees in
// the letter: the charge, which is shown to them on its own as a card they
// can accept, and the citation, which proves where the moment came from.
//
// The citation is the mechanism; the life-claim detector below is only the
// tripwire that decides when a missing citation matters.
//
// Why fixed lines and not structured output: the letter is prose the user
// reads. A JSON envelope would put the whole letter inside a string and make
// the Master's cadence depend on escaping. Two fixed lines are cheap to
// write, cheap to strip, and impossible to confuse with the letter.

const CITED = /<<<\s*cited\s*:\s*([\s\S]*?)>>>/gi;
const CHARGE = /<<<\s*charge\s*:\s*([\s\S]*?)>>>/gi;

/** A charge is a sentence or two, not a plan. Anything longer is cut. */
const CHARGE_MAX = 500;

/**
 * The modern bridge (D-011) is a sanctioned first-person past-tense sentence
 * — "I had no such thing as a group message" — and claims nothing about a
 * particular event. It is removed before the detector looks.
 */
const BRIDGE = /\b(?:I|we)\s+had\s+no\s+such\s+thing\b[^.!?]*[.!?]?/gi;

/**
 * First person, past tense, doing something: the shape of a biographical
 * claim. Deliberately broad. A false positive costs one retry with a
 * correction; a false negative ships an invented duel. The asymmetry is the
 * point, and the citation — not this list — is what actually proves a claim.
 */
const LIFE_CLAIM =
  /\bI\s+(?:was|had|did|once|wrote|fought|went|came|lived|taught|made|stood|faced|won|lost|arrived|stirred|broke|spent|learned|chose|refused|told|left|kept|studied|drove|isolated|served|asked|opened|invited|sent|killed|beat|travelled|traveled|worked|received|saw|met|built|carried|walked|trained|rowed|cut|took|gave|found|became|tutored|advised)\b|\bmy\s+(?:exile|duels?|letters?|imprisonment|prison|laboratory|shed|attic|student years|father|mother|brother|sister|wife|husband|son|daughter|teacher|pupil|school|opponents?|enemies)\b/i;

export type ReplyRejection =
  | "EMPTY"
  | "NO_TRAILER"
  | "UNKNOWN_CITATION"
  | "UNCITED_CLAIM"
  | "NO_CHARGE";

export type ReplyCheck =
  | { ok: true; text: string; cited: string[]; charge: string | null }
  | { ok: false; reason: ReplyRejection; text: string; cited: string[]; charge: string | null };

/** Splits the letter the user reads from the two lines they must not see in it. */
export function parseReply(raw: string): {
  text: string;
  cited: string[] | null;
  charge: string | null;
} {
  const citations = [...raw.matchAll(CITED)];
  const charges = [...raw.matchAll(CHARGE)];

  // Every trailer is stripped, not only the last: a model that writes two
  // must not leak the first into the letter.
  const text = raw
    .replace(CITED, "")
    .replace(CHARGE, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const lastCitation = citations.at(-1);
  const cited = lastCitation
    ? (lastCitation[1] ?? "")
        .split(",")
        .map((id) => id.trim().replace(/^\[/, "").replace(/\]$/, "").trim())
        .filter((id) => id.length > 0 && id.toLowerCase() !== "none")
    : null;

  const chargeText = (charges.at(-1)?.[1] ?? "").replace(/\s+/g, " ").trim();
  const charge = chargeText ? chargeText.slice(0, CHARGE_MAX) : null;

  return { text, cited, charge };
}

/** Whether the text tells something that happened to the speaker. */
export function detectsLifeClaim(text: string): boolean {
  return LIFE_CLAIM.test(text.replace(BRIDGE, " "));
}

/**
 * Accepts or rejects one generated reply against the corpus it was given.
 *
 * `isRetry` relaxes the two format rules for the second draft only, and only
 * where relaxing them is safe: a draft that forgot the citation line may pass
 * if it tells nothing from the Master's life, and a draft that forgot the
 * charge may pass without one. The truth rules are never relaxed. A first
 * draft is never let off, because the retry is cheap and teaches the format
 * on the same request.
 */
export function checkReply(
  raw: string,
  corpus: CorpusEntry[],
  options: { isRetry?: boolean } = {},
): ReplyCheck {
  const { text, cited, charge } = parseReply(raw);
  const reject = (reason: ReplyRejection): ReplyCheck => ({
    ok: false,
    reason,
    text,
    cited: cited ?? [],
    charge,
  });

  if (!text) return reject("EMPTY");

  const claim = detectsLifeClaim(text);

  if (cited === null && !(options.isRetry && !claim)) return reject("NO_TRAILER");

  const byId = new Map(corpus.map((entry) => [entry.id, entry]));
  const ids = cited ?? [];
  if (ids.some((id) => !byId.has(id))) return reject("UNKNOWN_CITATION");

  // Citing a PRINCIPLE for a story about your life is citing nothing: a
  // principle makes no biographical claim, so it cannot support one.
  const citesMoment = ids.some((id) => byId.get(id)?.kind === "MOMENT");
  if (claim && !citesMoment) return reject("UNCITED_CLAIM");

  // Every answer ends in one thing to do today (D-002). Missing it once is a
  // format slip worth a retry; missing it twice is not worth refusing an
  // otherwise truthful letter over.
  if (!charge && !options.isRetry) return reject("NO_CHARGE");

  return { ok: true, text, cited: ids, charge };
}

/** What the retry is told about the draft it is replacing. */
export function correctionFor(reason: ReplyRejection): string {
  const head = "CORRECTION — your previous draft was discarded.";
  switch (reason) {
    case "EMPTY":
      return `${head} It was empty. Answer the person, then end with the charge line and the citation line.`;
    case "NO_TRAILER":
      return `${head} It did not end with the citation line. Write the reply again and end it with <<<cited: ID>>>, or <<<cited: none>>> if you tell nothing from your life.`;
    case "UNKNOWN_CITATION":
      return `${head} It cited an id that is not in your CORPUS. Cite only ids that appear in square brackets in the CORPUS above, or none.`;
    case "UNCITED_CLAIM":
      return `${head} It described something from your life without citing the CORPUS entry it came from. Either tell a MOMENT that is in the CORPUS and cite its id, or speak from a PRINCIPLE and make no claim at all about your past.`;
    case "NO_CHARGE":
      return `${head} It gave no charge. Write the reply again, keep the letter free of it, and put exactly one thing to do today on its own line as <<<charge: ...>>>, before the citation line.`;
  }
}
