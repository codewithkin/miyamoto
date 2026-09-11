import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { Icon, IconBadge, type IconName } from "@/components/icon";
import { MasterAvatar } from "@/components/master-avatar";
import { Enter } from "@/components/motion";
import { Button, Screen, Text } from "@/components/ui";
import { MASTERS, PRESSURES } from "@/content/onboarding-options";
import { useFirstWeek } from "@/lib/use-first-week";
import { useOnboarding } from "@/lib/onboarding-store";
import {
  gold,
  green,
  indigo,
  ink,
  radius,
  size,
  space,
  text as textColor,
} from "@/theme/tokens";

/**
 * 08 · What your answers bought.
 *
 * One thing to look at: Day 1. It is the only card with a coloured ground and
 * a heavy border, and it sits directly under the title. The two numbers under
 * it are the second read — big numerals, each with an icon and its own accent
 * — and the comparison is last and quiet, as supporting evidence rather than
 * the headline.
 *
 * The screen used to open with a pinwheel, grow two bars from zero on a
 * stagger and flip the Day 1 card over, all before the button arrived at
 * 1.4s. It now settles in four short beats, the last at half a second.
 *
 * Day 1 is the real Day 1 at the pressure they chose (plan 11). It used to
 * be the Firm trial, hardcoded, for everyone — so a Gentle or Unbreakable
 * user was shown a trial they wouldn't get — and captioned "chosen by
 * Musashi from your wounds", which it wasn't: the Path is authored, the
 * same for everyone at a pressure.
 */

function StatCard({
  icon,
  value,
  label,
  accent,
  ground,
  edge,
}: {
  icon: IconName;
  value: number;
  label: string;
  accent: string;
  ground: string;
  edge: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        padding: space.xl,
        borderRadius: radius.card,
        backgroundColor: ground,
        borderWidth: 1,
        borderColor: edge,
        gap: space.md,
      }}
    >
      <IconBadge name={icon} color={accent} background={ink.base} size={32} />
      <View style={{ gap: 2 }}>
        <Text variant="numeral" color={accent} style={{ fontSize: 40, lineHeight: 44 }}>
          {value}
        </Text>
        <Text variant="label" color={textColor.body} style={{ fontSize: size.body }}>
          {label}
        </Text>
      </View>
    </View>
  );
}

function CompareBar({
  label,
  percent,
  highlight,
}: {
  label: string;
  percent: number;
  highlight?: boolean;
}) {
  return (
    <View style={{ gap: space.xs }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text variant="caption" color={highlight ? textColor.body : textColor.faintest}>
          {label}
        </Text>
        <Text variant="caption" color={highlight ? indigo.light : textColor.faintest}>
          {percent}%
        </Text>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: ink.high, overflow: "hidden" }}>
        <View
          style={{
            width: `${percent}%`,
            height: 6,
            borderRadius: 3,
            backgroundColor: highlight ? indigo.bright : ink.borderDim,
          }}
        />
      </View>
    </View>
  );
}

export default function PayoffScreen() {
  const router = useRouter();
  const { draft } = useOnboarding();

  const master = MASTERS.find((m) => m.slug === draft.firstMaster) ?? MASTERS[0];
  const pressure = PRESSURES.find((p) => p.value === draft.pressure);
  // The Path is thirty authored trials at every pressure, one a day (plan 11).
  // This used to read 10, 16 or 30 depending on pressure, which the Path
  // never was: pressure changes how hard each day is, not how many.
  const trialCount = 30;
  // Everyone but the Master they start with. Was a hardcoded 5 from when
  // Mandela was on the roster (D-006).
  const toEarn = MASTERS.length - 1;
  // Warmed during forging; the fallback line is only for a failed fetch, and
  // is true either way.
  const day1 = useFirstWeek().data?.[0];

  return (
    <Screen scroll>
      <View style={{ flex: 1, gap: space.section, paddingTop: space.section }}>
        <Enter preset="fade">
          <View style={{ gap: space.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <IconBadge name="checkmark" color={green.fg} background={green.base} size={22} />
              <Text variant="eyebrow" color={textColor.secondary}>
                Plan built
              </Text>
            </View>
            <Text variant="hero">Your dojo is ready</Text>
          </View>
        </Enter>

        {/* The focus: the first trial, written for them. */}
        <Enter preset="rise" delay={120}>
          <View
            style={{
              padding: space.section,
              borderRadius: radius.card,
              backgroundColor: indigo.tint,
              borderWidth: 1.5,
              borderColor: indigo.base,
              gap: space.base,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <Icon name="flag" size={16} color={indigo.light} />
              <Text variant="eyebrow" color={indigo.light}>
                {day1 ? `Day 1 · ${day1.title}` : "Day 1"}
              </Text>
            </View>
            <Text variant="voice" style={{ fontSize: size.title, lineHeight: size.title * 1.4 }}>
              {day1?.trial ?? "Your first trial is waiting in your dojo."}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space.md,
                paddingTop: space.base,
                borderTopWidth: 1,
                borderTopColor: indigo.surface,
              }}
            >
              {master ? <MasterAvatar slug={master.slug} name={master.name} size={32} /> : null}
              <Text variant="caption" color={textColor.secondaryDim} style={{ flex: 1 }}>
                From {master?.name ?? "your Master"} · {pressure?.label ?? "Firm"} pressure · Day 1
                of 30
              </Text>
            </View>
          </View>
        </Enter>

        {/* What is waiting. */}
        <Enter preset="rise" delay={240}>
          <View style={{ flexDirection: "row", gap: space.base }}>
            <StatCard
              icon="flame"
              value={trialCount}
              label="trials waiting"
              accent={indigo.light}
              ground={ink.surface}
              edge={ink.border}
            />
            <StatCard
              icon="people"
              value={toEarn}
              label={toEarn === 1 ? "Master to earn" : "Masters to earn"}
              accent={gold.base}
              ground={gold.tint}
              edge={gold.tintAlt}
            />
          </View>
        </Enter>

        {/* Supporting evidence, deliberately quiet. */}
        <Enter preset="fade" delay={360}>
          <View style={{ gap: space.base }}>
            <Text variant="caption">
              People who set {pressure?.label ?? "Firm"} pressure finish 2.4× more often.
            </Text>
            <CompareBar label="Generic app" percent={18} />
            <CompareBar label="Your plan" percent={43} highlight />
          </View>
        </Enter>
      </View>

      <View style={{ paddingVertical: space.xxl }}>
        <Enter preset="fade" delay={480}>
          <Button
            label="See your first week"
            onPress={() => router.push("/(onboarding)/first-week")}
          />
        </Enter>
      </View>
    </Screen>
  );
}
