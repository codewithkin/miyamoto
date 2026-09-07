import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { BladeRail } from "@/components/blade";
import { Enter } from "@/components/motion";
import { Touchable } from "@/components/touchable";
import { Button, Screen, Text } from "@/components/ui";
import { MASTERS, WOUNDS } from "@/content/onboarding-options";
import { useOnboarding } from "@/lib/onboarding-store";
import { indigo, ink, radius, size, space, text as textColor } from "@/theme/tokens";

/**
 * 04 · What are you carrying?
 *
 * Multi-select. The chips pop in one at a time on a tight ladder so the
 * grid assembles rather than appears, and the nudge underneath only shows
 * once there is something true to say about the picks.
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
    return { name: MASTERS.find((m) => m.slug === best.slug)?.name ?? null, n: best.n };
  }, [draft.wounds]);

  return (
    <Screen>
      <Enter preset="drop">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: space.base,
            paddingVertical: space.lg,
          }}
        >
          <Touchable feel="row" onPress={() => router.back()} hitSlop={12}>
            <Text variant="title" color={textColor.muted}>
              ←
            </Text>
          </Touchable>
          <Text variant="eyebrow">2/4</Text>
          <View style={{ flex: 1 }}>
            <BladeRail count={4} progress={2} activeIndex={1} delay={200} step={70} />
          </View>
        </View>
      </Enter>

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
                  onPress={() => toggleWound(wound.slug)}
                  style={{
                    paddingVertical: space.base,
                    paddingHorizontal: space.xl,
                    borderRadius: radius.pill,
                    backgroundColor: picked ? indigo.base : ink.surface,
                    borderWidth: 1,
                    borderColor: picked ? indigo.bright : ink.border,
                  }}
                >
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

        {lean?.name ? (
          <Enter preset="fade">
            <Text variant="caption">
              Most people pick three. {lean.n} of yours already match {lean.name}.
            </Text>
          </Enter>
        ) : (
          <Enter preset="fade" delay={900}>
            <Text variant="caption">Most people pick three.</Text>
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
