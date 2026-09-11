import { useRouter } from "expo-router";
import React from "react";
import { Image, View } from "react-native";

import { BladeTick } from "@/components/blade";
import { Touchable } from "@/components/touchable";
import { OnboardingHeader } from "@/components/onboarding-header";
import { Enter, Stagger } from "@/components/motion";
import { Button, Screen, Text } from "@/components/ui";
import { MasterAvatar } from "@/components/master-avatar";
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
 *
 * The one you have leads with the same ink portrait welcome opened on
 * (D-045) — the person who answers first is the person the app introduced
 * itself with. Only Musashi has that art (designs/make-hero.py); anyone else
 * in the first slot falls back to the face card.
 */

/** Full-width art, faded into ink.base at the bottom, by Master. */
const HERO_ART: Record<string, number> = {
  musashi: require("@/assets/images/hero-musashi.jpg"),
};
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
      <OnboardingHeader step={3} />

      <View style={{ flex: 1, gap: space.section }}>
        <View style={{ gap: space.md }}>
          <Enter preset="rise" delay={140}>
            <Text variant="display">{starter?.name ?? "Musashi"} takes your first question.</Text>
          </Enter>
          <Enter preset="rise" delay={300}>
            <Text variant="lead">
              Every answer is a letter. The other {inWords(locked.length)} are earned — you meet
              them as you go.
            </Text>
          </Enter>
        </View>

        {/* The one you have. */}
        {starter ? (
          <Enter preset="swing" delay={460}>
            <View
              style={{
                borderRadius: radius.panel,
                overflow: "hidden",
                backgroundColor: HERO_ART[starter.slug] ? ink.base : indigo.tint,
                borderWidth: 1.5,
                borderColor: indigo.base,
              }}
            >
              {/* Anchored to the bottom, so the art's baked-in fade to ink
                  meets the card body exactly where it ends: the crop takes
                  the top (the hair), never the face or the fade. */}
              {HERO_ART[starter.slug] ? (
                <View style={{ height: 280, overflow: "hidden" }}>
                  <Image
                    source={HERO_ART[starter.slug]}
                    resizeMode="cover"
                    accessibilityIgnoresInvertColors
                    accessibilityLabel={`${starter.name}, in ink`}
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      width: "100%",
                      aspectRatio: 1024 / 1014,
                    }}
                  />
                </View>
              ) : null}
              <View
                style={{
                  padding: space.xl,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: space.xl,
                }}
              >
                {/* Without the art, the face of whoever answers first, large —
                    this is who they will be writing to. */}
                {HERO_ART[starter.slug] ? null : (
                  <MasterAvatar slug={starter.slug} name={starter.name} size={72} active />
                )}
                <View style={{ flex: 1, gap: 3 }}>
                  <Text variant="title" style={{ fontSize: size.subtitle }}>
                    {starter.name}
                  </Text>
                  <Text variant="caption" color={indigo.light}>
                    {starter.domains}
                  </Text>
                  <Text variant="caption" color={textColor.muted}>
                    {starter.manner}
                  </Text>
                </View>
                <BladeTick done />
              </View>
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
                  padding: space.base,
                  paddingRight: space.xl,
                  borderRadius: radius.card,
                  backgroundColor: ink.surface,
                  borderWidth: 1,
                  borderColor: ink.border,
                }}
              >
                {/* Visible so you can see who is coming; dimmed and locked so
                    they cannot be mistaken for available. */}
                <MasterAvatar
                  slug={master.slug}
                  name={master.name}
                  size={44}
                  locked
                  pro={master.proOnly}
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="label" color={textColor.muted} style={{ fontSize: size.bodyLg }}>
                    {master.name}
                  </Text>
                  <Text variant="caption" color={textColor.faintest}>
                    {master.domains}
                  </Text>
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
