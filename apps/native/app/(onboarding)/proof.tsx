import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { Enter, Stagger } from "@/components/motion";
import { Button, Screen, Text } from "@/components/ui";
import { gold, indigo, ink, radius, size, space, text as textColor } from "@/theme/tokens";

/**
 * 09 · Social proof.
 *
 * The count lands first and hard, then the two quotes roll in from opposite
 * sides so they read as two different people rather than one block of copy.
 */

const TESTIMONIALS = [
  {
    quote:
      "Day 9 was 'send the email you're scared of'. I sent it. Got the meeting.",
    who: "Tomás",
    detail: "finished the 30 days",
    preset: "roll" as const,
  },
  {
    quote:
      "It doesn't comfort me. That's exactly why I opened it 26 mornings straight.",
    who: "Aisha",
    detail: "Bushido score 812",
    preset: "streak" as const,
  },
];

export default function ProofScreen() {
  const router = useRouter();

  return (
    <Screen scroll>
      <View style={{ flex: 1, gap: space.section, paddingTop: space.screen }}>
        <View style={{ gap: space.base, alignItems: "center" }}>
          <Enter preset="bounce">
            <View
              style={{
                paddingVertical: space.sm,
                paddingHorizontal: space.xl,
                borderRadius: radius.pill,
                backgroundColor: indigo.tint,
                borderWidth: 1,
                borderColor: indigo.base,
              }}
            >
              <Text variant="eyebrow" color={indigo.light}>
                +10k
              </Text>
            </View>
          </Enter>

          <Enter preset="zoomUp" delay={260}>
            <Text variant="display" style={{ textAlign: "center" }}>
              10,431 people are on a trial right now.
            </Text>
          </Enter>
        </View>

        <Stagger initialDelay={620} step={220} style={{ gap: space.base }}>
          {TESTIMONIALS.map((t) => (
            <Enter key={t.who} preset={t.preset}>
              <View
                style={{
                  padding: space.xl,
                  borderRadius: radius.card,
                  backgroundColor: ink.surface,
                  borderWidth: 1,
                  borderColor: ink.border,
                  gap: space.md,
                }}
              >
                <Text variant="voice" style={{ fontSize: size.bodyLg }}>
                  &ldquo;{t.quote}&rdquo;
                </Text>
                <Text variant="caption">
                  {t.who} · {t.detail}
                </Text>
              </View>
            </Enter>
          ))}
        </Stagger>

        <Enter preset="fade" delay={1140}>
          <View style={{ alignItems: "center", gap: space.xs }}>
            <Text variant="numeral" color={gold.base}>
              4.8
            </Text>
            <Text variant="caption" style={{ textAlign: "center" }}>
              from 2,140 ratings · &ldquo;the only app that asks something of me&rdquo;
            </Text>
          </View>
        </Enter>
      </View>

      <View style={{ paddingVertical: space.xxl }}>
        <Enter preset="pop" delay={1340}>
          <Button label="Start Day 1" onPress={() => router.push("/(onboarding)/reminders")} />
        </Enter>
      </View>
    </Screen>
  );
}
