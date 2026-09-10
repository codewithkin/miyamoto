import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { BladeRail } from "@/components/blade";
import { BackButton } from "@/components/icon";
import { Enter } from "@/components/motion";
import { Text } from "@/components/ui";
import { space, text as textColor } from "@/theme/tokens";

/** The quiz: problem, carrying, master, pressure. */
const STEPS = 4;

/**
 * The top of each quiz step: back, where you are, how far is left.
 *
 * It was the same twelve lines pasted into three screens — and the first
 * step (problem) had none of it, only a "Skip", so the quiz never said it
 * had four parts until the second. One component, so the four steps can't
 * drift apart again.
 *
 * `back` is off on the first step: behind it is only welcome, which bounces
 * a signed-in person straight back here through the gate.
 */
export function OnboardingHeader({
  step,
  back = true,
  trailing,
}: {
  step: 1 | 2 | 3 | 4;
  back?: boolean;
  /** Anything at the far right — the first step's "Skip". */
  trailing?: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <Enter preset="drop">
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: space.base,
          paddingVertical: space.lg,
          minHeight: 44 + space.lg * 2,
        }}
      >
        {back ? <BackButton onPress={() => router.back()} /> : null}
        <Text variant="eyebrow" color={textColor.secondary}>
          Step {step} of {STEPS}
        </Text>
        <View style={{ flex: 1 }}>
          <BladeRail
            count={STEPS}
            progress={step}
            activeIndex={step - 1}
            delay={200}
            step={70}
          />
        </View>
        {trailing}
      </View>
    </Enter>
  );
}
