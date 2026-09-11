import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Trial reminders.
 *
 * Onboarding screen 10 promises exactly two notifications a day, both about
 * the trial, plus a streak warning only on a day the streak would actually
 * break. This file is where that promise is kept or broken, so everything it
 * schedules has to match what that screen showed.
 */

/** Recorded once the OS prompt has been refused, so it is never re-raised. */
const DENIED_KEY = "miyamoto.notifications.denied";

/** Android needs a channel before anything can be delivered, or prompted. */
export const TRIAL_CHANNEL = "trial";

/**
 * Letters from the Masters (plan 13): a letter that finished after the app
 * was left. Its own channel, so someone can silence reminders and still
 * hear from a Master they wrote to, or the other way round, in Android's
 * settings. The server pushes on the same id (packages/api/src/lib/push.ts).
 */
export const LETTERS_CHANNEL = "letters";

export type PermissionOutcome = "granted" | "denied" | "unavailable";

/** Both channels. Creating an existing channel is a no-op, so this is safe to repeat. */
export async function ensureChannels() {
  if (Platform.OS !== "android") return;
  await Promise.all([
    Notifications.setNotificationChannelAsync(TRIAL_CHANNEL, {
      name: "Trial reminders",
      importance: Notifications.AndroidImportance.HIGH,
    }),
    Notifications.setNotificationChannelAsync(LETTERS_CHANNEL, {
      name: "Letters from the Masters",
      description: "When a Master's letter arrives after you've left the app.",
      importance: Notifications.AndroidImportance.HIGH,
    }),
  ]);
}

const ensureChannel = ensureChannels;

/** Whether the OS prompt was refused before, so it's never raised again. */
export async function notificationsRefused(): Promise<boolean> {
  try {
    return Boolean(await SecureStore.getItemAsync(DENIED_KEY));
  } catch {
    return false;
  }
}

/**
 * Raises the OS permission prompt, at most once.
 *
 * Screen 10 primes this by showing the two notifications before asking, which
 * is the only reason to ask at all. A refusal is recorded and respected: the
 * prompt is not raised again on the next launch, or the next time someone
 * taps the button, because re-asking a person who said no is the "we miss
 * you" behaviour the same screen promises never to do. If they change their
 * mind, the OS settings are where they do it.
 */
export async function requestReminderPermission(): Promise<PermissionOutcome> {
  if (Platform.OS === "web") return "unavailable";

  try {
    await ensureChannel();

    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return "granted";

    const refusedBefore = Boolean(await SecureStore.getItemAsync(DENIED_KEY));
    if (refusedBefore || !current.canAskAgain) return "denied";

    const asked = await Notifications.requestPermissionsAsync();
    if (asked.granted) return "granted";

    await SecureStore.setItemAsync(DENIED_KEY, new Date().toISOString());
    return "denied";
  } catch {
    // A failed prompt is not a refusal. Record nothing, so it can be offered
    // again rather than silently switched off for good.
    return "unavailable";
  }
}

/** Whether reminders can be delivered right now, without prompting. */
export async function hasReminderPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    return (await Notifications.getPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

// ── The two daily reminders ──────────────────────────────────────────────

/**
 * Fixed identifiers. Screen 10 promises two notifications a day, so there
 * are exactly two slots, and scheduling fills a slot rather than adding one.
 */
const MORNING_ID = "trial-morning";
const EVENING_ID = "trial-evening";

export type ReminderPlan = {
  /** "06:00", on the device's wall clock. */
  morning: string;
  evening: string;
  morningTitle: string;
  morningBody: string;
  eveningTitle: string;
  eveningBody: string;
};

function parseHHMM(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

/** Removes both daily reminders. Safe to call when none are scheduled. */
export async function cancelDailyReminders(): Promise<void> {
  if (Platform.OS === "web") return;
  await Promise.all(
    [MORNING_ID, EVENING_ID].map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {}),
    ),
  );
}

/**
 * Schedules the morning and evening reminders, replacing any existing pair.
 *
 * Both slots are cancelled before either is scheduled. Reusing an identifier
 * replaces on iOS, but the promise on screen 10 is "two a day", and relying
 * on each platform's replace semantics to keep that promise is how a user
 * who changed their time twice ends up woken three times.
 *
 * DAILY triggers fire on the device's wall clock. The day boundary that
 * governs streaks and the counter is the timezone on the server (D-017),
 * which the claim captured from this same device, so the two agree. If the
 * user travels, the reminder follows the clock they are living by — which is
 * what a person woken at 06:00 wants.
 *
 * Resolves false, scheduling nothing, without permission or with a
 * malformed time.
 */
export async function scheduleDailyReminders(plan: ReminderPlan): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const morning = parseHHMM(plan.morning);
  const evening = parseHHMM(plan.evening);
  if (!morning || !evening) return false;
  if (!(await hasReminderPermission())) return false;

  await ensureChannel();
  await cancelDailyReminders();
  await Promise.all([
    Notifications.scheduleNotificationAsync({
      identifier: MORNING_ID,
      content: { title: plan.morningTitle, body: plan.morningBody },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        channelId: TRIAL_CHANNEL,
        ...morning,
      },
    }),
    Notifications.scheduleNotificationAsync({
      identifier: EVENING_ID,
      content: { title: plan.eveningTitle, body: plan.eveningBody },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        channelId: TRIAL_CHANNEL,
        ...evening,
      },
    }),
  ]);
  return true;
}

// ── The streak warning ───────────────────────────────────────────────────

const STREAK_ID = "streak-warning";

/**
 * Removes the pending streak warning, if any. Safe when there is none.
 */
export async function cancelStreakWarning(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync(STREAK_ID).catch(() => {});
}

/**
 * Schedules the single streak warning, replacing any pending one.
 *
 * Screen 10 promises "Streak reminders only on the day you'd break it". So
 * this is a one-off at a specific moment, never a repeating trigger, and the
 * caller decides the moment from the server's own streak arithmetic. A
 * moment already in the past schedules nothing.
 */
export async function scheduleStreakWarning(args: {
  at: Date;
  title: string;
  body: string;
}): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (args.at.getTime() <= Date.now()) {
    await cancelStreakWarning();
    return false;
  }
  if (!(await hasReminderPermission())) return false;

  await ensureChannel();
  await cancelStreakWarning();
  await Notifications.scheduleNotificationAsync({
    identifier: STREAK_ID,
    content: { title: args.title, body: args.body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: args.at,
      channelId: TRIAL_CHANNEL,
    },
  });
  return true;
}

/**
 * A reminder arriving while the app is open is still shown, without sound —
 * the user is already here, and the trial is on the screen in front of them.
 *
 * A letter is not shown at all while the app is open (plan 13). The chat
 * already has it, writing itself out, and a banner announcing the letter
 * the person is reading is noise.
 */
export function configureForegroundDisplay() {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = notification.request.content.data as { kind?: string } | undefined;
      const letter = data?.kind === "reply";
      return {
        shouldShowBanner: !letter,
        shouldShowList: !letter,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    },
  });
}
