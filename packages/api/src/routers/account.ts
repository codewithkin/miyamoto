import db from "@miyamoto/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { isExpoPushToken } from "../lib/push";
import { isPro } from "../lib/usage";

/**
 * Account management from inside the app.
 *
 * Google Play requires an in-app route to delete an account, not only a web
 * one. These procedures are authenticated, so unlike the web route there is
 * no emailed token: the session already proves who is asking, and adding a
 * round trip through email would only make the required path worse.
 */
export const accountRouter = router({
  /** Everything the settings screen shows about the account itself. */
  overview: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [profile, subscription, pro, onboarding, counts] = await Promise.all([
      db.profile.findUnique({ where: { userId } }),
      db.subscription.findUnique({ where: { userId } }),
      isPro(userId),
      db.onboardingProfile.findUnique({
        where: { userId },
        select: { remindersEnabled: true, morningReminder: true, eveningReminder: true },
      }),
      Promise.all([
        db.thread.count({ where: { userId } }),
        db.trialCompletion.count({ where: { userId } }),
        db.charge.count({ where: { userId } }),
      ]),
    ]);

    return {
      email: ctx.session.user.email,
      name: ctx.session.user.name,
      timezone: profile?.timezone ?? "UTC",
      isPro: pro,
      plan: subscription?.plan ?? "FREE",
      threads: counts[0],
      trialsCompleted: counts[1],
      charges: counts[2],
      // The device schedules reminders from this, not from its own draft:
      // the draft is cleared once claimed, and a second phone never had one.
      reminders: {
        enabled: onboarding?.remindersEnabled ?? false,
        morning: onboarding?.morningReminder ?? "06:00",
        evening: onboarding?.eveningReminder ?? "21:00",
      },
    };
  }),

  setTimezone: protectedProcedure
    .input(z.object({ timezone: z.string().min(1).max(64) }))
    .mutation(async ({ ctx, input }) => {
      // Reject a zone the platform cannot resolve, or every future day
      // boundary silently falls back to UTC.
      try {
        new Intl.DateTimeFormat("en-CA", { timeZone: input.timezone });
      } catch {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown timezone" });
      }

      return db.profile.upsert({
        where: { userId: ctx.session.user.id },
        create: { userId: ctx.session.user.id, timezone: input.timezone },
        update: { timezone: input.timezone },
      });
    }),

  setReminders: protectedProcedure
    .input(
      z.object({
        enabled: z.boolean(),
        morning: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        evening: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      db.onboardingProfile.update({
        where: { userId: ctx.session.user.id },
        data: {
          remindersEnabled: input.enabled,
          ...(input.morning ? { morningReminder: input.morning } : {}),
          ...(input.evening ? { eveningReminder: input.evening } : {}),
        },
      }),
    ),

  /**
   * Everything held about the user, as one JSON payload.
   *
   * Play's data-safety expectations and GDPR portability both want this
   * reachable without emailing anyone. Message bodies live in Mastra's
   * store rather than here, so the export names the threads and says
   * plainly that their contents are not included yet.
   */
  /**
   * This install's Expo push token, so a letter finished after the app was
   * closed can still reach it (plan 13). A token names a device, not a
   * person: a second account signing in on the same phone takes the row
   * over. Never throws. Before the database has the table (not yet
   * migrated), it reports registered: false and the app carries on.
   */
  registerPushToken: protectedProcedure
    .input(
      z.object({
        token: z.string().min(1).max(512).refine(isExpoPushToken, "Not an Expo push token"),
        platform: z.enum(["android", "ios"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await db.pushToken.upsert({
          where: { token: input.token },
          create: { userId: ctx.session.user.id, token: input.token, platform: input.platform },
          update: { userId: ctx.session.user.id, platform: input.platform },
        });
        return { registered: true };
      } catch (e) {
        console.warn("[push] could not register a token", e);
        return { registered: false };
      }
    }),

  /** Signing out: this install stops receiving the account's letters. */
  unregisterPushToken: protectedProcedure
    .input(z.object({ token: z.string().min(1).max(512) }))
    .mutation(async ({ ctx, input }) => {
      try {
        await db.pushToken.deleteMany({
          where: { token: input.token, userId: ctx.session.user.id },
        });
      } catch (e) {
        console.warn("[push] could not remove a token", e);
      }
      return { ok: true };
    }),

  exportData: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [profile, onboarding, progress, completions, charges, threads, code, usage, devices] =
      await Promise.all([
        db.profile.findUnique({ where: { userId } }),
        db.onboardingProfile.findUnique({ where: { userId }, include: { wounds: true } }),
        db.pathProgress.findUnique({ where: { userId } }),
        db.trialCompletion.findMany({ where: { userId }, include: { pathDay: true } }),
        db.charge.findMany({ where: { userId } }),
        db.thread.findMany({ where: { userId }, include: { master: { select: { slug: true } } } }),
        db.personalCode.findUnique({ where: { userId } }),
        db.dailyUsage.findMany({ where: { userId } }),
        // The installs that receive letters. Read defensively, like every
        // push path: an unmigrated database has no table.
        db.pushToken
          .findMany({ where: { userId }, select: { platform: true, createdAt: true, updatedAt: true } })
          .catch(() => []),
      ]);

    return {
      exportedAt: new Date().toISOString(),
      account: {
        id: userId,
        email: ctx.session.user.email,
        name: ctx.session.user.name,
      },
      profile,
      onboarding,
      pathProgress: progress,
      trialCompletions: completions,
      charges,
      threads: threads.map((t) => ({
        id: t.id,
        title: t.title,
        master: t.master.slug,
        createdAt: t.createdAt,
        lastMessageAt: t.lastMessageAt,
      })),
      personalCode: code,
      dailyUsage: usage,
      notificationDevices: devices,
      notes: [
        "Message contents are stored separately and are not included in this export yet.",
        "Purchase receipts are held by Apple or Google, not by us.",
      ],
    };
  }),

  /**
   * Deletes the account, immediately.
   *
   * Requires the user to retype their own email — not as security, since
   * the session already proves identity, but because this is irreversible
   * and a single mistaken tap should not be able to do it.
   *
   * Every domain table cascades from User, so this one delete removes
   * conversations, trials, charges, progress and usage with it.
   */
  deleteAccount: protectedProcedure
    .input(z.object({ confirmEmail: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const email = ctx.session.user.email;

      if (input.confirmEmail.trim().toLowerCase() !== email.toLowerCase()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "EMAIL_MISMATCH" });
      }

      await db.deletionRequest.create({
        data: {
          email,
          userId: ctx.session.user.id,
          status: "COMPLETED",
          // In-app deletion is already verified by the session, so the
          // token is recorded only to keep the audit row shaped the same.
          token: crypto.randomUUID().replace(/-/g, ""),
          expiresAt: new Date(),
          verifiedAt: new Date(),
          completedAt: new Date(),
        },
      });

      await db.user.delete({ where: { id: ctx.session.user.id } });

      return { deleted: true as const };
    }),
});
