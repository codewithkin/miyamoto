import db from "@miyamoto/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { localDate, msUntilLocalMidnight } from "../lib/day";
import { getUsage, grantBonusQuestion } from "../lib/usage";

/**
 * Chat metadata, gating and Charges.
 *
 * Message bodies never pass through here — those stream from the Hono /ai
 * route so tokens reach the device as they are produced. This router owns
 * everything around that: who may ask, which Master is writing, and what
 * they handed over at the end.
 */
export const chatRouter = router({
  /** The counter in the corner. Source of truth for whether asking is allowed. */
  usage: protectedProcedure.query(async ({ ctx }) => {
    const state = await getUsage(ctx.session.user.id);
    const profile = await db.profile.findUnique({
      where: { userId: ctx.session.user.id },
      select: { timezone: true },
    });
    return {
      ...state,
      msUntilReset: msUntilLocalMidnight(profile?.timezone ?? "UTC"),
    };
  }),

  /** Watching an ad buys exactly one more question today. */
  grantBonus: protectedProcedure.mutation(({ ctx }) =>
    grantBonusQuestion(ctx.session.user.id),
  ),

  threads: protectedProcedure.query(({ ctx }) =>
    db.thread.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { lastMessageAt: "desc" },
      take: 50,
      include: { master: { select: { slug: true, name: true, title: true, accentColor: true } } },
    }),
  ),

  createThread: protectedProcedure
    .input(
      z.object({
        masterSlug: z.string().min(1),
        title: z.string().max(120).optional(),
        /** Set when the thread was opened from a library story. */
        originStoryId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // A withdrawn Master (D-006) is indistinguishable from no Master here,
      // so a stale client holding the slug cannot open a thread with him.
      const master = await db.master.findFirst({
        where: { slug: input.masterSlug, active: true },
      });
      if (!master) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No such Master" });
      }

      // Mastra's thread id is ours to choose; keeping them equal means one
      // less lookup on every message.
      const mastraThreadId = crypto.randomUUID();

      return db.thread.create({
        data: {
          userId: ctx.session.user.id,
          mastraThreadId,
          masterId: master.id,
          title: input.title,
          originStoryId: input.originStoryId,
        },
        include: { master: true },
      });
    }),

  /**
   * Change who is writing. The thread and its history stay exactly where
   * they are — only the hand changes, and the new Master reads everything
   * that came before.
   */
  switchMaster: protectedProcedure
    .input(z.object({ threadId: z.string(), masterSlug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [thread, master] = await Promise.all([
        db.thread.findFirst({
          where: { id: input.threadId, userId: ctx.session.user.id },
        }),
        db.master.findFirst({ where: { slug: input.masterSlug, active: true } }),
      ]);

      if (!thread) throw new TRPCError({ code: "NOT_FOUND", message: "No such thread" });
      if (!master) throw new TRPCError({ code: "NOT_FOUND", message: "No such Master" });

      // A Master you have not earned cannot be switched to, or the Path's
      // unlocks would mean nothing.
      const progress = await db.pathProgress.findUnique({
        where: { userId: ctx.session.user.id },
        select: { currentDay: true },
      });
      const sub = await db.subscription.findUnique({
        where: { userId: ctx.session.user.id },
        select: { entitlementActive: true },
      });
      const isPro = sub?.entitlementActive ?? false;

      if (!isPro) {
        if (master.proOnly) {
          throw new TRPCError({ code: "FORBIDDEN", message: "PRO_REQUIRED" });
        }
        if (master.unlockDay && (progress?.currentDay ?? 1) < master.unlockDay) {
          throw new TRPCError({ code: "FORBIDDEN", message: "LOCKED_UNTIL_DAY" });
        }
      }

      return db.thread.update({
        where: { id: thread.id },
        data: { masterId: master.id },
        include: { master: true },
      });
    }),

  /** Charges due today, for the home screen and the chat footer. */
  charges: protectedProcedure.query(async ({ ctx }) => {
    const profile = await db.profile.findUnique({
      where: { userId: ctx.session.user.id },
      select: { timezone: true },
    });
    return db.charge.findMany({
      where: {
        userId: ctx.session.user.id,
        dueOn: localDate(profile?.timezone ?? "UTC"),
      },
      orderBy: { createdAt: "desc" },
      include: { master: { select: { slug: true, name: true } } },
    });
  }),

  respondToCharge: protectedProcedure
    .input(
      z.object({
        chargeId: z.string(),
        status: z.enum(["ACCEPTED", "DECLINED", "COMPLETED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const charge = await db.charge.findFirst({
        where: { id: input.chargeId, userId: ctx.session.user.id },
      });
      if (!charge) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await db.charge.update({
        where: { id: charge.id },
        data: {
          status: input.status,
          completedAt: input.status === "COMPLETED" ? new Date() : null,
        },
      });

      // A Charge adds to the Bushido score but never to the streak — the
      // streak belongs to the Path, so it cannot be farmed from chat.
      if (input.status === "COMPLETED" && charge.status !== "COMPLETED") {
        await db.pathProgress.updateMany({
          where: { userId: ctx.session.user.id },
          data: { bushidoScore: { increment: charge.points } },
        });
      }

      return updated;
    }),
});
