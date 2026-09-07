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

async function seedMasters() {
  for (const m of MASTERS) {
    const master = await db.master.upsert({
      where: { slug: m.slug },
      create: {
        slug: m.slug,
        name: m.name,
        title: m.title,
        tone: m.tone,
        manner: m.manner,
        era: m.era,
        domains: m.domains,
        accentColor: m.accentColor,
        unlockDay: m.unlockDay,
        proOnly: m.proOnly,
        sortOrder: m.sortOrder,
      },
      update: {
        name: m.name,
        title: m.title,
        tone: m.tone,
        manner: m.manner,
        era: m.era,
        domains: m.domains,
        accentColor: m.accentColor,
        unlockDay: m.unlockDay,
        proOnly: m.proOnly,
        sortOrder: m.sortOrder,
      },
    });

    // Moments have no natural key of their own, so they are keyed by
    // (master, title) — replace the set rather than accumulating duplicates.
    await db.moment.deleteMany({ where: { masterId: master.id } });
    await db.moment.createMany({
      data: m.moments.map((mo) => ({
        masterId: master.id,
        title: mo.title,
        body: mo.body,
        lesson: mo.lesson,
        themes: mo.themes,
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
