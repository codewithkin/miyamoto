import db from "@miyamoto/db";

import { FREE_DAILY_QUESTIONS, localDate } from "./day";

/**
 * The free counter.
 *
 * This lives on the server and reads from our own tables, never from
 * anything the client says. A counter the app can edit is not a counter,
 * and the whole Pro proposition rests on this one being real.
 */

export type UsageState = {
  /** The user's local date the count applies to. */
  localDate: string;
  used: number;
  /** Extra questions earned by watching an ad. */
  bonus: number;
  /** Null when the user is Pro — there is no ceiling. */
  limit: number | null;
  remaining: number | null;
  isPro: boolean;
  canAsk: boolean;
};

async function resolveTimezone(userId: string): Promise<string> {
  const profile = await db.profile.findUnique({
    where: { userId },
    select: { timezone: true },
  });
  return profile?.timezone ?? "UTC";
}

/**
 * The only definition of Pro. Every gate calls this.
 *
 * It exists as one function because it was three: this one honoured a lapsed
 * expiresAt, while the library, the Master switch and the settings screen
 * each read entitlementActive alone. A subscription whose clearing webhook
 * never arrived was therefore not Pro at the counter and still Pro everywhere
 * else — a gate that disagrees with itself is not a gate (D-018).
 */
export async function isPro(userId: string): Promise<boolean> {
  const sub = await db.subscription.findUnique({
    where: { userId },
    select: { entitlementActive: true, expiresAt: true },
  });
  if (!sub?.entitlementActive) return false;
  // A lifetime purchase has no expiry; a lapsed subscription is not Pro even
  // if the webhook that should have cleared the flag never arrived.
  if (sub.expiresAt && sub.expiresAt.getTime() < Date.now()) return false;
  return true;
}

export async function getUsage(userId: string): Promise<UsageState> {
  const timezone = await resolveTimezone(userId);
  const date = localDate(timezone);
  const pro = await isPro(userId);

  const row = await db.dailyUsage.findUnique({
    where: { userId_localDate: { userId, localDate: date } },
    select: { questionCount: true, bonusQuestions: true },
  });

  const used = row?.questionCount ?? 0;
  const bonus = row?.bonusQuestions ?? 0;

  if (pro) {
    return {
      localDate: date,
      used,
      bonus,
      limit: null,
      remaining: null,
      isPro: true,
      canAsk: true,
    };
  }

  const limit = FREE_DAILY_QUESTIONS + bonus;
  const remaining = Math.max(0, limit - used);

  return {
    localDate: date,
    used,
    bonus,
    limit,
    remaining,
    isPro: false,
    canAsk: remaining > 0,
  };
}

/**
 * Records one question against today, and returns the state after it.
 *
 * Throws if the user has nothing left — callers must treat that as the
 * "out of answers" path rather than letting the question through.
 */
export async function consumeQuestion(
  userId: string,
): Promise<UsageState> {
  const before = await getUsage(userId);
  if (!before.canAsk) {
    throw new Error("OUT_OF_QUESTIONS");
  }

  await db.dailyUsage.upsert({
    where: { userId_localDate: { userId, localDate: before.localDate } },
    create: { userId, localDate: before.localDate, questionCount: 1 },
    update: { questionCount: { increment: 1 } },
  });

  return getUsage(userId);
}

/**
 * Gives back a question that was spent on an answer never delivered.
 *
 * The question is spent before generating (D-018), which is right: checking
 * afterwards would let a rewritten client take unlimited answers. The cost of
 * that ordering is that a model outage, a withdrawn Master or a reply
 * rejected for inventing history would each eat one of three daily questions
 * while giving the user nothing. Refunding closes that without reopening the
 * hole — a refund only follows a failure on our side, and delivers nothing.
 *
 * Takes the local date the question was spent against rather than
 * recomputing it, so a request that crosses the user's midnight refunds the
 * day it was charged to.
 */
export async function refundQuestion(userId: string, localDate: string): Promise<void> {
  await db.dailyUsage.updateMany({
    where: { userId, localDate, questionCount: { gt: 0 } },
    data: { questionCount: { decrement: 1 } },
  });
}

/** Grants one extra question for today, after an ad is watched. */
export async function grantBonusQuestion(
  userId: string,
): Promise<UsageState> {
  const state = await getUsage(userId);
  await db.dailyUsage.upsert({
    where: { userId_localDate: { userId, localDate: state.localDate } },
    create: { userId, localDate: state.localDate, bonusQuestions: 1 },
    update: { bonusQuestions: { increment: 1 } },
  });
  return getUsage(userId);
}
