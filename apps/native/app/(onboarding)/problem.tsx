import { useRouter } from "expo-router";
import React from "react";
import { TextInput, View } from "react-native";

import { BladeTick } from "@/components/blade";
import { Enter, Stagger } from "@/components/motion";
import { Touchable } from "@/components/touchable";
import { Button, Screen, Text } from "@/components/ui";
import { useOnboarding } from "@/lib/onboarding-store";
import { ink, indigo, radius, size, space, text as textColor } from "@/theme/tokens";

/**
 * 02 · Try it first.
 *
 * The four sample problems are fixed, which is what lets this screen keep
 * the design's "no account" promise: each one has an authored answer waiting
 * on the next screen, so nothing is generated and no quota is spent before
 * the user has an identity. Typing your own is the path that needs an
 * account, and says so.
 */

const SAMPLES = [
  { slug: "passed-over", label: "I got passed over at work", master: "musashi" },
  { slug: "betrayed", label: "Someone I trusted lied", master: "seneca" },
  { slug: "procrastinating", label: "I keep putting off one thing", master: "curie" },
  { slug: "scared-conversation", label: "I'm scared of a conversation", master: "seneca" },
] as const;

const MASTER_NAMES: Record<string, string> = {
  musashi: "Musashi",
  curie: "Curie",
  seneca: "Seneca",
};

export default function ProblemScreen() {
  const router = useRouter();
  const { draft, set } = useOnboarding();
  const [typed, setTyped] = React.useState("");

  const selected = SAMPLES.find((s) => s.slug === draft.seedProblemSlug) ?? null;
  const master = selected ? MASTER_NAMES[selected.master] : null;
  const canContinue = Boolean(selected) || typed.trim().length > 0;

  function choose(slug: string, label: string) {
    set({ seedProblemSlug: slug, seedProblem: label });
    setTyped("");
  }

  return (
    <Screen>
      <Enter preset="drop" delay={0}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: space.lg,
          }}
        >
          {/* No back arrow: this is the first screen after sign-in, and behind
              it is only the sign-in screen, which would bounce a signed-in user
              straight back here through the gate. */}
          <View />
          <Touchable feel="row" onPress={() => router.push("/(onboarding)/carrying")} hitSlop={12}>
            <Text variant="label" color={textColor.muted}>
              Skip
            </Text>
          </Touchable>
        </View>
      </Enter>

      <View style={{ flex: 1, gap: space.section }}>
        <View style={{ gap: space.md }}>
          <Enter preset="rise" delay={120}>
            <Text variant="display">What&apos;s sitting on your chest right now?</Text>
          </Enter>
          <Enter preset="rise" delay={280}>
            <Text variant="lead">Pick one. You&apos;ll get a real answer in ten seconds.</Text>
          </Enter>
        </View>

        {/* Each row rolls in on its own beat. */}
        <Stagger initialDelay={420} step={90} style={{ gap: space.md }}>
          {SAMPLES.map((sample) => {
            const isSelected = draft.seedProblemSlug === sample.slug;
            return (
              <Enter key={sample.slug} preset="roll">
                <Touchable
                  feel="row"
                  onPress={() => choose(sample.slug, sample.label)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space.base,
                    padding: space.xl,
                    borderRadius: radius.card,
                    backgroundColor: isSelected ? indigo.tint : ink.surface,
                    borderWidth: 1,
                    borderColor: isSelected ? indigo.base : ink.border,
                  }}
                >
                  <Text variant="label" style={{ flex: 1, fontSize: size.bodyLg }}>
                    {sample.label}
                  </Text>
                  {isSelected ? (
                    <BladeTick done />
                  ) : (
                    <Text variant="title" color={textColor.faintest}>
                      ›
                    </Text>
                  )}
                </Touchable>
              </Enter>
            );
          })}
        </Stagger>

        <Enter preset="fade" delay={880} style={{ gap: space.md }}>
          <Text variant="caption">
            Or type it in your own words — the Masters prefer that.
          </Text>
          <TextInput
            value={typed}
            onChangeText={(v) => {
              setTyped(v);
              if (v.trim()) set({ seedProblemSlug: null, seedProblem: v });
            }}
            placeholder="In your own words…"
            placeholderTextColor={textColor.faintest}
            multiline
            style={{
              minHeight: 72,
              borderRadius: radius.card,
              backgroundColor: ink.high,
              borderWidth: 1,
              borderColor: ink.border,
              padding: space.xl,
              color: textColor.body,
              fontSize: size.body,
            }}
          />
        </Enter>
      </View>

      <View style={{ paddingVertical: space.xxl }}>
        <Enter preset="pop" delay={1000}>
          <Button
            label={master ? `Hear what ${master} says` : "Hear what a Master says"}
            disabled={!canContinue}
            onPress={() => router.push("/(onboarding)/answer")}
          />
        </Enter>
      </View>
    </Screen>
  );
}
