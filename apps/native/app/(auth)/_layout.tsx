import { Redirect, Stack } from "expo-router";

import { authClient } from "@/lib/auth-client";
import { ink } from "@/theme/tokens";

/**
 * Welcome and sign-in — the only two screens a signed-out person can reach.
 *
 * Anyone with a session is sent to "/", the app shell, whose layout is the
 * gate that decides between onboarding and the app. This group never makes
 * that decision itself, so there is one place to change it.
 */
export default function AuthLayout() {
  const { data: session } = authClient.useSession();

  // Not waiting on isPending: a visitor should see the welcome screen at once,
  // and the redirect only fires once a session is actually known.
  if (session) return <Redirect href="/" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: ink.base },
        animation: "fade",
        animationDuration: 200,
      }}
    />
  );
}
