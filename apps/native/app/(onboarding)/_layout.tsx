import { Redirect, Stack } from "expo-router";

import { authClient } from "@/lib/auth-client";
import { ink } from "@/theme/tokens";

/**
 * The onboarding stack.
 *
 * Screens push horizontally so the twelve steps read as one continuous
 * movement forward, and each screen then runs its own per-element
 * choreography on arrival — see the Enter/Stagger usage in each route.
 */
export default function OnboardingLayout() {
  const { data: session } = authClient.useSession();

  // A returning user has no business on the welcome screen. Visitors are not
  // made to wait on the session check — the quiz renders at once, and the
  // redirect only fires once a session is actually known.
  if (session) return <Redirect href="/(app)" />;

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
