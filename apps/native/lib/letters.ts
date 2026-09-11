import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React from "react";
import { AppState, Platform } from "react-native";

import { hasReminderPermission, LETTERS_CHANNEL, ensureChannels } from "@/lib/notifications";
import { trpcClient } from "@/utils/trpc";

/**
 * Letters that find you (plan 13): the phone's half.
 *
 * A Master's letter is written, checked and saved on the server even if the
 * person leaves the app while it's being written. How they hear about it
 * depends on what became of the app:
 *
 *   - Open: the letter writes itself out on screen. No notification.
 *   - In the background, still alive: the letter still arrives over the
 *     connection, and the phone shows its own notification (below).
 *   - Closed, or the connection lost: the server pushes it. That needs this
 *     install's push token, registered here, and Firebase in the build.
 *
 * Either way the phone confirms each letter it receives
 * (chat.replyReceived), and the server only pushes a letter nobody
 * confirmed, so it's one notification, not two.
 *
 * Android only for now. Tapping a letter notification opens the chat;
 * there's no reply from the notification (the owner's call).
 */

const TOKEN_KEY = "miyamoto.push.token";

/** The same cut the server uses (packages/api/src/lib/push.ts). */
export function previewOf(text: string, max = 90): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max + 1);
  const atWord = cut.lastIndexOf(" ");
  return `${(atWord > max * 0.6 ? cut.slice(0, atWord) : flat.slice(0, max)).replace(/[\s,;:.—-]+$/, "")}…`;
}

// ── Whether a letter can find a closed app ───────────────────────────────

let ready = false;
const listeners = new Set<() => void>();
function setReady(value: boolean) {
  if (ready === value) return;
  ready = value;
  for (const l of listeners) l();
}

/**
 * True once this install's push token is registered with the server: a
 * letter will reach the phone even if the app is closed. The chat only says
 * "you can leave" when this is true.
 */
export function useLettersReady(): boolean {
  return React.useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => ready,
  );
}

/**
 * Registers this install for letter pushes, if notifications are allowed.
 * Call on sign-in and after the permission prompt. Resolves to whether it
 * worked. It fails quietly (false) without permission, or without Firebase
 * in the build, which is the state until the owner adds google-services.json.
 */
export async function registerForLetters(): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  try {
    if (!(await hasReminderPermission())) return false;
    await ensureChannels();
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const { registered } = await trpcClient.account.registerPushToken.mutate({
      token,
      platform: "android",
    });
    if (registered) await SecureStore.setItemAsync(TOKEN_KEY, token);
    setReady(registered);
    return registered;
  } catch (e) {
    // Most often: no Firebase in this build ("Default FirebaseApp is not
    // initialized"). Letters then find the app only while it's alive.
    console.warn("[letters] push registration unavailable", e);
    setReady(false);
    return false;
  }
}

/**
 * Before signing out: this install stops receiving the account's letters,
 * so the next person to sign in on this phone doesn't get them.
 */
export async function forgetLetters(): Promise<void> {
  setReady(false);
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) return;
    await trpcClient.account.unregisterPushToken.mutate({ token });
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Signed out regardless. A token left behind moves to whoever signs in
    // next on this phone the moment they register.
  }
}

// ── A letter just arrived ────────────────────────────────────────────────

/**
 * Called when a letter has fully arrived on the phone. Confirms it, so the
 * server doesn't push it too, and if the app isn't in front, shows the
 * notification the server would have sent.
 */
export async function letterArrived(args: {
  threadId: string;
  masterName: string;
  text: string;
}): Promise<void> {
  void trpcClient.chat.replyReceived.mutate({ threadId: args.threadId }).catch(() => {
    // Unconfirmed, the server pushes it after its wait. Worst case, two
    // notifications for one letter.
  });

  if (AppState.currentState === "active" || Platform.OS !== "android") return;
  try {
    if (!(await hasReminderPermission())) return;
    await ensureChannels();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: args.masterName,
        body: previewOf(args.text),
        data: { kind: "reply", threadId: args.threadId },
      },
      trigger: { channelId: LETTERS_CHANNEL },
    });
  } catch {
    // The letter is in the chat either way.
  }
}

// ── Opening a letter from its notification ───────────────────────────────

/**
 * Tapping a letter notification opens the chat, whether the app was running
 * or started from the tap. The chat opens on the most recent conversation,
 * and a letter that just arrived made its conversation the most recent.
 */
export function useOpenLettersFromNotifications(enabled: boolean) {
  const router = useRouter();
  const handled = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!enabled || Platform.OS === "web") return;

    const open = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const id = response.notification.request.identifier;
      const data = response.notification.request.content.data as { kind?: string } | undefined;
      if (data?.kind !== "reply" || handled.current === id) return;
      handled.current = id;
      router.push("/(app)/chat");
    };

    // Started from the tap: the response is waiting for us.
    void Notifications.getLastNotificationResponseAsync().then(open).catch(() => {});
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, [enabled, router]);
}

/** Registers for letters whenever someone is signed in and allows notifications. */
export function useLetterRegistration(enabled: boolean) {
  React.useEffect(() => {
    if (enabled) void registerForLetters();
  }, [enabled]);
}
