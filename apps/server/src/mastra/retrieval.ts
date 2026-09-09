import db from "@miyamoto/db";

import type { Confidence, CorpusEntry, MasterIdentity, QuotationEntry } from "./template";

/**
 * Corpus retrieval.
 *
 * Scoring is lexical overlap between the question and an entry's themes,
 * adjusted by how well attested the entry is. Two rules shape it:
 *
 *   - A PRINCIPLE entry is always eligible, at a low floor score. That
 *     guarantees a Master always has something real to stand on, which is
 *     the whole reason PRINCIPLE exists: an unanchored Master is the state
 *     where models invent.
 *   - Confidence biases selection. Given two entries that match equally,
 *     the better-attested one wins, and a DISPUTED entry has to out-match
 *     everything else by a distance before it is offered at all.
 */

const CONFIDENCE_BIAS: Record<Confidence, number> = {
  DOCUMENTED: 6,
  ATTESTED: 4,
  TRADITIONAL: 1,
  DISPUTED: -8,
};

/** Words worth matching on. */
function tokenise(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((w) => w.length > 3),
  );
}

function themeScore(themes: string[], words: Set<string>): number {
  return themes.reduce(
    (n, theme) => n + (theme.split("-").some((part) => words.has(part)) ? 1 : 0),
    0,
  );
}

export type RetrievedContext = {
  master: MasterIdentity;
  corpus: CorpusEntry[];
  quotations: QuotationEntry[];
};

/**
 * Everything needed to compile one Master's prompt for one question.
 *
 * Returns null when the Master is unknown or withdrawn — callers must treat
 * that as a refusal rather than falling back to a generic voice.
 */
export async function retrieveContext(
  masterSlug: string,
  question: string,
  limit = 4,
): Promise<RetrievedContext | null> {
  const master = await db.master.findFirst({
    where: { slug: masterSlug, active: true },
  });
  if (!master) return null;

  const words = tokenise(question);

  const [entries, quotes] = await Promise.all([
    db.moment.findMany({ where: { masterId: master.id } }),
    db.quotation.findMany({ where: { masterId: master.id } }),
  ]);

  const scored = entries
    .map((e) => {
      const hits = themeScore(e.themes, words);
      const bias = e.kind === "PRINCIPLE" ? 0 : CONFIDENCE_BIAS[e.confidence as Confidence];
      // Principles sit at a low floor so they are always available without
      // crowding out a moment that actually matches.
      const base = e.kind === "PRINCIPLE" ? 1 : 0;
      return { e, hits, score: base + hits * 10 + bias + e.weight };
    })
    .sort((a, b) => b.score - a.score);

  // D-008 asks that a DISPUTED entry out-match everything else before it is
  // offered at all. The -8 bias alone does not deliver that: it only changes
  // the order, and a Master with no more entries than `limit` has every
  // entry returned regardless of score. Sun Tzu has four and the limit is
  // four, so his one contested claim came back for a question made of
  // nonsense words. Eligibility has to be a filter, not a ranking.
  const bestOther = Math.max(
    0,
    ...scored.filter(({ e }) => e.confidence !== "DISPUTED").map(({ score }) => score),
  );
  const eligible = scored.filter(({ e, hits, score }) => {
    if (e.kind === "PRINCIPLE" || e.confidence !== "DISPUTED") return true;
    return hits > 0 && score >= bestOther;
  });

  const picked = eligible.slice(0, limit).map(({ e }) => e);

  // Always carry at least one principle, even if nothing matched — the
  // Master must never be handed an empty corpus.
  if (!picked.some((e) => e.kind === "PRINCIPLE")) {
    const principle = eligible.find(({ e }) => e.kind === "PRINCIPLE");
    if (principle) picked.push(principle.e);
  }

  const relevantQuotes = quotes
    .map((q) => ({ q, score: themeScore(q.themes, words) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ q }) => q);

  return {
    master: {
      slug: master.slug,
      name: master.name,
      title: master.title,
      era: master.era,
      register: master.register,
      syntax: master.syntax,
      person: master.person,
      characteristicMove: master.characteristicMove,
      cadenceSample: master.cadenceSample,
      neverDo: master.neverDo,
    },
    corpus: picked.map((e) => ({
      id: e.id,
      kind: e.kind as CorpusEntry["kind"],
      confidence: e.confidence as Confidence,
      title: e.title,
      body: e.body,
      lesson: e.lesson,
      sourceCitation: e.sourceCitation,
    })),
    quotations: relevantQuotes.map((q) => ({
      id: q.id,
      text: q.text,
      sourceWork: q.sourceWork,
      sourceLocus: q.sourceLocus,
    })),
  };
}
