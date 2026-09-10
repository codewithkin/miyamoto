import db from "@miyamoto/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { localDate, msUntilLocalMidnight, streakState } from "../lib/day";

/** Resolves the user's timezone once per call. */
async function tz(userId: string) {
  const p = await db.profile.findUnique({ where: { userId }, select: { timezone: true } });
  return p?.timezone ?? "UTC";
}

/**
 * The Bushido Path.
 *
 * Streak arithmetic lives here rather than on the device, because the
 * device's clock is the user's to change and a streak that can be edited is
 * not a streak.
 */
export const pathRouter = router({
  /** Everything the home screen needs in one round trip. */
  today: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const timezone = await tz(userId);
    const today = localDate(timezone);

    const [progress, onboarding, profile] = await Promise.all([
      db.pathProgress.findUnique({ where: { userId } }),
      db.onboardingProfile.findUnique({
        where: { userId },
        include: { firstMaster: { select: { slug: true, name: true, title: true } } },
      }),
      db.profile.findUnique({ where: { userId } }),
    ]);

    const currentDay = progress?.currentDay ?? 1;
    const pressure = onboarding?.pressure ?? "FIRM";

    const day = await db.pathDay.findUnique({
      where: { dayNumber: currentDay },
      include: { trials: { where: { pressure } } },
    });

    const completedToday = await db.trialCompletion.findFirst({
      where: { userId, completedOn: today },
      select: { id: true },
    });

    // streakCount is only reset by the next completion, so on its own it can
    // show a streak the user lost two days ago. The day arithmetic decides.
    const streakDay = streakState(progress?.lastCompletedOn ?? null, today);
    const streakAlive = streakDay === "extends" || streakDay === "already-done-today";

    return {
      day,
      trial: day?.trials[0] ?? null,
      pressure,
      // Who the onboarding quiz put in charge of this user. Null until the
      // draft is claimed, which the home screen reads as "not yet yours".
      master: onboarding?.firstMaster ?? null,
      currentDay,
      streak: streakAlive ? (progress?.streakCount ?? 0) : 0,
      // Done yesterday, not yet today: the only kind of day on which a streak
      // reminder may fire. Screen 10 promises "only on the day you'd break it".
      streakAtRisk: streakDay === "extends" && (progress?.streakCount ?? 0) > 0,
      longestStreak: progress?.longestStreak ?? 0,
      bushidoScore: progress?.bushidoScore ?? 0,
      completedToday: Boolean(completedToday),
      displayName: profile?.displayName ?? ctx.session.user.name,
      msUntilReset: msUntilLocalMidnight(timezone),
    };
  }),

  /** The four acts, with how far through each the user is. */
  acts: protectedProcedure.query(async ({ ctx }) => {
    const progress = await db.pathProgress.findUnique({
      where: { userId: ctx.session.user.id },
      select: { currentDay: true },
    });
    const currentDay = progress?.currentDay ?? 1;

    const days = await db.pathDay.findMany({ orderBy: { dayNumber: "asc" } });
    const acts = [
      { act: "FACE_IT", label: "Face it", from: 1, to: 7 },
      { act: "CONTROL_IT", label: "Control it", from: 8, to: 14 },
      { act: "ENDURE_IT", label: "Endure it", from: 15, to: 21 },
      { act: "BECOME_IT", label: "Become it", from: 22, to: 30 },
    ];

    return acts.map((a) => ({
      ...a,
      total: a.to - a.from + 1,
      done: Math.max(0, Math.min(a.to, currentDay - 1) - a.from + 1),
      active: currentDay >= a.from && currentDay <= a.to,
      days: days.filter((d) => d.dayNumber >= a.from && d.dayNumber <= a.to),
    }));
  }),

  /**
   * Mark today's trial complete.
   *
   * Advances the day, extends or resets the streak, and adds the trial's
   * points. Completing twice in a day is idempotent — it neither
   * double-counts nor double-advances.
   */
  completeTrial: protectedProcedure
    .input(z.object({ note: z.string().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const timezone = await tz(userId);
      const today = localDate(timezone);

      const [progress, onboarding] = await Promise.all([
        db.pathProgress.findUnique({ where: { userId } }),
        db.onboardingProfile.findUnique({ where: { userId } }),
      ]);

      const currentDay = progress?.currentDay ?? 1;
      const day = await db.pathDay.findUnique({
        where: { dayNumber: currentDay },
        include: { trials: { where: { pressure: onboarding?.pressure ?? "FIRM" } } },
      });
      if (!day) throw new TRPCError({ code: "NOT_FOUND", message: "No such day" });

      const existing = await db.trialCompletion.findUnique({
        where: { userId_pathDayId: { userId, pathDayId: day.id } },
      });
      if (existing) {
        return { alreadyDone: true, streak: progress?.streakCount ?? 0 };
      }

      const state = streakState(progress?.lastCompletedOn ?? null, today);
      const nextStreak =
        state === "extends" ? (progress?.streakCount ?? 0) + 1 : state === "broken" ? 1 : 1;
      const points = day.trials[0]?.points ?? 10;

      await db.$transaction([
        db.trialCompletion.create({
          data: { userId, pathDayId: day.id, completedOn: today, note: input.note },
        }),
        db.pathProgress.upsert({
          where: { userId },
          create: {
            userId,
            currentDay: Math.min(30, currentDay + 1),
            streakCount: 1,
            longestStreak: 1,
            bushidoScore: points,
            lastCompletedOn: today,
          },
          update: {
            currentDay: Math.min(30, currentDay + 1),
            streakCount: nextStreak,
            longestStreak: Math.max(progress?.longestStreak ?? 0, nextStreak),
            bushidoScore: { increment: points },
            lastCompletedOn: today,
            finishedAt: currentDay >= 30 ? new Date() : null,
          },
        }),
      ]);

      return { alreadyDone: false, streak: nextStreak, points };
    }),

  /** The Code, written on Day 29. */
  code: protectedProcedure.query(({ ctx }) =>
    db.personalCode.findUnique({ where: { userId: ctx.session.user.id } }),
  ),

  saveCode: protectedProcedure
    .input(z.object({ lines: z.array(z.string().min(1).max(200)).min(1).max(7) }))
    .mutation(({ ctx, input }) =>
      db.personalCode.upsert({
        where: { userId: ctx.session.user.id },
        create: { userId: ctx.session.user.id, lines: input.lines },
        update: { lines: input.lines },
      }),
    ),
});
