import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";

import { Blade } from "@/components/blade";
import { Enter } from "@/components/motion";
import { Button, Screen, Text } from "@/components/ui";
import { BackButton } from "@/components/icon";
import { MasterAvatar } from "@/components/master-avatar";
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

  // Typed problems have no authored answer. The claim turns them into the
  // title of the first thread with the user's Master, so the honest promise
  // is that it will be waiting in the dojo — they are already signed in.
  if (!answer) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: "center", gap: space.xl }}>
          <Enter preset="rise">
            <Text variant="display">A Master will answer that one properly.</Text>
          </Enter>
          <Enter preset="rise" delay={200}>
            <Text variant="lead">
              Your own words deserve a real reply, not a sample. Three more questions and it
              will be the first thing waiting in your dojo, ready to ask.
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
          <MasterAvatar slug={answer.masterSlug} name={answer.masterName} size={44} active />
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

      </ScrollView>

      {/* The ask, last. */}
      <Enter preset="slideUp" delay={460 + paragraphs.length * 380 + 760}>
        <View style={{ paddingVertical: space.xxl, gap: space.md }}>
          <Text variant="caption" style={{ textAlign: "center" }}>
            That was a sample. Build your dojo and they answer your own words — three a day, free.
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
