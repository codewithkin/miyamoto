import "@/polyfills";
import "@/global.css";
import { focusManager, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import React from "react";
import { AppState, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { AppThemeProvider } from "@/contexts/app-theme-context";
import { authClient } from "@/lib/auth-client";
import { ink } from "@/theme/tokens";
import { OnboardingProvider } from "@/lib/onboarding-store";
import { PurchasesProvider } from "@/lib/purchases";
import { TelemetryProvider } from "@/lib/telemetry";
import { queryClient } from "@/utils/trpc";

export const unstable_settings = {
  // "/" is the app shell, and its layout is the gate that decides between
  // welcome, onboarding and the app (D-038).
  initialRouteName: "(app)",
};

function StackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: ink.base },
        animation: "fade",
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="story/[slug]" />
      <Stack.Screen name="masters" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="export-data" />
      <Stack.Screen name="delete-account" />
      {/* The paywall rises from the bottom — it interrupts, it does not
          continue the journey sideways. */}
      <Stack.Screen name="paywall" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
    </Stack>
  );
}

/**
 * Coming back to the app counts as focus, the way returning to a browser tab
 * does. React Query can't see that on its own in React Native. Without it,
 * someone who left the app overnight came back to yesterday's Path, streak
 * and counter until they happened to change screens. Stale queries refetch
 * when the app becomes active.
 */
function useRefetchOnReturn() {
  React.useEffect(() => {
    if (Platform.OS === "web") return;
    const subscription = AppState.addEventListener("change", (state) => {
      focusManager.setFocused(state === "active");
    });
    return () => subscription.remove();
  }, []);
}

/**
 * Everything cached belongs to the account that fetched it. When the account
 * changes (signed out, or a different one signed in on this phone), the
 * cache is dropped. Otherwise the next account's gate read the last one's
 * onboarding status, and its screens showed the last one's Path, until
 * each query happened to refetch.
 */
function useCacheBelongsToOneAccount() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const previous = React.useRef(userId);
  React.useEffect(() => {
    if (previous.current && previous.current !== userId) queryClient.clear();
    previous.current = userId;
  }, [userId]);
}

export default function Layout() {
  useRefetchOnReturn();
  useCacheBelongsToOneAccount();
  return (
    <TelemetryProvider>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <AppThemeProvider>
              <PurchasesProvider>
                <OnboardingProvider>
                  <StackLayout />
                </OnboardingProvider>
              </PurchasesProvider>
            </AppThemeProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </TelemetryProvider>
  );
}
