import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";

import { Blade } from "@/components/blade";
import { Touchable } from "@/components/touchable";
import { Enter } from "@/components/motion";
import { Button, Screen, Text } from "@/components/ui";
import { BackButton } from "@/components/icon";
import { SAMPLE_ANSWERS } from "@/content/sample-answers";
import { useOnboarding } from "@/lib/onboarding-store";
import { green, indigo, ink, radius, size, space, text as textColor } from "@/theme/tokens";

/**
 * 03 · The Aha.
 *
 * The payoff screen — the first time a Master actually answers. The
 * choreography is deliberately slow here: the echo of the user's own words
 * lands first, then the Master's paragraphs arrive one at a time as if
 * being written, then the charge, and only afterwards the ask. Rushing this
 * screen would waste the one moment that sells the product.
 */
export default function AnswerScreen() {
  const router = useRouter();
  const { draft } = useOnboarding();

  const answer = draft.seedProblemSlug ? SAMPLE_ANSWERS[draft.seedProblemSlug] : undefined;

  // Typed problems have no authored answer — they need an account, which is
  // what the sign-in screen exists for.
  if (!answer) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: "center", gap: space.xl }}>
          <Enter preset="rise">
            <Text variant="display">A Master will answer that one properly.</Text>
          </Enter>
          <Enter preset="rise" delay={200}>
            <Text variant="lead">
              Your own words deserve a real reply, not a sample. That takes an account — it
              takes about ninety seconds.
            </Text>
          </Enter>
          <Enter preset="pop" delay={420}>
            <Button label="Build my dojo" onPress={() => router.push("/(onboarding)/carrying")} />
          </Enter>
        </View>
      </Screen>
    );
  }

  const paragraphs = answer.body.split("\n\n");

  return (
    <Screen>
      {/* Header — the Master, named. */}
      <Enter preset="drop">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: space.base,
            paddingVertical: space.lg,
          }}
        >
          <BackButton onPress={() => router.back()} />
          <View>
            <Text variant="title">{answer.masterName}</Text>
            <Text variant="caption">{answer.masterEra}</Text>
          </View>
        </View>
      </Enter>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: space.section }}>
        {/* The user's own words, echoed back. */}
        <Enter preset="slideRight" delay={120}>
          <View
            style={{
              alignSelf: "flex-end",
              maxWidth: "86%",
              backgroundColor: indigo.tint,
              borderRadius: radius.sheet,
              borderBottomRightRadius: space.sm,
              padding: space.xl,
            }}
          >
            <Text variant="label" style={{ fontSize: size.bodyLg }}>
              {answer.echo}
            </Text>
          </View>
        </Enter>

        {/* The answer, arriving a paragraph at a time. */}
        <View style={{ gap: space.xl }}>
          {paragraphs.map((para, i) => (
            <Enter key={i} preset="rise" delay={460 + i * 380}>
              <Text variant="voice">{para}</Text>
            </Enter>
          ))}
        </View>

        {/* The charge. */}
        <Enter preset="blade" delay={460 + paragraphs.length * 380 + 200}>
          <View
            style={{
              borderRadius: radius.card,
              backgroundColor: ink.surface,
              borderWidth: 1,
              borderColor: ink.border,
              padding: space.xl,
              gap: space.md,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <Blade state="active" length={14} delay={0} />
              <Text variant="eyebrow">Do this today</Text>
            </View>
            <Text variant="label" style={{ fontSize: size.bodyLg, lineHeight: size.bodyLg * 1.5 }}>
              {answer.action}
            </Text>
          </View>
        </Enter>

        <Enter preset="fade" delay={460 + paragraphs.length * 380 + 520}>
          <View style={{ flexDirection: "row", gap: space.base }}>
            <View style={{ flex: 1 }}>
              <Button label="I'll do it" variant="confirm" />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Too big" variant="secondary" />
            </View>
          </View>
        </Enter>
      </ScrollView>

      {/* The ask, last. */}
      <Enter preset="slideUp" delay={460 + paragraphs.length * 380 + 760}>
        <View style={{ paddingVertical: space.xxl, gap: space.md }}>
          <Text variant="caption" style={{ textAlign: "center" }}>
            That was 1 of 3 free answers. Keep them by making this yours.
          </Text>
          <Button label="Build my dojo" onPress={() => router.push("/(onboarding)/carrying")} />
          <Text variant="caption" style={{ textAlign: "center" }}>
            Takes about 90 seconds
          </Text>
        </View>
      </Enter>
    </Screen>
  );
}
