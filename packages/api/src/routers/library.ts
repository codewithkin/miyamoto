import db from "@miyamoto/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

async function entitlement(userId: string) {
  const [sub, progress] = await Promise.all([
    db.subscription.findUnique({ where: { userId }, select: { entitlementActive: true } }),
    db.pathProgress.findUnique({ where: { userId }, select: { currentDay: true } }),
  ]);
  return {
    isPro: sub?.entitlementActive ?? false,
    currentDay: progress?.currentDay ?? 1,
  };
}

/**
 * The Adversity Library and the Masters roster.
 *
 * Locked content is returned with its copy withheld rather than omitted —
 * the user should see what they have not earned, because that is the whole
 * mechanic. Only `story`, `lesson` and `action` are stripped.
 */
export const libraryRouter = router({
  categories: protectedProcedure.query(async ({ ctx }) => {
    const { isPro } = await entitlement(ctx.session.user.id);

    const categories = await db.adversityCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        stories: {
          orderBy: { sortOrder: "asc" },
          include: { master: { select: { slug: true, name: true } } },
        },
      },
    });

    return categories.map((c) => ({
      ...c,
      stories: c.stories.map((s) => ({
        id: s.id,
        slug: s.slug,
        title: s.title,
        readSeconds: s.readSeconds,
        master: s.master,
        locked: s.proOnly && !isPro,
      })),
    }));
  }),

  mostSearched: protectedProcedure.query(async ({ ctx }) => {
    const { isPro } = await entitlement(ctx.session.user.id);
    const stories = await db.adversityStory.findMany({
      orderBy: { searchCount: "desc" },
      take: 5,
      include: { master: { select: { slug: true, name: true } } },
    });
    return stories.map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      readSeconds: s.readSeconds,
      master: s.master,
      locked: s.proOnly && !isPro,
    }));
  }),

  story: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const { isPro } = await entitlement(ctx.session.user.id);
      const story = await db.adversityStory.findUnique({
        where: { slug: input.slug },
        include: {
          master: true,
          category: { select: { name: true, slug: true } },
        },
      });
      if (!story) throw new TRPCError({ code: "NOT_FOUND" });

      if (story.proOnly && !isPro) {
        // Withhold the body, not the existence of it.
        return { ...story, story: null, lesson: null, action: null, locked: true as const };
      }

      await db.adversityStory.update({
        where: { id: story.id },
        data: { searchCount: { increment: 1 } },
      });

      return { ...story, locked: false as const };
    }),

  /** The five Masters, with what the user has earned. */
  masters: protectedProcedure.query(async ({ ctx }) => {
    const { isPro, currentDay } = await entitlement(ctx.session.user.id);
    const masters = await db.master.findMany({ orderBy: { sortOrder: "asc" } });

    return masters.map((m) => {
      const unlockedByDay = m.unlockDay === null || currentDay >= m.unlockDay;
      const available = isPro || (unlockedByDay && !m.proOnly);
      return {
        ...m,
        available,
        lockReason: available ? null : m.proOnly ? ("PRO" as const) : ("DAY" as const),
      };
    });
  }),
});
