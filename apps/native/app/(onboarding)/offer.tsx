import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { Blade, BladeTick } from "@/components/blade";
import { Animated, Enter, MotionTone, Stagger, usePulse } from "@/components/motion";
import { Touchable } from "@/components/touchable";
import { Button, Screen, Text } from "@/components/ui";
import { MASTERS, PRESSURES, UNLOCK_WAITS } from "@/content/onboarding-options";
import { useOnboarding } from "@/lib/onboarding-store";
import { usePurchases } from "@/lib/purchases";
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
   * the draft finished is what lets the app shell's claim send it (D-033),
   * and the gate treats a finished draft as onboarded even before the claim
   * lands, so there is no way back into the quiz from here.
   */
  function finish() {
    set({ finishedAt: new Date().toISOString() });
    router.replace("/(app)");
  }

  async function claimOffer() {
    setBuying(true);
    // Buying is optional at this point in the journey. Whether the store
    // sheet completes, is cancelled or fails, onboarding still ends — the
    // user is never held on a paywall to get into the app they signed up for.
    await buy().catch(() => false);
    setBuying(false);
    finish();
  }
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
          <Touchable feel="chip" onPress={finish} hitSlop={12} accessibilityLabel="Skip the offer">
            <Text variant="title" color={textColor.muted}>
              ✕
            </Text>
          </Touchable>
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
            <Touchable feel="chip" onPress={() => setPlan("LIFETIME")}>
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
            </Touchable>
          </Enter>

          <Enter preset="flip">
            <Touchable feel="chip" onPress={() => setPlan("MONTHLY")}>
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
            </Touchable>
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
            disabled={buying}
            onPress={() => void claimOffer()}
          />
        </Enter>
        <Enter preset="fade" delay={1720}>
          <Button
            label="Start free with 3 questions a day"
            variant="ghost"
            disabled={buying}
            onPress={finish}
          />
        </Enter>
      </View>
    </Screen>
  );
}

/**
 * Kept on the expressive motion tone at the owner's request. One of three
 * screens — this, the other paywall, and forging — where the original
 * choreography survives the restraint pass (D-031).
 */
export default function OfferScreen() {
  return (
    <MotionTone value="expressive">
      <OfferScreenBody />
    </MotionTone>
  );
}
