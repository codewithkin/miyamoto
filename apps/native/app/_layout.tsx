import "@/polyfills";
import "@/global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { AppThemeProvider } from "@/contexts/app-theme-context";
import { ink } from "@/theme/tokens";
import { OnboardingProvider } from "@/lib/onboarding-store";
import { PurchasesProvider } from "@/lib/purchases";
import { queryClient } from "@/utils/trpc";

export const unstable_settings = {
  // "/" is the app shell, and its layout is the gate that decides between
  // welcome, onboarding and the app (D-033).
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

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <AppThemeProvider>
            <HeroUINativeProvider>
              <PurchasesProvider>
                <OnboardingProvider>
                  <StackLayout />
                </OnboardingProvider>
              </PurchasesProvider>
            </HeroUINativeProvider>
          </AppThemeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
