import { useRouter } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";

import { BladeRail, BladeTick } from "@/components/blade";
import { Enter, Stagger } from "@/components/motion";
import { Button, Screen, Text } from "@/components/ui";
import { MASTERS } from "@/content/onboarding-options";
import { useOnboarding } from "@/lib/onboarding-store";
import { indigo, ink, radius, size, space, text as textColor } from "@/theme/tokens";

/**
 * 05 · Who speaks first.
 *
 * Only Masters available from Day 1 are offered — choosing someone locked
 * behind Day 14 as your *first* voice would be a promise the Path then
 * breaks. Rows swing in from the left one at a time.
 */
export default function MasterScreen() {
  const router = useRouter();
  const { draft, set } = useOnboarding();

  const choices = MASTERS.filter((m) => !m.proOnly && m.unlockDay === null).concat(
    MASTERS.filter((m) => !m.proOnly && m.unlockDay !== null),
  );

  const chosen = MASTERS.find((m) => m.slug === draft.firstMaster) ?? null;

  return (
    <Screen>
      <Enter preset="drop">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: space.base,
            paddingVertical: space.lg,
          }}
        >
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text variant="title" color={textColor.muted}>
              ←
            </Text>
          </Pressable>
          <Text variant="eyebrow">3/4</Text>
          <View style={{ flex: 1 }}>
            <BladeRail count={4} progress={3} activeIndex={2} delay={200} step={70} />
          </View>
        </View>
      </Enter>

      <View style={{ flex: 1, gap: space.section }}>
        <View style={{ gap: space.md }}>
          <Enter preset="rise" delay={140}>
            <Text variant="display">Who should take your first question?</Text>
          </Enter>
          <Enter preset="rise" delay={300}>
            <Text variant="lead">
              They write, they don&apos;t talk. Pick the hand you&apos;ll actually read.
            </Text>
          </Enter>
        </View>

        <Stagger initialDelay={460} step={110} style={{ gap: space.base }}>
          {choices.map((master) => {
            const picked = draft.firstMaster === master.slug;
            const locked = master.unlockDay !== null;
            return (
              <Enter key={master.slug} preset="swing">
                <Pressable
                  disabled={locked}
                  onPress={() => set({ firstMaster: master.slug })}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space.base,
                    padding: space.xl,
                    borderRadius: radius.card,
                    backgroundColor: picked ? indigo.tint : ink.surface,
                    borderWidth: 1,
                    borderColor: picked ? indigo.base : ink.border,
                    opacity: locked ? 0.45 : pressed ? 0.85 : 1,
                  })}
                >
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text variant="title" style={{ fontSize: size.lead }}>
                      {master.name}
                    </Text>
                    <Text variant="caption">{master.domains}</Text>
                    <Text variant="caption" color={textColor.faintest}>
                      {master.manner}
                    </Text>
                  </View>
                  {locked ? (
                    <Text variant="eyebrow">Day {master.unlockDay}</Text>
                  ) : picked ? (
                    <BladeTick done />
                  ) : (
                    <Text variant="title" color={textColor.faintest}>
                      ›
                    </Text>
                  )}
                </Pressable>
              </Enter>
            );
          })}
        </Stagger>
      </View>

      <View style={{ paddingVertical: space.xxl }}>
        <Enter preset="pop" delay={980}>
          <Button
            label={chosen ? `${chosen.name} it is` : "Choose a Master"}
            disabled={!chosen}
            onPress={() => router.push("/(onboarding)/pressure")}
          />
        </Enter>
      </View>
    </Screen>
  );
}
