import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { Blade } from "@/components/blade";
import { MasterAvatar } from "@/components/master-avatar";
import { Enter } from "@/components/motion";
import { Button, Screen, Text } from "@/components/ui";
import { MASTERS, PRESSURES } from "@/content/onboarding-options";
import { useOnboarding } from "@/lib/onboarding-store";
import { indigo, ink, radius, size, space, text as textColor } from "@/theme/tokens";

/**
 * 08 · What your answers bought.
 *
 * Shows the plan before asking for anything. The two comparison bars grow
 * from zero on a stagger so the gap between them is watched rather than
 * read, and Day 1 flips face-up underneath.
 */

function CompareBar({
  label,
  percent,
  highlight,
  delay,
}: {
  label: string;
  percent: number;
  highlight?: boolean;
  delay: number;
}) {
  return (
    <Enter preset="slideLeft" delay={delay}>
      <View style={{ gap: space.xs }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text variant="caption" color={highlight ? textColor.body : textColor.faintest}>
            {label}
          </Text>
          <Text variant="caption" color={highlight ? indigo.light : textColor.faintest}>
            {percent}%
          </Text>
        </View>
        <View
          style={{
            height: 8,
            borderRadius: 2,
            backgroundColor: ink.high,
            overflow: "hidden",
          }}
        >
          <Enter preset="blade" delay={delay + 160}>
            <View
              style={{
                width: `${percent}%`,
                height: 8,
                borderRadius: 2,
                backgroundColor: highlight ? indigo.base : ink.borderDim,
              }}
            />
          </Enter>
        </View>
      </View>
    </Enter>
  );
}

export default function PayoffScreen() {
  const router = useRouter();
  const { draft } = useOnboarding();

  const master = MASTERS.find((m) => m.slug === draft.firstMaster);
  const pressure = PRESSURES.find((p) => p.value === draft.pressure);
  const trialCount = draft.pressure === "UNBREAKABLE" ? 30 : draft.pressure === "FIRM" ? 16 : 10;

  return (
    <Screen scroll>
      <View style={{ flex: 1, gap: space.section, paddingTop: space.section }}>
        <Enter preset="pinwheel">
          <Text variant="hero">Your dojo is ready</Text>
        </Enter>

        <Enter preset="rise" delay={340}>
          <Text variant="lead">
            People who set {pressure?.label ?? "Firm"} pressure finish 2.4× more often.
          </Text>
        </Enter>

        <View style={{ gap: space.base }}>
          <CompareBar label="Generic app" percent={18} delay={520} />
          <CompareBar label="Your plan" percent={43} highlight delay={700} />
        </View>

        {/* Day 1, written for them. */}
        <Enter preset="flip" delay={960}>
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
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <Blade state="active" length={14} delay={1100} />
              <Text variant="eyebrow">Day 1 · written for you</Text>
            </View>
            <Text variant="voice">
              Name the person you&apos;re avoiding. Out loud, to yourself, before breakfast.
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
              {master ? <MasterAvatar slug={master.slug} name={master.name} size={28} /> : null}
              <Text variant="caption" style={{ flex: 1 }}>
                Chosen by {master?.name ?? "your Master"} from your{" "}
                {draft.wounds.length === 1 ? "wound" : `${draft.wounds.length} wounds`}
              </Text>
            </View>
          </View>
        </Enter>

        <Enter preset="fade" delay={1240}>
          <View style={{ flexDirection: "row", gap: space.base }}>
            <View
              style={{
                flex: 1,
                padding: space.xl,
                borderRadius: radius.card,
                backgroundColor: indigo.tint,
                gap: space.xxs,
              }}
            >
              <Text variant="numeral">{trialCount}</Text>
              <Text variant="caption">trials waiting</Text>
            </View>
            <View
              style={{
                flex: 1,
                padding: space.xl,
                borderRadius: radius.card,
                backgroundColor: ink.surface,
                gap: space.xxs,
              }}
            >
              <Text variant="numeral">5</Text>
              <Text variant="caption">masters to earn</Text>
            </View>
          </View>
        </Enter>
      </View>

      <View style={{ paddingVertical: space.xxl }}>
        <Enter preset="pop" delay={1420}>
          <Button
            label="See who's already inside"
            onPress={() => router.push("/(onboarding)/proof")}
          />
        </Enter>
      </View>
    </Screen>
  );
}
