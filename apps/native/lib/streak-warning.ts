/**
 * When the streak warning fires, if at all.
 *
 * Kept apart from lib/notifications and free of any React Native import, so
 * the one piece of decision logic in the streak warning can be run on its
 * own rather than only typechecked. The server decides whether the streak is
 * alive and at risk (path.today); this only turns that into a moment.
 */

/** The warning lands this long before the user's local midnight. */
export const STREAK_LEAD_MS = 90 * 60_000;
export const DAY_MS = 24 * 3_600_000;

export function streakWarningAt(args: {
  streak: number;
  /** Done yesterday, not yet today: the streak breaks tonight. */
  atRisk: boolean;
  doneToday: boolean;
  /** The user's next local midnight, as epoch milliseconds. */
  midnight: number;
}): Date | null {
  // No streak, nothing to lose, and nothing is sent. "No marketing."
  if (args.streak <= 0) return null;
  if (args.atRisk) return new Date(args.midnight - STREAK_LEAD_MS);
  // Nothing can break tonight, but tomorrow it can — and a user who does not
  // open the app tomorrow would otherwise get no warning at all.
  if (args.doneToday) return new Date(args.midnight + DAY_MS - STREAK_LEAD_MS);
  return null;
}
