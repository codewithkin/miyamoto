import { useQuery } from "@tanstack/react-query";
import React from "react";

import {
  CHARGE_OPEN_ID,
  QUESTIONS_BACK_ID,
  cancelDailyReminders,
  cancelNudge,
  cancelStreakWarning,
  configureForegroundDisplay,
  scheduleDailyReminders,
  scheduleNudge,
  scheduleStreakWarning,
} from "@/lib/notifications";
import { previewOf } from "@/lib/letters";
import { streakWarningAt } from "@/lib/streak-warning";
import { trpc } from "@/utils/trpc";

/**
 * Keeps the device's two scheduled reminders in step with the account.
 *
 * The server holds whether reminders are on and when (account.overview), so
 * a second phone, a reinstall, or a change made in Settings all converge on
 * the same pair. Whenever any of those values changes, the pair is replaced;
 * when reminders are off, it is removed.
 *
 * Who each notification is from matches onboarding screen 10, which showed
 * the user exactly these two before asking for permission: the morning from
 * their first Master, carrying the day's actual trial; the evening from the
 * next Master on the ladder, asking whether it was done.
 *
 * A DAILY notification's text is fixed when it is scheduled, which would be
 * wrong for a trial that changes — except that the Path advances only when a
 * trial is completed, and completion happens in this app. Completing
 * refetches path.today, the morning text changes, and the pair is replaced.
 * So the text a user wakes to is the trial they actually have: tomorrow's if
 * they finished today, today's again if they did not.
 */

/** Screen 10's evening preview, verbatim. The promise is the copy. */
const EVENING_BODY = "Did you do it? One word is enough.";


/**
 * The two nudges (lib/notifications, plan 13), kept in step with the
 * server's counter and today's charges. Both read queries the app already
 * holds, so this adds no requests of its own beyond today's charges.
 */
export function useRetentionNudges(enabled: boolean) {
  const usage = useQuery({ ...trpc.chat.usage.queryOptions(), enabled });
  const charges = useQuery({ ...trpc.chat.charges.queryOptions(), enabled });
  const today = useQuery({ ...trpc.path.today.queryOptions(), enabled });
  const from = today.data?.master?.name ?? "Musashi";

  // Questions back: only for a free account that has run out today. The
  // reset is the server's midnight in the account's timezone (D-017),
  // bucketed to ten minutes so a refetch doesn't reschedule. The morning
  // after, at 08:00, one notification. Pro cancels it.
  const u = usage.data;
  const ranOut = Boolean(u && !u.isPro && !u.canAsk);
  const resetAt = u ? Math.round((Date.now() + u.msUntilReset) / 600_000) * 600_000 : null;
  React.useEffect(() => {
    if (!enabled || !u) return;
    if (u.isPro) {
      void cancelNudge(QUESTIONS_BACK_ID);
      return;
    }
    // Not out today: leave any pending one alone. Running out earlier and
    // then watching an ad doesn't make tomorrow's questions less true.
    if (!ranOut || resetAt == null) return;
    void scheduleNudge({
      id: QUESTIONS_BACK_ID,
      at: new Date(resetAt + 8 * 3_600_000),
      title: from,
      body: "Three new questions today. Bring the next one.",
      kind: "questions",
    }).catch(() => {});
  }, [enabled, u?.isPro, ranOut, resetAt, from]);

  // A charge still open at 18:00 on the day it was handed over: one nudge in
  // its Master's name, with the charge itself. Done, declined, or past
  // 18:00 cancels it.
  const open = charges.data?.find((c) => c.status === "PENDING" || c.status === "ACCEPTED");
  React.useEffect(() => {
    if (!enabled || !charges.data) return;
    if (!open) {
      void cancelNudge(CHARGE_OPEN_ID);
      return;
    }
    const at = new Date();
    at.setHours(18, 0, 0, 0);
    void scheduleNudge({
      id: CHARGE_OPEN_ID,
      at,
      title: open.master.name,
      body: `Still due today: ${previewOf(open.body, 80)}`,
      kind: "charge",
    }).catch(() => {});
  }, [enabled, Boolean(charges.data), open?.id, open?.body, open?.master.name]);
}

export function useReminderSchedule(enabled: boolean) {
  const account = useQuery({ ...trpc.account.overview.queryOptions(), enabled });
  const today = useQuery({ ...trpc.path.today.queryOptions(), enabled });

  const reminders = account.data?.reminders;
  const trial = today.data?.trial?.body ?? null;
  const morningBody = trial
    ? `Day ${today.data?.currentDay ?? 1}. ${trial}`
    : "Today's trial is on the Path. Before breakfast.";
  const morningFrom = today.data?.master?.name ?? "Musashi";
  // The evening check-in comes from the same Master as the morning. It used to
  // come from "the next non-Pro Master", which is Seneca — locked until Day 7
  // since every Master but Musashi became earned (D-005). A Day 1 notification
  // from someone the user cannot yet speak to undercuts the whole ladder.
  const eveningFrom = morningFrom;

  React.useEffect(() => {
    configureForegroundDisplay();
  }, []);

  // The streak warning (02 T04). The server says whether the streak is alive
  // and whether today is the day it would break; this only picks the moment.
  //
  //   - done yesterday, not yet today: it breaks tonight, so warn tonight.
  //   - done today with a streak: nothing can break tonight, but tomorrow it
  //     can, and a user who does not open the app tomorrow would otherwise
  //     get no warning at all. So warn tomorrow night — completing tomorrow
  //     refetches path.today and moves the warning on again.
  //   - no streak: nothing to warn about, and nothing is sent.
  //
  // Tomorrow is taken as midnight plus 24 hours, so a DST change moves the
  // warning by an hour on that one night. That is the whole cost.
  const streak = today.data?.streak ?? 0;
  const atRisk = today.data?.streakAtRisk ?? false;
  const doneToday = today.data?.completedToday ?? false;
  const untilMidnight = today.data?.msUntilReset;
  // Ten-minute buckets, so a refetch a few seconds later does not reschedule.
  const midnightBucket = untilMidnight == null ? null : Math.round((Date.now() + untilMidnight) / 600_000);

  React.useEffect(() => {
    if (!enabled || !reminders || midnightBucket == null) return;
    if (!reminders.enabled || streak === 0) {
      void cancelStreakWarning();
      return;
    }

    const at = streakWarningAt({ streak, atRisk, doneToday, midnight: midnightBucket * 600_000 });

    if (!at) {
      void cancelStreakWarning();
      return;
    }

    void scheduleStreakWarning({
      at,
      title: morningFrom,
      body: `${streak} days. It ends at midnight unless today's trial is done.`,
    }).catch(() => {});
  }, [enabled, reminders?.enabled, streak, atRisk, doneToday, midnightBucket, morningFrom]);

  React.useEffect(() => {
    if (!enabled || !reminders) return;

    if (!reminders.enabled) {
      void cancelDailyReminders();
      return;
    }

    void scheduleDailyReminders({
      morning: reminders.morning,
      evening: reminders.evening,
      morningTitle: morningFrom,
      morningBody,
      eveningTitle: eveningFrom,
      eveningBody: EVENING_BODY,
    }).catch(() => {
      // A failed schedule leaves the previous pair, or none. The next change
      // or the next launch tries again; nothing here is worth an error.
    });
  }, [
    enabled,
    reminders?.enabled,
    reminders?.morning,
    reminders?.evening,
    morningFrom,
    eveningFrom,
    morningBody,
  ]);
}
