import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Redirect, Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";

import { authClient } from "@/lib/auth-client";
import { useClaimDraft } from "@/lib/claim-draft";
import { useLetterRegistration, useOpenLettersFromNotifications } from "@/lib/letters";
import { useOnboarding } from "@/lib/onboarding-store";
import { useReminderSchedule, useRetentionNudges } from "@/lib/use-reminders";
import { ink, indigo, space, text as textColor } from "@/theme/tokens";
import { font, size, tracking } from "@/theme/tokens";
import { trpc } from "@/utils/trpc";

/**
 * The app shell.
 *
 * Four destinations, matching the design's bottom bar: the Path you are on,
 * the Adversity library you browse, the Chat where a Master answers, and
 * You. Chat sits in the middle and is marked with the blade glyph because it
 * is the thing the app is for.
 */
export default function AppLayout() {
  const { data: session, isPending } = authClient.useSession();
  const { draft, hydrated } = useOnboarding();
  const status = useQuery({
    ...trpc.onboarding.status.queryOptions(),
    enabled: Boolean(session),
  });

  // Submits the onboarding draft whenever a session exists and it has not
  // landed yet — retried on every launch until the server confirms. Called
  // before the early returns below so hook order never changes.
  useClaimDraft();
  // Keeps the two daily reminders in step with the account's settings.
  useReminderSchedule(Boolean(session));
  // Questions back, and a charge still open: the only two nudges (plan 13).
  useRetentionNudges(Boolean(session));
  // Letters that find you (plan 13): register this install for pushes, and
  // open the chat from a letter's notification.
  useLetterRegistration(Boolean(session));
  useOpenLettersFromNotifications(Boolean(session));

  // This layout is the gate (D-038). "/" resolves here — welcome lives at
  // /welcome precisely so that nothing else competes for it — so every
  // launch, sign-in and sign-out passes through these checks:
  //
  //   signed out                          -> /welcome
  //   signed in, onboarding not finished  -> onboarding
  //   signed in, onboarding finished      -> the tabs below
  //
  // "Finished" has two sources: the server's record of a claimed draft, and a
  // finished draft on this device whose claim has not landed yet. The second
  // counts, so a user who reached the end of the quiz offline is not sent
  // back through it.
  //
  // The ground colour is rendered while anything is still unknown, rather
  // than the Path: flashing the app at a brand-new account and then yanking
  // them into onboarding reads as a bug.
  const blank = <View style={{ flex: 1, backgroundColor: ink.base }} />;

  if (isPending || !hydrated) return blank;
  if (!session) return <Redirect href="/welcome" />;
  if (!draft.finishedAt) {
    if (status.isPending) return blank;
    // Only an explicit "not claimed" sends someone to the quiz. If the
    // status cannot be fetched at all the user comes in — an unreachable
    // server must not trap a returning user in a quiz they already took.
    if (status.data?.claimed === false) return <Redirect href="/(onboarding)/problem" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: ink.base },
        tabBarStyle: {
          backgroundColor: ink.base,
          borderTopColor: ink.border,
          borderTopWidth: 1,
          height: 64,
          paddingTop: space.sm,
        },
        tabBarActiveTintColor: indigo.light,
        tabBarInactiveTintColor: textColor.faintest,
        tabBarLabelStyle: {
          fontFamily: font.condensed,
          fontSize: size.eyebrow,
          letterSpacing: size.eyebrow * tracking.label,
          textTransform: "uppercase",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Path",
          tabBarIcon: ({ color, size: s }) => (
            <Ionicons name="footsteps-outline" size={s} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="adversity"
        options={{
          title: "Adversity",
          tabBarIcon: ({ color, size: s }) => (
            <Ionicons name="library-outline" size={s} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size: s }) => (
            <Ionicons name="chatbubble-outline" size={s} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: "You",
          tabBarIcon: ({ color, size: s }) => (
            <Ionicons name="person-outline" size={s} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
