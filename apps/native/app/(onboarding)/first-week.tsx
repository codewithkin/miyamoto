import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { Icon } from "@/components/icon";
import { MasterAvatar } from "@/components/master-avatar";
import { Enter, Stagger } from "@/components/motion";
import { ScreenHero } from "@/components/screen-hero";
import { Button, Screen, Text } from "@/components/ui";
import { MASTERS, PRESSURES } from "@/content/onboarding-options";
import { useFirstWeek } from "@/lib/use-first-week";
import { useOnboarding } from "@/lib/onboarding-store";
import { indigo, ink, radius, size, space, text as textColor } from "@/theme/tokens";

/**
 * 09 · Your first week (plan 11, D-046).
 *
 * Days 1–7 of the Path at the pressure the person just chose, from the
 * seeded content — the real trials, in order. It replaced a "social proof"
 * screen whose user count, rating and testimonials had nothing behind them:
 * this one is true today, and it shows exactly what they're agreeing to
 * right before the reminder and offer screens ask anything of them.
 *
 * Day 1 is the focus, drawn like payoff's Day 1 card. If the week can't
 * load, the screen says so and the button still works — onboarding never
 * holds anyone on a screen the network broke.
 */
export default function FirstWeekScreen() {
  const router = useRouter();
  const { draft } = useOnboarding();
  const week = useFirstWeek();

  const pressure = PRESSURES.find((p) => p.value === draft.pressure);
  const master = MASTERS.find((m) => m.slug === draft.firstMaster);
  const [first, ...rest] = week.data ?? [];

  return (
    <Screen scroll>
      <View style={{ flex: 1, gap: space.section, paddingTop: space.section }}>
        <ScreenHero
          eyebrow={`Act I · Face it · ${pressure?.label ?? "Firm"}`}
          title="Your first week"
          lead="One trial a day. These are the first seven, at the pressure you chose."
          visual={
            master ? (
              <MasterAvatar slug={master.slug} name={master.name} size={48} active />
            ) : undefined
          }
        />

        {week.isPending ? (
          <View style={{ gap: space.base }}>
            {[168, 64, 64, 64].map((height, i) => (
              <View
                key={i}
                style={{
                  height,
                  borderRadius: radius.card,
                  backgroundColor: ink.surface,
                  borderWidth: 1,
                  borderColor: ink.border,
                }}
              />
            ))}
          </View>
        ) : !first ? (
          <Enter preset="fade">
            <View
              accessibilityRole="alert"
              style={{
                gap: space.base,
                padding: space.xl,
                borderRadius: radius.card,
                backgroundColor: ink.surface,
                borderWidth: 1,
                borderColor: ink.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                <Icon name="cloud-offline-outline" size={18} color={textColor.muted} />
                <Text variant="label" style={{ flex: 1, fontSize: size.body }}>
                  Your week didn&apos;t load just now.
                </Text>
              </View>
              <Text variant="caption">
                It&apos;s waiting in the app either way — you can carry on.
              </Text>
              <Button
                label={week.isFetching ? "Trying…" : "Try again"}
                variant="ghost"
                disabled={week.isFetching}
                onPress={() => void week.refetch()}
              />
            </View>
          </Enter>
        ) : (
          <View style={{ gap: space.base }}>
            {/* Day 1 — the focus. */}
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
                  <Text variant="eyebrow" color={indigo.light} style={{ flex: 1 }}>
                    Day 1 · {first.title}
                  </Text>
                  <Text variant="caption" color={textColor.secondaryDim}>
                    Starts today
                  </Text>
                </View>
                <Text variant="voice" style={{ fontSize: size.title, lineHeight: size.title * 1.4 }}>
                  {first.trial ?? first.brief}
                </Text>
                <Text variant="caption" color={textColor.secondaryDim}>
                  {first.brief}
                </Text>
              </View>
            </Enter>

            {/* Days 2–7 — the shape of the week, quieter. */}
            <Stagger initialDelay={260} step={60} style={{ gap: space.md }}>
              {rest.map((day) => (
                <Enter key={day.dayNumber} preset="rise">
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: space.base,
                      padding: space.base,
                      paddingRight: space.xl,
                      borderRadius: radius.card,
                      backgroundColor: ink.surface,
                      borderWidth: 1,
                      borderColor: ink.border,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: ink.raised,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text variant="numeral" color={textColor.secondary} style={{ fontSize: 16 }}>
                        {day.dayNumber}
                      </Text>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="label" style={{ fontSize: size.body }}>
                        {day.title}
                      </Text>
                      <Text variant="caption" numberOfLines={2}>
                        {day.trial ?? day.brief}
                      </Text>
                    </View>
                  </View>
                </Enter>
              ))}
            </Stagger>
          </View>
        )}
      </View>

      <View style={{ paddingVertical: space.xxl }}>
        <Enter preset="fade" delay={420}>
          <Button label="Start Day 1" onPress={() => router.push("/(onboarding)/reminders")} />
        </Enter>
      </View>
    </Screen>
  );
}
