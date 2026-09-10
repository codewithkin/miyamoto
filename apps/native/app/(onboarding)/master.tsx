import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { Blade, BladeRail, BladeTick } from "@/components/blade";
import { Touchable } from "@/components/touchable";
import { Enter, Stagger } from "@/components/motion";
import { Button, Screen, Text } from "@/components/ui";
import { BackButton } from "@/components/icon";
import { MASTERS, inWords } from "@/content/onboarding-options";
import { useOnboarding } from "@/lib/onboarding-store";
import { gold, indigo, ink, radius, size, space, text as textColor } from "@/theme/tokens";

/**
 * 05 · Who speaks first.
 *
 * Only Musashi is unlocked at the start, so this is not a picker — it is
 * the ladder. Showing the ones you have not earned, with the day each
 * arrives, is the point: it is the first place the app tells you that
 * access is something you work towards rather than something you choose.
 *
 * The rows are still rendered from MASTERS, so unlocking someone later is a
 * data change and not a screen rewrite.
 */
export default function MasterScreen() {
  const router = useRouter();
  const { draft, set } = useOnboarding();

  const available = MASTERS.filter((m) => !m.proOnly && m.unlockDay === null);
  const locked = MASTERS.filter((m) => m.proOnly || m.unlockDay !== null).sort(
    (a, b) => (a.unlockDay ?? 99) - (b.unlockDay ?? 99),
  );
  const starter = available[0];

  // There is only one hand available, so claim it rather than making the
  // user tap a choice that has no alternative.
  React.useEffect(() => {
    if (starter && draft.firstMaster !== starter.slug) set({ firstMaster: starter.slug });
  }, [starter, draft.firstMaster, set]);

  return (
    <Screen scroll>
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
          <Text variant="eyebrow">3/4</Text>
          <View style={{ flex: 1 }}>
            <BladeRail count={4} progress={3} activeIndex={2} delay={200} step={70} />
          </View>
        </View>
      </Enter>

      <View style={{ flex: 1, gap: space.section }}>
        <View style={{ gap: space.md }}>
          <Enter preset="rise" delay={140}>
            <Text variant="display">{starter?.name ?? "Musashi"} takes your first question.</Text>
          </Enter>
          <Enter preset="rise" delay={300}>
            <Text variant="lead">
              He writes, he doesn&apos;t talk. The other {inWords(locked.length)} are earned — you meet them as you
              go.
            </Text>
          </Enter>
        </View>

        {/* The one you have. */}
        {starter ? (
          <Enter preset="swing" delay={460}>
            <View
              style={{
                padding: space.xl,
                borderRadius: radius.card,
                backgroundColor: indigo.tint,
                borderWidth: 1,
                borderColor: indigo.base,
                flexDirection: "row",
                alignItems: "center",
                gap: space.base,
              }}
            >
              <View style={{ flex: 1, gap: 3 }}>
                <Text variant="title" style={{ fontSize: size.lead }}>
                  {starter.name}
                </Text>
                <Text variant="caption">{starter.domains}</Text>
                <Text variant="caption" color={textColor.faintest}>
                  {starter.manner}
                </Text>
              </View>
              <BladeTick done />
            </View>
          </Enter>
        ) : null}

        <Enter preset="fade" delay={640}>
          <Text variant="eyebrow">Earned as you go</Text>
        </Enter>

        {/* The ones you don't. */}
        <Stagger initialDelay={720} step={110} style={{ gap: space.base }}>
          {locked.map((master) => (
            <Enter key={master.slug} preset="roll">
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: space.base,
                  padding: space.xl,
                  borderRadius: radius.card,
                  backgroundColor: ink.surface,
                  borderWidth: 1,
                  borderColor: ink.border,
                  opacity: 0.6,
                }}
              >
                <Blade state={master.proOnly ? "locked" : "empty"} length={14} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text variant="title" style={{ fontSize: size.lead }}>
                    {master.name}
                  </Text>
                  <Text variant="caption">{master.domains}</Text>
                </View>
                <Text variant="eyebrow" color={master.proOnly ? gold.base : textColor.faintest}>
                  {master.proOnly ? "Pro" : `Day ${master.unlockDay}`}
                </Text>
              </View>
            </Enter>
          ))}
        </Stagger>
      </View>

      <View style={{ paddingVertical: space.xxl }}>
        <Enter preset="pop" delay={1180}>
          <Button
            label={`${starter?.name ?? "Musashi"} it is`}
            onPress={() => router.push("/(onboarding)/pressure")}
          />
        </Enter>
      </View>
    </Screen>
  );
}
