import { useQuery } from "@tanstack/react-query";
import { Redirect, Stack } from "expo-router";

import { authClient } from "@/lib/auth-client";
import { useOnboarding } from "@/lib/onboarding-store";
import { ink } from "@/theme/tokens";
import { trpc } from "@/utils/trpc";

/**
 * The onboarding stack: one screen, the first question (D-048). Reached only
 * with a session (D-038).
 *
 * Signed out, it sends the user to welcome. Already onboarded (claimed on the
 * server, or finished on this device and waiting to be claimed), it sends
 * them to the chat, so onboarding can't be re-entered by the back gesture or a
 * stale deep link. The chat, not the Path: it's where the question they just
 * answered lands, so a redirect racing the problem screen's own navigation
 * still ends in the right place.
 */
export default function OnboardingLayout() {
  const { data: session, isPending } = authClient.useSession();
  const { draft } = useOnboarding();

  const status = useQuery({
    ...trpc.onboarding.status.queryOptions(),
    enabled: Boolean(session),
  });

  if (isPending) return null;
  if (!session) return <Redirect href="/welcome" />;
  if (draft.finishedAt || status.data?.claimed) return <Redirect href="/(app)/chat" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: ink.base },
        animation: "fade",
        animationDuration: 200,
        gestureEnabled: true,
      }}
    />
  );
}
