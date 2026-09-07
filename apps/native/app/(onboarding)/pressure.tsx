import { useRouter } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";

import { BladeRail, BladeTick } from "@/components/blade";
import { Enter, Stagger } from "@/components/motion";
import { Button, Screen, Text } from "@/components/ui";
import { PRESSURES, REMINDER_TIMES } from "@/content/onboarding-options";
import { useOnboarding } from "@/lib/onboarding-store";
import { indigo, ink, radius, size, space, text as textColor } from "@/theme/tokens";

/**
 * 06 · Set the pressure.
 *
 * The last question, and the one that changes the trials. Options flip in
 * face-up; the reminder row slides up underneath once the choice is made,
 * because the time only matters after the intensity is set.
 */
export default function PressureScreen() {
  const router = useRouter();
  const { draft, set } = useOnboarding();

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
          <Text variant="eyebrow">4/4</Text>
          <View style={{ flex: 1 }}>
            <BladeRail count={4} progress={4} activeIndex={3} delay={200} step={70} />
          </View>
        </View>
      </Enter>

      <View style={{ flex: 1, gap: space.section }}>
        <View style={{ gap: space.md }}>
          <Enter preset="rise" delay={140}>
            <Text variant="display">How hard should this be?</Text>
          </Enter>
          <Enter preset="rise" delay={300}>
            <Text variant="lead">You can change it any day. Most people start at Firm.</Text>
          </Enter>
        </View>

        <Stagger initialDelay={460} step={130} style={{ gap: space.base }}>
          {PRESSURES.map((option) => {
            const picked = draft.pressure === option.value;
            return (
              <Enter key={option.value} preset="flip">
                <Pressable
                  onPress={() => set({ pressure: option.value })}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space.base,
                    padding: space.xl,
                    borderRadius: radius.card,
                    backgroundColor: picked ? indigo.tint : ink.surface,
                    borderWidth: 1,
                    borderColor: picked ? indigo.base : ink.border,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text variant="title" style={{ fontSize: size.lead }}>
                      {option.label}
                    </Text>
                    <Text variant="caption">{option.detail}</Text>
                  </View>
                  {picked ? <BladeTick done /> : null}
                </Pressable>
              </Enter>
            );
          })}
        </Stagger>

        {/* The time only matters once the intensity is chosen. */}
        <Enter preset="slideUp" delay={900} style={{ gap: space.base }}>
          <Text variant="eyebrow">When we push you</Text>
          <View style={{ flexDirection: "row", gap: space.md }}>
            {REMINDER_TIMES.map((time) => {
              const picked = draft.morningReminder === time;
              return (
                <Pressable
                  key={time}
                  onPress={() => set({ morningReminder: time })}
                  style={({ pressed }) => ({
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: space.base,
                    borderRadius: radius.pill,
                    backgroundColor: picked ? indigo.base : ink.surface,
                    borderWidth: 1,
                    borderColor: picked ? indigo.bright : ink.border,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text
                    variant="label"
                    color={picked ? textColor.primary : textColor.muted}
                    style={{ fontSize: size.body }}
                  >
                    {time}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Enter>
      </View>

      <View style={{ paddingVertical: space.xxl }}>
        <Enter preset="pop" delay={1060}>
          <Button label="Build my 30 days" onPress={() => router.push("/(onboarding)/forging")} />
        </Enter>
      </View>
    </Screen>
  );
}
