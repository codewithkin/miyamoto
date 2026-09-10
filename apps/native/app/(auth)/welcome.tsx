import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { Blade } from "@/components/blade";
import { Animated, Enter, usePulse } from "@/components/motion";
import { Button, Screen, Text } from "@/components/ui";
import { alpha, ink, radius, red, size, space, text as textColor, tracking } from "@/theme/tokens";
import { MASTER_COUNT_TITLE } from "@/content/onboarding-options";

/**
 * 01 · Welcome.
 *
 * Nothing arrives together. The panel establishes first, the live chip
 * streaks in over it, the hero lands, the promise follows, and only then do
 * the two choices appear — so the eye is walked down the screen instead of
 * being handed a finished page.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const livePulse = usePulse(true);

  return (
    <Screen>
      <View style={{ flex: 1, gap: space.xxl, paddingTop: space.lg }}>
        {/* The looping proof panel. */}
        <Enter preset="zoom" style={{ flex: 1 }}>
          <View
            style={{
              flex: 1,
              borderRadius: radius.panel,
              backgroundColor: "#221E2C",
              padding: space.xxl,
              justifyContent: "space-between",
            }}
          >
            <Enter preset="streak" delay={340} style={{ alignSelf: "flex-start" }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: space.sm,
                  paddingVertical: space.sm,
                  paddingHorizontal: space.base,
                  borderRadius: radius.pill,
                  backgroundColor: alpha.chip,
                }}
              >
                <Animated.View
                  style={[
                    { width: 7, height: 7, borderRadius: 4, backgroundColor: red.base },
                    livePulse,
                  ]}
                />
                <Text variant="label" color={textColor.body}>
                  Playing
                </Text>
              </View>
            </Enter>

            <Enter preset="fade" delay={560}>
              <Text
                style={{
                  fontSize: size.eyebrow,
                  letterSpacing: size.eyebrow * tracking.mono,
                  color: "#A9A6C8",
                  textAlign: "center",
                  lineHeight: size.eyebrow * 1.6,
                }}
              >
                looping 8s video — a user typing a real problem{"\n"}and a Master answering
              </Text>
            </Enter>

            {/* Three marks, dealt one at a time. */}
            <View style={{ flexDirection: "row", gap: space.xxs }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{ flex: 1 }}>
                  <Blade
                    state={i === 0 ? "complete" : "empty"}
                    delay={700 + i * 90}
                    style={{ width: "100%" }}
                  />
                </View>
              ))}
            </View>
          </View>
        </Enter>

        <View style={{ gap: space.md }}>
          <Enter preset="rise" delay={220}>
            <Text variant="hero">Bring the worst part of your week.</Text>
          </Enter>

          <Enter preset="rise" delay={400}>
            <Text variant="lead">
              {MASTER_COUNT_TITLE} people who survived worse will tell you what they&apos;d do — and give you one
              thing to do today.
            </Text>
          </Enter>
        </View>
      </View>

      <View style={{ paddingVertical: space.xxl, gap: space.base }}>
        <Enter preset="pop" delay={660}>
          <Button
            label="Try it — no account"
            onPress={() => router.push("/(onboarding)/problem")}
          />
        </Enter>

        <Enter preset="fade" delay={820}>
          <Button
            label="I already have one"
            variant="ghost"
            onPress={() => router.push("/sign-in")}
          />
        </Enter>
      </View>
    </Screen>
  );
}
