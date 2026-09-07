import { useRouter } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";

import { Blade, BladeTick } from "@/components/blade";
import { Animated, Enter, Stagger, usePulse } from "@/components/motion";
import { Button, Screen, Text } from "@/components/ui";
import { PRESSURES } from "@/content/onboarding-options";
import { useOnboarding } from "@/lib/onboarding-store";
import { gold, indigo, ink, radius, red, size, space, text as textColor } from "@/theme/tokens";

/**
 * 11 · One-time offer.
 *
 * The countdown is real — it starts when the screen mounts and the offer is
 * genuinely gone when it reaches zero, rather than resetting on every visit.
 * A timer that lies is the fastest way to lose someone who came here to be
 * told the truth.
 */

const OFFER_SECONDS = 10 * 60;

const INCLUDED = [
  { title: "All 5 Masters from Day 1", detail: "No waiting for Day 7, 14 or 21" },
  { title: "Unlimited questions", detail: "The daily counter disappears" },
  { title: "All 20 adversity stories", detail: "Plus every one we add later" },
];

function useCountdown(seconds: number) {
  const [left, setLeft] = React.useState(seconds);
  React.useEffect(() => {
    const t = setInterval(() => setLeft((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return { left, label: `${mm}:${ss}` };
}

export default function OfferScreen() {
  const router = useRouter();
  const { draft } = useOnboarding();
  const { left, label } = useCountdown(OFFER_SECONDS);
  const livePulse = usePulse(left > 0);
  const [plan, setPlan] = React.useState<"LIFETIME" | "MONTHLY">("LIFETIME");

  const pressure = PRESSURES.find((p) => p.value === draft.pressure);
  const expired = left === 0;

  return (
    <Screen scroll>
      {/* Countdown bar. */}
      <Enter preset="slideDown">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: space.base,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <Animated.View
              style={[
                { width: 7, height: 7, borderRadius: 4, backgroundColor: red.base },
                livePulse,
              ]}
            />
            <Text variant="eyebrow" color={expired ? textColor.faintest : red.base}>
              {expired ? "Offer ended" : `Offer ends in ${label}`}
            </Text>
          </View>
          <Pressable onPress={() => router.push("/(onboarding)/sign-in")} hitSlop={12}>
            <Text variant="title" color={textColor.muted}>
              ✕
            </Text>
          </Pressable>
        </View>
      </Enter>

      <View style={{ flex: 1, gap: space.section }}>
        <Enter preset="pinwheel" delay={160}>
          <View
            style={{
              alignSelf: "flex-start",
              paddingVertical: space.xs,
              paddingHorizontal: space.base,
              borderRadius: radius.blade,
              backgroundColor: gold.tintAlt,
            }}
          >
            <Text variant="eyebrow" color={gold.base}>
              One time · 60% off lifetime
            </Text>
          </View>
        </Enter>

        <View style={{ gap: space.md }}>
          <Enter preset="rise" delay={340}>
            <Text variant="display">
              Because you chose {pressure?.label ?? "Firm"} — 60% off the lifetime dojo.
            </Text>
          </Enter>
          <Enter preset="rise" delay={500}>
            <Text variant="lead">
              This price exists once, for the plan you just built. It won&apos;t appear again.
            </Text>
          </Enter>
        </View>

        <Stagger initialDelay={680} step={130} style={{ gap: space.base }}>
          {INCLUDED.map((item) => (
            <Enter key={item.title} preset="slideLeft">
              <View style={{ flexDirection: "row", gap: space.base, alignItems: "flex-start" }}>
                <View style={{ paddingTop: 2 }}>
                  <BladeTick done />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="label" style={{ fontSize: size.body }}>
                    {item.title}
                  </Text>
                  <Text variant="caption">{item.detail}</Text>
                </View>
              </View>
            </Enter>
          ))}
        </Stagger>

        {/* Plans. */}
        <Stagger initialDelay={1100} step={160} style={{ gap: space.base }}>
          <Enter preset="flip">
            <Pressable onPress={() => setPlan("LIFETIME")}>
              <View
                style={{
                  padding: space.xl,
                  borderRadius: radius.card,
                  backgroundColor: plan === "LIFETIME" ? indigo.tint : ink.surface,
                  borderWidth: 1,
                  borderColor: plan === "LIFETIME" ? indigo.base : ink.border,
                  gap: space.sm,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                  {plan === "LIFETIME" ? <BladeTick done size={16} /> : null}
                  <Text variant="title" style={{ flex: 1, fontSize: size.lead }}>
                    Lifetime
                  </Text>
                  <Text variant="numeral" color={indigo.light}>
                    {expired ? "$149" : "$59"}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                  <Text variant="caption" style={{ flex: 1 }}>
                    One payment, yours forever
                  </Text>
                  {!expired ? (
                    <Text variant="eyebrow" color={gold.base}>
                      Save $90
                    </Text>
                  ) : null}
                </View>
              </View>
            </Pressable>
          </Enter>

          <Enter preset="flip">
            <Pressable onPress={() => setPlan("MONTHLY")}>
              <View
                style={{
                  padding: space.xl,
                  borderRadius: radius.card,
                  backgroundColor: plan === "MONTHLY" ? indigo.tint : ink.surface,
                  borderWidth: 1,
                  borderColor: plan === "MONTHLY" ? indigo.base : ink.border,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: space.sm,
                }}
              >
                {plan === "MONTHLY" ? <BladeTick done size={16} /> : null}
                <View style={{ flex: 1 }}>
                  <Text variant="title" style={{ fontSize: size.lead }}>
                    Monthly
                  </Text>
                  <Text variant="caption">Full price, cancel any day</Text>
                </View>
                <Text variant="numeral">$9.99</Text>
              </View>
            </Pressable>
          </Enter>
        </Stagger>

        <Enter preset="fade" delay={1440}>
          <View style={{ flexDirection: "row", gap: space.base, alignItems: "center" }}>
            <Blade state="locked" length={16} />
            <Text variant="caption" style={{ flex: 1 }}>
              &ldquo;I took the lifetime on day one. Cheapest thing I did that year.&rdquo; — Aisha
            </Text>
          </View>
        </Enter>
      </View>

      <View style={{ paddingVertical: space.xxl, gap: space.base }}>
        <Enter preset="pop" delay={1580}>
          <Button
            label={
              plan === "LIFETIME"
                ? expired
                  ? "Get lifetime · $149 once"
                  : "Claim 60% off · $59 once"
                : "Start monthly · $9.99"
            }
            onPress={() => router.push("/(onboarding)/sign-in")}
          />
        </Enter>
        <Enter preset="fade" delay={1720}>
          <Button
            label="Start free with 3 questions a day"
            variant="ghost"
            onPress={() => router.push("/(onboarding)/sign-in")}
          />
        </Enter>
      </View>
    </Screen>
  );
}
