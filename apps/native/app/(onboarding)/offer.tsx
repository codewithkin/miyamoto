import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { BladeTick } from "@/components/blade";
import { Animated, Enter, MotionTone, Stagger, usePulse } from "@/components/motion";
import { Touchable } from "@/components/touchable";
import { Button, Screen, Text } from "@/components/ui";
import { CloseButton, Icon } from "@/components/icon";
import { MASTERS, PRESSURES, UNLOCK_WAITS } from "@/content/onboarding-options";
import { useOnboarding } from "@/lib/onboarding-store";
import { usePurchases } from "@/lib/purchases";
import { track } from "@/lib/telemetry";
import { gold, indigo, ink, radius, red, size, space, text as textColor } from "@/theme/tokens";

/**
 * 11 · One-time offer.
 *
 * The countdown is real — it starts when the screen mounts and the offer is
 * genuinely gone when it reaches zero, rather than resetting on every visit.
 * A timer that lies is the fastest way to lose someone who came here to be
 * told the truth.
 *
 * The deal is the first thing on the screen: a gold "60% OFF" block beside a
 * red-edged countdown in 52pt numerals. Both used to be eyebrow-sized text
 * — the timer a single line at the top, which read as a joke rather than a
 * deadline. When the time runs out both panels go grey and say so.
 */

const OFFER_SECONDS = 10 * 60;

const INCLUDED = [
  { title: `All ${MASTERS.length} Masters from Day 1`, detail: `No waiting for ${UNLOCK_WAITS}` },
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

function OfferScreenBody() {
  const router = useRouter();
  const { draft, set } = useOnboarding();
  const { buy } = usePurchases();
  const [buying, setBuying] = React.useState(false);

  /**
   * The end of onboarding. Every exit from this screen lands here: marking
   * the draft finished is what lets the app shell's claim send it (D-038),
   * and the gate treats a finished draft as onboarded even before the claim
   * lands, so there is no way back into the quiz from here.
   *
   * It is also where Onboarding.completed is counted, once, with how the
   * offer ended. The ref stops a double tap on the close button counting two.
   */
  const finished = React.useRef(false);
  function finish(outcome: "purchased" | "declined" | "started-free" | "skipped") {
    if (!finished.current) {
      finished.current = true;
      track("Onboarding.completed", {
        outcome,
        plan: outcome === "purchased" || outcome === "declined" ? plan : "none",
        pressure: draft.pressure,
        wounds: draft.wounds.length,
        master: draft.firstMaster ?? "unset",
      });
    }
    set({ finishedAt: new Date().toISOString() });
    router.replace("/(app)");
  }

  async function claimOffer() {
    setBuying(true);
    // Buying is optional at this point in the journey. Whether the store
    // sheet completes, is cancelled or fails, onboarding still ends — the
    // user is never held on a paywall to get into the app they signed up for.
    const bought = await buy().catch(() => false);
    setBuying(false);
    finish(bought ? "purchased" : "declined");
  }
  const { left, label } = useCountdown(OFFER_SECONDS);
  const livePulse = usePulse(left > 0);
  const [plan, setPlan] = React.useState<"LIFETIME" | "MONTHLY">("LIFETIME");

  const pressure = PRESSURES.find((p) => p.value === draft.pressure);
  const expired = left === 0;

  return (
    <Screen scroll>
      <Enter preset="drop">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: space.base,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <Icon name="flash" size={16} color={expired ? textColor.faintest : gold.base} />
            <Text variant="eyebrow" color={expired ? textColor.faintest : gold.base}>
              One-time offer
            </Text>
          </View>
          <CloseButton onPress={() => finish("skipped")} accessibilityLabel="Skip the offer" />
        </View>
      </Enter>

      <View style={{ flex: 1, gap: space.section }}>
        {/* The deal: how much, and for how long. */}
        <View style={{ flexDirection: "row", gap: space.base }}>
          <Enter preset="pinwheel" delay={160} style={{ flex: 1 }}>
            <View
              accessibilityLabel={expired ? "Discount ended" : "60 percent off lifetime"}
              style={{
                flex: 1,
                minHeight: 132,
                justifyContent: "center",
                padding: space.xl,
                borderRadius: radius.card,
                backgroundColor: expired ? ink.high : gold.base,
              }}
            >
              <Text
                variant="numeral"
                color={expired ? textColor.faintest : ink.base}
                style={{ fontSize: 52, lineHeight: 56 }}
              >
                60%
              </Text>
              <Text
                variant="eyebrow"
                color={expired ? textColor.faintest : ink.base}
                style={{ fontSize: 14 }}
              >
                Off lifetime
              </Text>
            </View>
          </Enter>

          <Enter preset="slideDown" delay={60} style={{ flex: 1 }}>
            <View
              accessibilityRole="timer"
              accessibilityLabel={expired ? "Offer ended" : `Offer ends in ${label}`}
              style={{
                flex: 1,
                minHeight: 132,
                justifyContent: "center",
                padding: space.xl,
                borderRadius: radius.card,
                backgroundColor: expired ? ink.surface : red.tintDeep,
                borderWidth: 1.5,
                borderColor: expired ? ink.border : red.base,
                gap: space.xs,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                {expired ? (
                  <Icon name="timer-outline" size={14} color={textColor.faintest} />
                ) : (
                  <Animated.View
                    style={[
                      { width: 8, height: 8, borderRadius: 4, backgroundColor: red.base },
                      livePulse,
                    ]}
                  />
                )}
                <Text variant="eyebrow" color={expired ? textColor.faintest : red.base}>
                  {expired ? "Offer ended" : "Ends in"}
                </Text>
              </View>
              <Text
                variant="numeral"
                color={expired ? textColor.faintest : textColor.primary}
                style={{ fontSize: 52, lineHeight: 56, fontVariant: ["tabular-nums"] }}
              >
                {label}
              </Text>
              <Text variant="caption" color={expired ? textColor.faintest : textColor.muted}>
                {expired ? "Lifetime is $149 again" : "Then $149"}
              </Text>
            </View>
          </Enter>
        </View>

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
            <Touchable
              feel="chip"
              accessibilityRole="radio"
              accessibilityState={{ checked: plan === "LIFETIME" }}
              onPress={() => setPlan("LIFETIME")}
            >
              <View
                style={{
                  padding: space.xl,
                  borderRadius: radius.card,
                  backgroundColor: plan === "LIFETIME" ? indigo.tint : ink.surface,
                  borderWidth: plan === "LIFETIME" ? 1.5 : 1,
                  borderColor: plan === "LIFETIME" ? indigo.base : ink.border,
                  gap: space.sm,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.base }}>
                  <BladeTick done={plan === "LIFETIME"} size={24} />
                  <Text variant="title" style={{ flex: 1, fontSize: size.lead }}>
                    Lifetime
                  </Text>
                  <View style={{ alignItems: "flex-end" }}>
                    {!expired ? (
                      <Text
                        variant="caption"
                        color={textColor.faintest}
                        style={{ textDecorationLine: "line-through" }}
                      >
                        $149
                      </Text>
                    ) : null}
                    <Text variant="numeral" color={indigo.light}>
                      {expired ? "$149" : "$59"}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space.sm,
                    paddingLeft: 24 + space.base,
                  }}
                >
                  <Text variant="caption" style={{ flex: 1 }}>
                    One payment, yours forever
                  </Text>
                  {!expired ? (
                    <View
                      style={{
                        paddingVertical: 3,
                        paddingHorizontal: space.md,
                        borderRadius: radius.pill,
                        backgroundColor: gold.base,
                      }}
                    >
                      <Text variant="eyebrow" color={ink.base}>
                        Save $90
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Touchable>
          </Enter>

          <Enter preset="flip">
            <Touchable
              feel="chip"
              accessibilityRole="radio"
              accessibilityState={{ checked: plan === "MONTHLY" }}
              onPress={() => setPlan("MONTHLY")}
            >
              <View
                style={{
                  padding: space.xl,
                  borderRadius: radius.card,
                  backgroundColor: plan === "MONTHLY" ? indigo.tint : ink.surface,
                  borderWidth: plan === "MONTHLY" ? 1.5 : 1,
                  borderColor: plan === "MONTHLY" ? indigo.base : ink.border,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: space.base,
                }}
              >
                <BladeTick done={plan === "MONTHLY"} size={24} />
                <View style={{ flex: 1 }}>
                  <Text variant="title" style={{ fontSize: size.lead }}>
                    Monthly
                  </Text>
                  <Text variant="caption">Full price, cancel any day</Text>
                </View>
                <Text variant="numeral">$9.99</Text>
              </View>
            </Touchable>
          </Enter>
        </Stagger>

        <Enter preset="fade" delay={1440}>
          <View style={{ flexDirection: "row", gap: space.base, alignItems: "center" }}>
            <Icon name="chatbubble-ellipses-outline" size={18} color={textColor.faintest} />
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
            disabled={buying}
            onPress={() => void claimOffer()}
          />
        </Enter>
        <Enter preset="fade" delay={1720}>
          <Button
            label="Start free with 3 questions a day"
            variant="ghost"
            disabled={buying}
            onPress={() => finish("started-free")}
          />
        </Enter>
      </View>
    </Screen>
  );
}

/**
 * Kept on the expressive motion tone at the owner's request. One of three
 * screens — this, the other paywall, and forging — where the original
 * choreography survives the restraint pass (D-036).
 */
export default function OfferScreen() {
  return (
    <MotionTone value="expressive">
      <OfferScreenBody />
    </MotionTone>
  );
}
