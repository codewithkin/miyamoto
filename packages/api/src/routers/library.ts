import db from "@miyamoto/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { isPro } from "../lib/usage";

async function entitlement(userId: string) {
  const [pro, progress] = await Promise.all([
    isPro(userId),
    db.pathProgress.findUnique({ where: { userId }, select: { currentDay: true } }),
  ]);
  return {
    isPro: pro,
    currentDay: progress?.currentDay ?? 1,
  };
}

/**
 * The Adversity Library and the Masters roster.
 *
 * Locked content is returned with its copy withheld rather than omitted —
 * the user should see what they have not earned, because that is the whole
 * mechanic. Only `story`, `lesson` and `action` are stripped.
 *
 * Withdrawn Masters are the opposite case, and are omitted entirely (D-006).
 * A locked row says "earn this"; a withdrawn one has nothing to earn.
 */

/** Every query that reaches a Master goes through this. */
const ACTIVE_MASTER = { master: { active: true } } as const;
export const libraryRouter = router({
  categories: protectedProcedure.query(async ({ ctx }) => {
    const { isPro } = await entitlement(ctx.session.user.id);

    const categories = await db.adversityCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        stories: {
          where: ACTIVE_MASTER,
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
      where: ACTIVE_MASTER,
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
      // A withdrawn Master's story is not found, not locked: a deep link
      // saved before the withdrawal must not resurface them.
      if (!story || !story.master.active) throw new TRPCError({ code: "NOT_FOUND" });

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

  /** The active Masters, with what the user has earned. */
  masters: protectedProcedure.query(async ({ ctx }) => {
    const { isPro, currentDay } = await entitlement(ctx.session.user.id);
    const masters = await db.master.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });

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
