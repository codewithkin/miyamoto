import { useRouter } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";

import { BladeTick } from "@/components/blade";
import { Enter, Stagger } from "@/components/motion";
import { Button, Screen, Text } from "@/components/ui";
import { gold, indigo, ink, radius, size, space, text as textColor } from "@/theme/tokens";

/**
 * 20 · Pro paywall.
 *
 * Purchases go through RevenueCat, which is not wired until its API keys
 * exist. The buttons are deliberately inert rather than faking a flow —
 * a paywall that pretends to charge is worse than one that says it cannot.
 */

const INCLUDED = [
  { title: "Unlimited answers", detail: "Ask any Master as often as you need" },
  { title: "All five Masters now", detail: "Skip the Day 7, 14 and 21 waits" },
  { title: "The full adversity library", detail: "20 stories, new ones every month" },
];

export default function PaywallScreen() {
  const router = useRouter();
  const [plan, setPlan] = React.useState<"LIFETIME" | "MONTHLY">("LIFETIME");

  return (
    <Screen scroll>
      <Enter preset="drop">
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: space.lg,
          }}
        >
          <Text variant="eyebrow" color={gold.base}>
            Miyamoto Pro
          </Text>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text variant="title" color={textColor.muted}>
              ✕
            </Text>
          </Pressable>
        </View>
      </Enter>

      <View style={{ flex: 1, gap: space.section }}>
        <Enter preset="rise" delay={140}>
          <Text variant="display">Stop rationing your questions.</Text>
        </Enter>
        <Enter preset="rise" delay={300}>
          <Text variant="lead">
            Five Masters writing back, every story, every trial — and no counter in the corner.
          </Text>
        </Enter>

        <Stagger initialDelay={480} step={130} style={{ gap: space.base }}>
          {INCLUDED.map((i) => (
            <Enter key={i.title} preset="slideLeft">
              <View style={{ flexDirection: "row", gap: space.base, alignItems: "flex-start" }}>
                <View style={{ paddingTop: 2 }}>
                  <BladeTick done />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="label" style={{ fontSize: size.body }}>
                    {i.title}
                  </Text>
                  <Text variant="caption">{i.detail}</Text>
                </View>
              </View>
            </Enter>
          ))}
        </Stagger>

        <Stagger initialDelay={900} step={160} style={{ gap: space.base }}>
          <Enter preset="flip">
            <PlanCard
              title="Lifetime"
              detail="Pay once, keep the dojo forever"
              price="$149"
              note="one payment"
              badge="Best value"
              selected={plan === "LIFETIME"}
              onPress={() => setPlan("LIFETIME")}
            />
          </Enter>
          <Enter preset="flip">
            <PlanCard
              title="Monthly"
              detail="Cancel any day"
              price="$9.99"
              selected={plan === "MONTHLY"}
              onPress={() => setPlan("MONTHLY")}
            />
          </Enter>
        </Stagger>

        <Enter preset="fade" delay={1280}>
          <Text variant="caption" style={{ textAlign: "center" }}>
            &ldquo;Day 9 was &lsquo;send the email&rsquo;. I sent it.&rdquo; — Tomás, finished the
            30 days
          </Text>
        </Enter>
      </View>

      <View style={{ paddingVertical: space.xxl, gap: space.md }}>
        <Enter preset="pop" delay={1420}>
          <Button
            label="Start 3 days free"
            disabled
            onPress={() => {
              /* RevenueCat purchase — awaiting API keys. */
            }}
          />
        </Enter>
        <Enter preset="fade" delay={1560}>
          <Text variant="caption" style={{ textAlign: "center" }}>
            Purchases unavailable until RevenueCat is configured · Restore purchase
          </Text>
        </Enter>
      </View>
    </Screen>
  );
}

function PlanCard({
  title,
  detail,
  price,
  note,
  badge,
  selected,
  onPress,
}: {
  title: string;
  detail: string;
  price: string;
  note?: string;
  badge?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          padding: space.xl,
          borderRadius: radius.card,
          backgroundColor: selected ? indigo.tint : ink.surface,
          borderWidth: 1,
          borderColor: selected ? indigo.base : ink.border,
          gap: space.sm,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          {selected ? <BladeTick done size={16} /> : null}
          <Text variant="title" style={{ flex: 1, fontSize: size.lead }}>
            {title}
          </Text>
          <Text variant="numeral" color={selected ? indigo.light : textColor.primary}>
            {price}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          <Text variant="caption" style={{ flex: 1 }}>
            {detail}
            {note ? ` · ${note}` : ""}
          </Text>
          {badge ? (
            <Text variant="eyebrow" color={gold.base}>
              {badge}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
