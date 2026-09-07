import { Stack } from "expo-router";

import { ink } from "@/theme/tokens";

/**
 * The onboarding stack.
 *
 * Screens push horizontally so the twelve steps read as one continuous
 * movement forward, and each screen then runs its own per-element
 * choreography on arrival — see the Enter/Stagger usage in each route.
 */
export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: ink.base },
        animation: "slide_from_right",
        animationDuration: 320,
        gestureEnabled: true,
      }}
    />
  );
}
