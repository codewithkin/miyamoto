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

export type PermissionOutcome = "granted" | "denied" | "unavailable";

async function ensureChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(TRIAL_CHANNEL, {
    name: "Trial reminders",
    importance: Notifications.AndroidImportance.HIGH,
  });
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
