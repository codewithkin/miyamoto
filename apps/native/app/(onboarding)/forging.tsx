import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { Blade, BladeTick } from "@/components/blade";
import { MasterAvatar } from "@/components/master-avatar";
import { Animated, Enter, MotionTone, useFlicker } from "@/components/motion";
import { Screen, Text } from "@/components/ui";
import { MASTERS, PRESSURES } from "@/content/onboarding-options";
import { useFirstWeek } from "@/lib/use-first-week";
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

function ForgingScreenBody() {
  const router = useRouter();
  const { draft } = useOnboarding();
  const flame = useFlicker(true);
  // Fetches the week while the forge plays, so payoff, the first-week
  // screen and the reminder preview open with the real Day 1 already in
  // hand (plan 11). No effect on this screen.
  useFirstWeek();

  const master = MASTERS.find((m) => m.slug === draft.firstMaster);
  const pressure = PRESSURES.find((p) => p.value === draft.pressure);

  // Two lines, true ones (plan 11). They used to say "Matched 3 wounds to
  // Act I" and "Chose 16 trials at Firm pressure" — but the Path is authored
  // and is thirty trials at every pressure, one a day; pressure sets how hard
  // each day is, not how many. Still two steps, so the sequence's timing
  // (STEP_MS per step) is exactly what it was.
  const steps = React.useMemo(
    () => [
      `Noted your ${draft.wounds.length} ${draft.wounds.length === 1 ? "wound" : "wounds"}`,
      `Set 30 days at ${pressure?.label ?? "Firm"} pressure`,
    ],
    [draft.wounds.length, pressure],
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
            <View style={{ alignItems: "center", gap: space.md }}>
              {master ? <MasterAvatar slug={master.slug} name={master.name} size={44} active /> : null}
              <Text variant="lead" style={{ textAlign: "center" }}>
                {master?.name ?? "Your Master"} is setting out your first trial.
              </Text>
            </View>
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

/**
 * Kept on the expressive motion tone at the owner's request. One of three
 * screens — this and the two paywalls — where the original choreography
 * survives the restraint pass (D-036).
 */
export default function ForgingScreen() {
  return (
    <MotionTone value="expressive">
      <ForgingScreenBody />
    </MotionTone>
  );
}
