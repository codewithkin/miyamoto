import { createPrismaClient } from "../../src/index";
import { CATEGORIES } from "./adversity";
import { MASTERS } from "./masters";
import { PATH_DAYS, WOUNDS } from "./path";

/**
 * Seeds the authored corpus.
 *
 * Idempotent — every write is an upsert keyed on a slug or natural key, so
 * this can be re-run after editing content without duplicating rows or
 * disturbing user data.
 */

const db = createPrismaClient();

/**
 * The check that catches collapse before a user does (D-013).
 *
 * Two Masters sharing a characteristicMove is the seam where they start
 * reading the same, and it is invisible in a diff of five prose blocks that
 * each look fine alone. Nothing else in the pipeline would complain: the
 * schema allows it, the compiler renders it, and the model obeys it.
 *
 * neverDo is checked here for the same reason — it is the other field the
 * Masters doc says to strengthen first, and an empty one compiles.
 */
function assertDistinctMoves() {
  const seen = new Map<string, string>();
  const problems: string[] = [];

  for (const m of MASTERS) {
    const key = m.characteristicMove.trim().toLowerCase();
    const owner = seen.get(key);
    if (owner) problems.push(`${m.slug} shares a characteristicMove with ${owner}`);
    seen.set(key, m.slug);

    if (m.neverDo.length < 3) {
      problems.push(`${m.slug} has ${m.neverDo.length} neverDo entries; three is the floor`);
    }

    // The principle floor (D-009). Retrieval will carry a principle if one
    // exists; if none does, an unmatched question hands the Master an empty
    // corpus, which is the state in which models invent. One is enough for
    // retrieval and not enough for a corpus — a Master with a single
    // principle answers every unmatched question identically.
    const principles = m.moments.filter((mo) => mo.kind === "PRINCIPLE").length;
    if (principles < 2) {
      problems.push(`${m.slug} has ${principles} PRINCIPLE entries; two is the floor`);
    }
  }

  if (problems.length) {
    throw new Error(`Master voices have collapsed (D-013):\n  ${problems.join("\n  ")}`);
  }
}

/**
 * Every biographical claim is tiered and cites a work (D-007, D-008).
 *
 * The defaults in the seed writer are the reason this has to exist: an
 * entry with no confidence silently becomes ATTESTED, which is the tier
 * that lets a Master state a thing as plain fact. A legend that forgot its
 * tier would therefore be spoken with more certainty than a letter Seneca
 * demonstrably wrote — the exact failure D-008 was written against, arriving
 * by omission rather than by decision.
 */
function assertCorpusIsAttested() {
  const problems: string[] = [];

  for (const m of MASTERS) {
    for (const mo of m.moments) {
      if ((mo.kind ?? "MOMENT") !== "MOMENT") continue;
      if (!mo.confidence) problems.push(`${m.slug} / "${mo.title}" has no confidence tier`);
      if (!mo.sourceCitation) problems.push(`${m.slug} / "${mo.title}" cites no work`);
    }
  }

  if (problems.length) {
    throw new Error(`Corpus makes unattested claims (D-008):\n  ${problems.join("\n  ")}`);
  }
}

async function seedMasters() {
  assertDistinctMoves();
  assertCorpusIsAttested();

  for (const m of MASTERS) {
    // Voice fields and the corpus are the whole Master; there is no
    // per-Master code left to fall back on, so create and update must carry
    // the identical set or a re-seed would silently leave a stale voice.
    const fields = {
      name: m.name,
      title: m.title,
      tone: m.tone,
      manner: m.manner,
      era: m.era,
      domains: m.domains,
      accentColor: m.accentColor,
      register: m.register,
      syntax: m.syntax,
      person: m.person,
      characteristicMove: m.characteristicMove,
      cadenceSample: m.cadenceSample,
      neverDo: m.neverDo,
      rightsNote: m.rightsNote ?? null,
      unlockDay: m.unlockDay,
      proOnly: m.proOnly,
      sortOrder: m.sortOrder,
    };

    const master = await db.master.upsert({
      where: { slug: m.slug },
      create: { slug: m.slug, ...fields },
      update: fields,
    });

    // Moments have no natural key of their own, so they are keyed by
    // (master, title) — replace the set rather than accumulating duplicates.
    await db.moment.deleteMany({ where: { masterId: master.id } });
    await db.moment.createMany({
      data: m.moments.map((mo) => ({
        masterId: master.id,
        kind: mo.kind ?? "MOMENT",
        // Inert on a PRINCIPLE, which claims nothing to attest. Retrieval
        // and the compiler both branch on kind before reading it.
        confidence: mo.confidence ?? "ATTESTED",
        title: mo.title,
        body: mo.body,
        lesson: mo.lesson,
        themes: mo.themes,
        sourceCitation: mo.sourceCitation ?? null,
        sourceNote: mo.sourceNote,
        weight: mo.weight ?? 0,
      })),
    });
  }
  const [masters, moments] = await Promise.all([db.master.count(), db.moment.count()]);
  console.log(`  masters: ${masters}, moments: ${moments}`);
}

async function seedAdversity() {
  for (const c of CATEGORIES) {
    const category = await db.adversityCategory.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, name: c.name, sortOrder: c.sortOrder },
      update: { name: c.name, sortOrder: c.sortOrder },
    });

    for (const [i, s] of c.stories.entries()) {
      const master = await db.master.findUnique({ where: { slug: s.masterSlug } });
      if (!master) throw new Error(`Story ${s.slug} names unknown master ${s.masterSlug}`);

      await db.adversityStory.upsert({
        where: { slug: s.slug },
        create: {
          slug: s.slug,
          categoryId: category.id,
          masterId: master.id,
          title: s.title,
          story: s.story,
          lesson: s.lesson,
          action: s.action,
          proOnly: s.proOnly,
          searchCount: s.searchCount,
          sortOrder: i,
        },
        update: {
          categoryId: category.id,
          masterId: master.id,
          title: s.title,
          story: s.story,
          lesson: s.lesson,
          action: s.action,
          proOnly: s.proOnly,
          searchCount: s.searchCount,
          sortOrder: i,
        },
      });
    }
  }
  const [cats, stories] = await Promise.all([
    db.adversityCategory.count(),
    db.adversityStory.count(),
  ]);
  console.log(`  categories: ${cats}, stories: ${stories}`);
}

async function seedPath() {
  for (const d of PATH_DAYS) {
    const day = await db.pathDay.upsert({
      where: { dayNumber: d.day },
      create: { dayNumber: d.day, act: d.act, title: d.title, brief: d.brief },
      update: { act: d.act, title: d.title, brief: d.brief },
    });

    const variants = [
      { pressure: "GENTLE" as const, body: d.gentle, points: 8 },
      { pressure: "FIRM" as const, body: d.firm, points: 10 },
      { pressure: "UNBREAKABLE" as const, body: d.unbreakable, points: 14 },
    ];

    for (const v of variants) {
      await db.pathTrial.upsert({
        where: { pathDayId_pressure: { pathDayId: day.id, pressure: v.pressure } },
        create: { pathDayId: day.id, pressure: v.pressure, body: v.body, points: v.points },
        update: { body: v.body, points: v.points },
      });
    }
  }
  const [days, trials] = await Promise.all([db.pathDay.count(), db.pathTrial.count()]);
  console.log(`  path days: ${days}, trials: ${trials}`);
}

async function seedWounds() {
  for (const w of WOUNDS) {
    await db.wound.upsert({
      where: { slug: w.slug },
      create: { slug: w.slug, label: w.label, themes: w.themes, sortOrder: w.sortOrder },
      update: { label: w.label, themes: w.themes, sortOrder: w.sortOrder },
    });
  }
  console.log(`  wounds: ${await db.wound.count()}`);
}

async function main() {
  console.log("Seeding Miyamoto…");
  await seedMasters();
  await seedAdversity();
  await seedPath();
  await seedWounds();
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void db.$disconnect());
