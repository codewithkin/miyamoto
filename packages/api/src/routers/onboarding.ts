import db from "@miyamoto/db";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

/**
 * Claiming the onboarding draft.
 *
 * The quiz runs before an account exists, so eleven screens of answers sit
 * on the device until a session does. This is where they stop being a draft.
 *
 * The one property that matters here is idempotency. The client calls this
 * after every successful sign-in and clears its draft only once the server
 * confirms, which means retries are normal, not exceptional: a flaky network,
 * an app killed mid-request, a second device signing in to the same account.
 * None of those may reset anything. So:
 *
 *   - the first claim's answers win, and a later claim never overwrites them;
 *   - Profile and PathProgress are created if missing and never updated, so a
 *     user on Day 12 who signs in on a new phone is still on Day 12;
 *   - two claims racing each other resolve to one row, not an error.
 */

const HHMM = /^\d{2}:\d{2}$/;

const draftInput = z.object({
  seedProblem: z.string().trim().max(2000).nullish(),
  wounds: z.array(z.string().max(64)).max(12).default([]),
  firstMaster: z.string().max(64).nullish(),
  pressure: z.enum(["GENTLE", "FIRM", "UNBREAKABLE"]).default("FIRM"),
  morningReminder: z.string().regex(HHMM).default("06:00"),
  eveningReminder: z.string().regex(HHMM).default("21:00"),
  remindersEnabled: z.boolean().default(false),
  timezone: z.string().min(1).max(64),
});

/**
 * An unresolvable zone falls back to UTC rather than rejecting the claim.
 *
 * account.setTimezone rejects a bad zone, and should — the user is there to
 * change it. Here the zone arrives bundled with eleven screens of answers,
 * and refusing the lot over one string the device produced would lose far
 * more than a slightly wrong day boundary costs. The fallback is reported
 * back so the client can say so.
 */
function resolveTimezone(zone: string): { timezone: string; accepted: boolean } {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: zone });
    return { timezone: zone, accepted: true };
  } catch {
    return { timezone: "UTC", accepted: false };
  }
}

/**
 * The first Master must be one available on Day 1 (D-005).
 *
 * The draft stores a slug the device chose, and the device's Master list is
 * compiled into the app — it can be stale, or edited. A withdrawn, Pro-only
 * or not-yet-unlocked slug falls back to the first Day-1 Master by sort
 * order rather than failing the claim.
 */
async function resolveFirstMaster(slug: string | null | undefined) {
  const dayOne = { active: true, proOnly: false, unlockDay: null } as const;

  if (slug) {
    const chosen = await db.master.findFirst({ where: { slug, ...dayOne } });
    if (chosen) return chosen;
  }

  return db.master.findFirst({ where: dayOne, orderBy: { sortOrder: "asc" } });
}

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

/**
 * Runs a create-if-missing write, retrying once if a concurrent request
 * created the row first.
 *
 * Prisma's upsert is not atomic when the row does not exist yet: two requests
 * can both see nothing, both try to insert, and the loser throws P2002. That
 * is precisely the double-claim this router promises to survive, and the
 * first version of it did not — found by racing two claims in a check, not
 * by reading the code. On the retry the row exists, so the upsert takes its
 * update path, which here is a no-op.
 */
async function createIfMissing<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (e) {
    if (!isUniqueViolation(e)) throw e;
    return write();
  }
}

export const onboardingRouter = router({
  /** Whether this account has already claimed a draft. */
  status: protectedProcedure.query(async ({ ctx }) => {
    const profile = await db.onboardingProfile.findUnique({
      where: { userId: ctx.session.user.id },
      select: { completedAt: true },
    });
    return { claimed: Boolean(profile?.completedAt) };
  }),

  claim: protectedProcedure.input(draftInput).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    const { timezone, accepted: timezoneAccepted } = resolveTimezone(input.timezone);

    // Created once, never updated: a retry, or a second device, must not
    // move a user's day boundary or their place on the Path.
    const firstName = ctx.session.user.name?.trim().split(/\s+/)[0] || null;
    await createIfMissing(() =>
      db.profile.upsert({
        where: { userId },
        create: { userId, timezone, displayName: firstName },
        update: {},
      }),
    );
    await createIfMissing(() =>
      db.pathProgress.upsert({
        where: { userId },
        create: { userId },
        update: {},
      }),
    );

    const existing = await db.onboardingProfile.findUnique({
      where: { userId },
      include: { firstMaster: { select: { slug: true } } },
    });
    if (existing) {
      return {
        claimed: false as const,
        alreadyClaimed: true as const,
        firstMaster: existing.firstMaster?.slug ?? null,
        pressure: existing.pressure,
        timezoneAccepted,
      };
    }

    const [master, wounds] = await Promise.all([
      resolveFirstMaster(input.firstMaster),
      // Unknown slugs are dropped rather than failing the claim, for the
      // same reason as the Master: the device's list can be stale.
      db.wound.findMany({ where: { slug: { in: input.wounds } }, select: { id: true } }),
    ]);

    try {
      const seedProblem = input.seedProblem || null;

      // The profile and the first thread land together or not at all. The
      // thread is where the problem they brought gets answered; creating it
      // separately would let a lost race or a failed insert leave a claimed
      // account whose Chat tab has nothing to send on, and a retry would then
      // see alreadyClaimed and never make one.
      const [created] = await db.$transaction([
        db.onboardingProfile.create({
          data: {
            userId,
            seedProblem,
            pressure: input.pressure,
            firstMasterId: master?.id ?? null,
            morningReminder: input.morningReminder,
            eveningReminder: input.eveningReminder,
            remindersEnabled: input.remindersEnabled,
            completedAt: new Date(),
            wounds: { create: wounds.map((w) => ({ woundId: w.id })) },
          },
        }),
        ...(master
          ? [
              db.thread.create({
                data: {
                  userId,
                  mastraThreadId: crypto.randomUUID(),
                  masterId: master.id,
                  // Titled with their own words, so the thread list reads as
                  // their problem rather than "New conversation".
                  title: seedProblem ? seedProblem.slice(0, 120) : null,
                },
              }),
            ]
          : []),
      ]);

      return {
        claimed: true as const,
        alreadyClaimed: false as const,
        firstMaster: master?.slug ?? null,
        pressure: created.pressure,
        timezoneAccepted,
      };
    } catch (e) {
      // Two claims raced and the other one won. That is the idempotent
      // outcome, not a failure — report it the same way a retry would be.
      if (!isUniqueViolation(e)) throw e;
      const winner = await db.onboardingProfile.findUniqueOrThrow({
        where: { userId },
        include: { firstMaster: { select: { slug: true } } },
      });
      return {
        claimed: false as const,
        alreadyClaimed: true as const,
        firstMaster: winner.firstMaster?.slug ?? null,
        pressure: winner.pressure,
        timezoneAccepted,
      };
    }
  }),
});
