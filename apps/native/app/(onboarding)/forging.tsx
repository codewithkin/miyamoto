import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { Blade, BladeTick } from "@/components/blade";
import { Animated, Enter, useFlicker } from "@/components/motion";
import { Screen, Text } from "@/components/ui";
import { MASTERS, PRESSURES } from "@/content/onboarding-options";
import { useOnboarding } from "@/lib/onboarding-store";
import { gold, ink, radius, size, space, text as textColor } from "@/theme/tokens";

/**
 * 07 · Forging your 30 days.
 *
 * A ritual screen, not a spinner. Each line of work checks itself off on a
 * real beat so the wait reads as something being made for you — and the
 * lines say what was actually used, so the claim is true rather than
 * theatre.
 */

const STEP_MS = 1100;

export default function ForgingScreen() {
  const router = useRouter();
  const { draft } = useOnboarding();
  const flame = useFlicker(true);

  const master = MASTERS.find((m) => m.slug === draft.firstMaster);
  const pressure = PRESSURES.find((p) => p.value === draft.pressure);
  const trialCount = draft.pressure === "UNBREAKABLE" ? 30 : draft.pressure === "FIRM" ? 16 : 10;

  const steps = React.useMemo(
    () => [
      `Matched ${draft.wounds.length} ${draft.wounds.length === 1 ? "wound" : "wounds"} to Act I`,
      `Chose ${trialCount} trials at ${pressure?.label ?? "Firm"} pressure`,
    ],
    [draft.wounds.length, trialCount, pressure],
  );

  const [done, setDone] = React.useState(0);

  React.useEffect(() => {
    const timers = steps.map((_, i) =>
      setTimeout(() => setDone((d) => Math.max(d, i + 1)), STEP_MS * (i + 1)),
    );
    const advance = setTimeout(
      () => router.replace("/(onboarding)/payoff"),
      STEP_MS * (steps.length + 2),
    );
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(advance);
    };
  }, [steps, router]);

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", gap: space.screen }}>
        <View style={{ gap: space.base, alignItems: "center" }}>
          <Animated.View style={flame}>
            <Blade state="active" length={40} thickness={6} />
          </Animated.View>

          <Enter preset="zoomSpin" delay={120}>
            <Text variant="display" style={{ textAlign: "center" }}>
              Forging your 30 days…
            </Text>
          </Enter>

          <Enter preset="fade" delay={520}>
            <Text variant="lead" style={{ textAlign: "center" }}>
              {master?.name ?? "Your Master"} is picking the first trial from what you told us.
            </Text>
          </Enter>
        </View>

        {/* Work checking itself off. */}
        <View style={{ gap: space.base }}>
          {steps.map((step, i) => (
            <Enter key={step} preset="slideLeft" delay={STEP_MS * (i + 1) - 300}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.base }}>
                <BladeTick done={done > i} />
                <Text
                  variant="label"
                  color={done > i ? textColor.body : textColor.faintest}
                  style={{ fontSize: size.body }}
                >
                  {step}
                </Text>
              </View>
            </Enter>
          ))}

          <Enter preset="fade" delay={STEP_MS * (steps.length + 1) - 300}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.base }}>
              <Blade state="active" length={18} />
              <Text variant="label" color={textColor.muted} style={{ fontSize: size.body }}>
                Writing your Day 1 story…
              </Text>
            </View>
          </Enter>
        </View>

        <Enter preset="fade" delay={900}>
          <Text variant="caption" style={{ textAlign: "center" }}>
            A few seconds. Don&apos;t close the app.
          </Text>
        </Enter>
      </View>

      {/* The founder's note, last and quietest. */}
      <Enter preset="slideUp" delay={1600}>
        <View
          style={{
            marginBottom: space.xxl,
            padding: space.xl,
            borderRadius: radius.card,
            backgroundColor: gold.tint,
            borderWidth: 1,
            borderColor: gold.tintAlt,
            gap: space.sm,
          }}
        >
          <Text variant="voice" style={{ fontSize: size.body }}>
            I built this after the worst year of my life. It&apos;s the coach I wanted at 5am, and
            nobody was awake.
          </Text>
          <Text variant="caption" color={gold.base}>
            — Kin, founder
          </Text>
        </View>
      </Enter>
    </Screen>
  );
}
