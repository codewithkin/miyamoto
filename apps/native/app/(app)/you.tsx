import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { Blade } from "@/components/blade";
import { Touchable } from "@/components/touchable";
import { Enter, Stagger } from "@/components/motion";
import { Screen, Text } from "@/components/ui";
import { Chevron } from "@/components/icon";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { gold, indigo, ink, radius, size, space, text as textColor } from "@/theme/tokens";

/**
 * 19 · Profile and your Code.
 *
 * The Code is the emotional centre of the screen, so it is set in Caveat —
 * the user's own hand — and unfurls line by line rather than appearing as a
 * block of text. Before Day 29 it shows what is coming instead.
 */
export default function YouScreen() {
  const router = useRouter();
  const today = useQuery(trpc.path.today.queryOptions());
  const code = useQuery(trpc.path.code.queryOptions());
  const usage = useQuery(trpc.chat.usage.queryOptions());

  const d = today.data;

  return (
    <Screen scroll>
      <View style={{ gap: space.section, paddingVertical: space.xl }}>
        <Enter preset="drop">
          <View style={{ gap: space.xxs }}>
            <Text variant="display">{d?.displayName ?? "You"}</Text>
            <Text variant="caption">
              {d?.streak ?? 0}-day streak · Day {d?.currentDay ?? 1}
            </Text>
          </View>
        </Enter>

        <Stagger initialDelay={200} step={90} style={{ flexDirection: "row", gap: space.base }}>
          <Enter preset="pop" style={{ flex: 1 }}>
            <Stat value={String(d?.bushidoScore ?? 0)} label="Bushido" />
          </Enter>
          <Enter preset="pop" style={{ flex: 1 }}>
            <Stat value={String(d?.longestStreak ?? 0)} label="Best streak" />
          </Enter>
          <Enter preset="pop" style={{ flex: 1 }}>
            <Stat value={usage.data?.isPro ? "Pro" : "Free"} label="Plan" />
          </Enter>
        </Stagger>

        {/* The Code. */}
        <Enter preset="rise" delay={520}>
          <View
            style={{
              padding: space.section,
              borderRadius: radius.panel,
              backgroundColor: ink.surface,
              borderWidth: 1,
              borderColor: ink.border,
              gap: space.base,
            }}
          >
            <Text variant="eyebrow">Your Bushido Code</Text>

            {code.data?.lines?.length ? (
              <Stagger initialDelay={680} step={200} style={{ gap: space.md }}>
                {code.data.lines.map((line, i) => (
                  <Enter key={i} preset="slideLeft">
                    <View style={{ flexDirection: "row", gap: space.base }}>
                      <Text variant="hand" color={indigo.light}>
                        {i + 1}.
                      </Text>
                      <Text variant="hand" style={{ flex: 1 }}>
                        {line}
                      </Text>
                    </View>
                  </Enter>
                ))}
              </Stagger>
            ) : (
              <View style={{ gap: space.sm }}>
                <Text variant="caption">
                  Written on Day 29. {Math.max(0, 29 - (d?.currentDay ?? 1))} days away.
                </Text>
                <Blade state="empty" length={40} />
              </View>
            )}
          </View>
        </Enter>

        <Stagger initialDelay={900} step={80} style={{ gap: space.md }}>
          <Enter preset="slideLeft">
            <Row label="The Masters" onPress={() => router.push("/masters")} />
          </Enter>
          <Enter preset="slideLeft">
            <Row
              label={usage.data?.isPro ? "Miyamoto Pro · active" : "Miyamoto Pro"}
              accent={!usage.data?.isPro}
              onPress={() => router.push("/paywall")}
            />
          </Enter>
          <Enter preset="slideLeft">
            <Row label="Settings" onPress={() => router.push("/settings")} />
          </Enter>
          <Enter preset="slideLeft">
            <Row
              label="Sign out"
              onPress={async () => {
                await authClient.signOut();
                router.replace("/");
              }}
            />
          </Enter>
        </Stagger>
      </View>
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View
      style={{
        padding: space.base,
        borderRadius: radius.card,
        backgroundColor: ink.surface,
        borderWidth: 1,
        borderColor: ink.border,
        gap: 2,
      }}
    >
      <Text variant="numeral">{value}</Text>
      <Text variant="caption">{label}</Text>
    </View>
  );
}

function Row({
  label,
  accent,
  onPress,
}: {
  label: string;
  accent?: boolean;
  onPress: () => void;
}) {
  return (
    <Touchable feel="row"
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: space.xl,
        borderRadius: radius.card,
        backgroundColor: ink.surface,
        borderWidth: 1,
        borderColor: accent ? gold.tintAlt : ink.border,
      }}
    >
      <Text variant="label" style={{ flex: 1, fontSize: size.body }}>
        {label}
      </Text>
      {accent ? (
        <Text variant="eyebrow" color={gold.base}>
          Upgrade
        </Text>
      ) : (
        <Chevron />
      )}
    </Touchable>
  );
}
