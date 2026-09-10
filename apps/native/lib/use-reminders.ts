import { useQuery } from "@tanstack/react-query";
import React from "react";

import { MASTERS } from "@/content/onboarding-options";
import {
  cancelDailyReminders,
  configureForegroundDisplay,
  scheduleDailyReminders,
} from "@/lib/notifications";
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

export function useReminderSchedule(enabled: boolean) {
  const account = useQuery({ ...trpc.account.overview.queryOptions(), enabled });
  const today = useQuery({ ...trpc.path.today.queryOptions(), enabled });

  const reminders = account.data?.reminders;
  const trial = today.data?.trial?.body ?? null;
  const morningBody = trial
    ? `Day ${today.data?.currentDay ?? 1}. ${trial}`
    : "Today's trial is on the Path. Before breakfast.";
  const firstSlug = today.data?.master?.slug ?? "musashi";
  const morningFrom = today.data?.master?.name ?? "Musashi";
  const eveningFrom =
    MASTERS.find((m) => m.slug !== firstSlug && !m.proOnly)?.name ?? morningFrom;

  React.useEffect(() => {
    configureForegroundDisplay();
  }, []);

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
