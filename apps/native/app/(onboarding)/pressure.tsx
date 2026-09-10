import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { BladeTick } from "@/components/blade";
import { OnboardingHeader } from "@/components/onboarding-header";
import { Enter, Stagger } from "@/components/motion";
import { Touchable } from "@/components/touchable";
import { Button, Screen, Text } from "@/components/ui";
import { Icon } from "@/components/icon";
import { PRESSURES, REMINDER_TIMES } from "@/content/onboarding-options";
import { useOnboarding } from "@/lib/onboarding-store";
import { indigo, ink, radius, size, space, text as textColor } from "@/theme/tokens";

/**
 * 06 · Set the pressure.
 *
 * The last question, and the one that changes the trials. Two decisions live
 * here, so they are laid out as two sections with a rule between them: the
 * intensity as a radio list, and the time as a row of three large chips.
 *
 * The screen scrolls. It did not, and on a shorter phone the content
 * overflowed its flex container, which is how the time row ended up painted
 * over the "Unbreakable" card (the chips themselves were also collapsing to
 * zero width; that was Touchable, fixed in A1).
 */

/** What each push time means, so "21:00" is not a riddle. */
const TIME_NAMES: Record<string, string> = {
  "06:00": "Dawn",
  "07:30": "Morning",
  "21:00": "Night before",
};

export default function PressureScreen() {
  const router = useRouter();
  const { draft, set } = useOnboarding();

  return (
    <Screen scroll>
      <OnboardingHeader step={4} />

      <View style={{ flex: 1, gap: space.section }}>
        <View style={{ gap: space.md }}>
          <Enter preset="rise" delay={140}>
            <Text variant="display">How hard should this be?</Text>
          </Enter>
          <Enter preset="rise" delay={300}>
            <Text variant="lead">You can change it any day. Most people start at Firm.</Text>
          </Enter>
        </View>

        {/* Intensity — a radio list: every row shows its ring, the chosen one is ticked. */}
        <Stagger initialDelay={460} step={130} style={{ gap: space.base }}>
          {PRESSURES.map((option) => {
            const picked = draft.pressure === option.value;
            return (
              <Enter key={option.value} preset="flip">
                <Touchable
                  feel="row"
                  accessibilityRole="radio"
                  accessibilityState={{ checked: picked }}
                  onPress={() => set({ pressure: option.value })}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space.base,
                    padding: space.xl,
                    borderRadius: radius.card,
                    backgroundColor: picked ? indigo.tint : ink.surface,
                    borderWidth: picked ? 1.5 : 1,
                    borderColor: picked ? indigo.base : ink.border,
                  }}
                >
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text variant="title" style={{ fontSize: size.lead }}>
                      {option.label}
                    </Text>
                    <Text variant="caption" color={picked ? textColor.body : undefined}>
                      {option.detail}
                    </Text>
                  </View>
                  <BladeTick done={picked} size={24} />
                </Touchable>
              </Enter>
            );
          })}
        </Stagger>

        {/* Time — its own section, below a rule, so it cannot read as part of the list above. */}
        <Enter
          preset="slideUp"
          delay={900}
          style={{
            gap: space.base,
            paddingTop: space.section,
            borderTopWidth: 1,
            borderTopColor: ink.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <Icon name="alarm-outline" size={18} color={indigo.light} />
            <Text variant="eyebrow" color={indigo.light}>
              When we push you
            </Text>
          </View>
          <Text variant="caption">Your Master&apos;s daily message arrives at this time.</Text>

          <View style={{ flexDirection: "row", gap: space.md }}>
            {REMINDER_TIMES.map((time) => {
              const picked = draft.morningReminder === time;
              return (
                <Touchable
                  key={time}
                  feel="chip"
                  accessibilityRole="radio"
                  accessibilityState={{ checked: picked }}
                  accessibilityLabel={`${TIME_NAMES[time] ?? ""} ${time}`}
                  onPress={() => set({ morningReminder: time })}
                  style={{
                    flex: 1,
                    minHeight: 72,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                    paddingVertical: space.base,
                    paddingHorizontal: space.sm,
                    borderRadius: radius.card,
                    backgroundColor: picked ? indigo.tint : ink.surface,
                    borderWidth: picked ? 1.5 : 1,
                    borderColor: picked ? indigo.base : ink.border,
                  }}
                >
                  {picked ? (
                    <View style={{ position: "absolute", top: 6, right: 6 }}>
                      <BladeTick done size={18} />
                    </View>
                  ) : null}
                  <Text
                    variant="title"
                    color={picked ? textColor.primary : textColor.body}
                    style={{ fontSize: size.lead }}
                  >
                    {time}
                  </Text>
                  <Text variant="caption" color={picked ? indigo.light : textColor.faintest}>
                    {TIME_NAMES[time] ?? ""}
                  </Text>
                </Touchable>
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
