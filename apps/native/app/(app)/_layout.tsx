import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

import { ink, indigo, space, text as textColor } from "@/theme/tokens";
import { font, size, tracking } from "@/theme/tokens";

/**
 * The app shell.
 *
 * Four destinations, matching the design's bottom bar: the Path you are on,
 * the Adversity library you browse, the Chat where a Master answers, and
 * You. Chat sits in the middle and is marked with the blade glyph because it
 * is the thing the app is for.
 */
export default function AppLayout() {
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
