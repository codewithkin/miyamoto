import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { BladeTick } from "@/components/blade";
import { OnboardingHeader } from "@/components/onboarding-header";
import { Enter } from "@/components/motion";
import { Touchable } from "@/components/touchable";
import { Button, Screen, Text } from "@/components/ui";
import { Icon } from "@/components/icon";
import { MasterAvatar } from "@/components/master-avatar";
import { MASTERS, WOUNDS } from "@/content/onboarding-options";
import { useOnboarding } from "@/lib/onboarding-store";
import { indigo, ink, radius, size, space, text as textColor } from "@/theme/tokens";

/**
 * 04 · What are you carrying?
 *
 * Multi-select. An unpicked chip carries a "+", a picked one a green tick
 * (D-037), so it is obvious both that several can be chosen and which ones
 * were. The nudge underneath only shows once there is something true to say
 * about the picks. The screen scrolls: the chip grid is tall on small phones.
 *
 * When the picks lean towards one Master, the nudge shows that Master's face
 * and says plainly whether they're yours yet (D-045) — a leaning towards
 * Seneca is also the first hint of the ladder the next screen explains. It
 * used to open with "Most people pick three", a claim about users the app
 * does not have yet.
 */
export default function CarryingScreen() {
  const router = useRouter();
  const { draft, toggleWound } = useOnboarding();

  // Which Master the current picks lean towards, for the nudge line.
  const lean = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const slug of draft.wounds) {
      const wound = WOUNDS.find((w) => w.slug === slug);
      for (const m of wound?.masters ?? []) counts.set(m, (counts.get(m) ?? 0) + 1);
    }
    let best: { slug: string; n: number } | null = null;
    for (const [slug, n] of counts) if (!best || n > best.n) best = { slug, n };
    if (!best || best.n < 2) return null;
    const master = MASTERS.find((m) => m.slug === best.slug);
    return master ? { master, n: best.n } : null;
  }, [draft.wounds]);

  return (
    <Screen scroll>
      <OnboardingHeader step={2} />

      <View style={{ flex: 1, gap: space.section }}>
        <View style={{ gap: space.md }}>
          <Enter preset="rise" delay={140}>
            <Text variant="display">
              Before I choose your first trial — what are you carrying?
            </Text>
          </Enter>
          <Enter preset="rise" delay={300}>
            <Text variant="lead">Pick as many as are true.</Text>
          </Enter>
        </View>

        {/* The grid assembles chip by chip. */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
          {WOUNDS.map((wound, i) => {
            const picked = draft.wounds.includes(wound.slug);
            return (
              <Enter key={wound.slug} preset="pop" delay={440 + i * 70}>
                <Touchable
                  feel="chip"
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: picked }}
                  onPress={() => toggleWound(wound.slug)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space.sm,
                    paddingVertical: space.base,
                    paddingLeft: space.base,
                    paddingRight: space.xl,
                    borderRadius: radius.pill,
                    backgroundColor: picked ? indigo.tint : ink.surface,
                    borderWidth: picked ? 1.5 : 1,
                    borderColor: picked ? indigo.base : ink.border,
                  }}
                >
                  {picked ? (
                    <BladeTick done size={20} />
                  ) : (
                    <View style={{ width: 20, alignItems: "center" }}>
                      <Icon name="add" size={18} color={textColor.faintest} />
                    </View>
                  )}
                  <Text
                    variant="label"
                    color={picked ? textColor.primary : textColor.muted}
                    style={{ fontSize: size.body }}
                  >
                    {wound.label}
                  </Text>
                </Touchable>
              </Enter>
            );
          })}
        </View>

        {lean ? (
          <Enter preset="fade">
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space.base,
                paddingVertical: space.md,
                paddingLeft: space.md,
                paddingRight: space.xl,
                borderRadius: radius.card,
                backgroundColor: ink.surface,
                borderWidth: 1,
                borderColor: ink.border,
              }}
            >
              <MasterAvatar
                slug={lean.master.slug}
                name={lean.master.name}
                size={36}
                locked={lean.master.proOnly || lean.master.unlockDay !== null}
                pro={lean.master.proOnly}
              />
              <Text variant="caption" color={textColor.secondaryDim} style={{ flex: 1 }}>
                {lean.n} of these are {lean.master.name}&apos;s ground.{" "}
                {lean.master.proOnly
                  ? `${lean.master.name} is part of Pro.`
                  : lean.master.unlockDay !== null
                    ? `${lean.master.name} arrives on Day ${lean.master.unlockDay}.`
                    : `${lean.master.name} answers first.`}
              </Text>
            </View>
          </Enter>
        ) : (
          <Enter preset="fade" delay={900}>
            <Text variant="caption">Three is plenty to start.</Text>
          </Enter>
        )}
      </View>

      <View style={{ paddingVertical: space.xxl, gap: space.sm }}>
        <Enter preset="pop" delay={1000}>
          <Button
            label="Continue"
            disabled={draft.wounds.length === 0}
            onPress={() => router.push("/(onboarding)/master")}
          />
        </Enter>
        <Text variant="caption" style={{ textAlign: "center" }}>
          {draft.wounds.length} picked
        </Text>
      </View>
    </Screen>
  );
}
