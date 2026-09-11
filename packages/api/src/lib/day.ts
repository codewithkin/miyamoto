/**
 * Day boundaries.
 *
 * Every "day" in this app — the three free questions, the streak, Day 29 —
 * is the user's local day, not a UTC one. A user in Nairobi who asks a
 * question at 01:00 has started a new day; the server, sitting in UTC, has
 * not. Resolving that wrong either gives people six questions or breaks a
 * streak they actually kept.
 *
 * Local dates are stored as YYYY-MM-DD strings so they compare and index as
 * plain values, with no timezone left to reinterpret later.
 */

/** The user's local calendar date, as YYYY-MM-DD. */
export function localDate(timezone: string, at: Date = new Date()): string {
  try {
    // en-CA formats as YYYY-MM-DD, which is exactly the shape we store.
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(at);
  } catch {
    // An invalid zone must not take the request down — fall back to UTC and
    // let the user keep working with a slightly wrong boundary.
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(at);
  }
}

/** The local date one day before the given one. */
export function previousDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

/** Whole days between two YYYY-MM-DD dates. Negative if `to` precedes `from`. */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/**
 * Whether a streak whose last completion was `lastCompletedOn` is still
 * alive today.
 *
 * Completing twice in one day keeps the streak but does not extend it;
 * missing a whole day ends it.
 */
export function streakState(
  lastCompletedOn: string | null,
  today: string,
): "already-done-today" | "extends" | "broken" | "fresh" {
  if (!lastCompletedOn) return "fresh";
  const gap = daysBetween(lastCompletedOn, today);
  if (gap <= 0) return "already-done-today";
  if (gap === 1) return "extends";
  return "broken";
}

/** Milliseconds until the user's local midnight — for "14h left" copy. */
export function msUntilLocalMidnight(timezone: string, at: Date = new Date()): number {
  const today = localDate(timezone, at);
  // Walk forward in hours until the local date rolls over. Cheap, and
  // immune to DST arithmetic that manual offset maths gets wrong.
  for (let h = 1; h <= 36; h++) {
    const probe = new Date(at.getTime() + h * 3_600_000);
    if (localDate(timezone, probe) !== today) {
      // Narrow to the minute.
      for (let m = 1; m <= 60; m++) {
        const fine = new Date(at.getTime() + (h - 1) * 3_600_000 + m * 60_000);
        if (localDate(timezone, fine) !== today) {
          return (h - 1) * 3_600_000 + m * 60_000;
        }
      }
      return h * 3_600_000;
    }
  }
  return 24 * 3_600_000;
}

/** How many questions a free account gets per local day. */
export const FREE_DAILY_QUESTIONS = 3;

/** What one watched rewarded ad is worth (plan 13: "watch an ad, +3"). */
export const QUESTIONS_PER_AD = 3;

/**
 * Rewarded ads a free account can cash in per local day.
 *
 * The server can't yet verify an ad was actually watched: AdMob's
 * server-side verification isn't set up, so `grantBonus` takes the phone's
 * word. Uncapped, a rewritten client would get unlimited free model calls.
 * Five ads is fifteen extra questions, six times the free day: plenty for
 * a real person, and a bounded cost if someone cheats. Raise it or remove
 * it once rewards are verified server-side.
 */
export const MAX_ADS_PER_DAY = 5;
