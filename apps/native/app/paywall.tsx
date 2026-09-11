import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";

import { BladeTick } from "@/components/blade";
import { Touchable } from "@/components/touchable";
import { Enter, MotionTone, Stagger } from "@/components/motion";
import { Button, Screen, Text } from "@/components/ui";
import { CloseButton, Icon } from "@/components/icon";
import { usePlans, usePurchases, type Plan } from "@/lib/purchases";
import { gold, indigo, ink, radius, red, size, space, text as textColor } from "@/theme/tokens";
import { MASTER_COUNT, MASTER_COUNT_TITLE, UNLOCK_WAITS } from "@/content/onboarding-options";

/**
 * 20 · Pro paywall.
 *
 * Coded start to finish (plan 15). The plans are the current RevenueCat
 * Offering's packages, with the store's own localised prices and trial
 * terms, and the button buys the one chosen with `purchasePackage`: the
 * store's own purchase sheet, and nothing in between. It used to hand off
 * to RevenueCat's dashboard paywall, so pressing buy opened a second
 * paywall, and its cards showed prices typed into this file.
 *
 * Nothing here is hardcoded that the store decides: price, period, trial.
 * The button says exactly what pressing it does.
 */

/** What the button does, in the store's own terms. */
function actionLabel(plan: Plan): string {
  if (plan.trial) return `Start ${plan.trial} free trial`;
  if (plan.lifetime) return `Get lifetime · ${plan.price}`;
  return `Subscribe · ${plan.price}${plan.per ? `/${plan.per}` : ""}`;
}

/** The terms under the button, required reading before a subscription. */
function termsOf(plan: Plan): string {
  if (plan.lifetime) return `${plan.price} once. Pro stays on this account for good.`;
  const then = `${plan.price} a ${plan.per ?? "period"}`;
  return plan.trial
    ? `${plan.trial} free, then ${then}. Renews until you cancel in Google Play. Cancel before the trial ends and you pay nothing.`
    : `${then}. Renews until you cancel in Google Play.`;
}

const INCLUDED = [
  { title: "Unlimited answers", detail: "Ask any Master as often as you need" },
  { title: `All ${MASTER_COUNT} Masters now`, detail: `Skip the ${UNLOCK_WAITS} waits` },
  { title: "The full adversity library", detail: "20 stories, new ones every month" },
];

function PaywallScreenBody() {
  const router = useRouter();
  const qc = useQueryClient();
  const { buy, restore, isPro } = usePurchases();
  const plans = usePlans();
  const list = plans.data ?? [];
  const [chosenId, setChosenId] = React.useState<string | null>(null);
  // Lifetime is the default choice when the offering has it, as the design
  // draws it; otherwise the offering's first package.
  const selected =
    list.find((p) => p.id === chosenId) ?? list.find((p) => p.lifetime) ?? list[0] ?? null;
  const [busy, setBusy] = React.useState<"buy" | "restore" | null>(null);
  const [note, setNote] = React.useState<string | null>(null);

  /**
   * Pro landed on the device. The server hears by RevenueCat's webhook,
   * seconds later, and the counter and locks are the server's. So its copy
   * is re-read now and twice more, so "3 of 3 left" doesn't linger after
   * someone has paid.
   */
  function settlePro() {
    void qc.invalidateQueries();
    setTimeout(() => void qc.invalidateQueries(), 4_000);
    setTimeout(() => void qc.invalidateQueries(), 12_000);
  }

  async function purchase() {
    if (!selected || busy) return;
    setBusy("buy");
    setNote(null);
    const outcome = await buy(selected.pkg);
    setBusy(null);
    if (outcome === "purchased") {
      settlePro();
      router.back();
    } else if (outcome === "failed") {
      setNote("The purchase didn't go through. Try again, or Restore if you were charged.");
    }
    // Cancelled: they closed the store's sheet. Nothing to say.
  }

  async function restoreNow() {
    if (busy) return;
    setBusy("restore");
    setNote(null);
    const restored = await restore().catch(() => false);
    setBusy(null);
    if (restored) {
      settlePro();
      router.back();
    } else {
      setNote("No Pro purchase was found for this Google account.");
    }
  }

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
          <CloseButton onPress={() => router.back()} />
        </View>
      </Enter>

      <View style={{ flex: 1, gap: space.section }}>
        <Enter preset="rise" delay={140}>
          <Text variant="display">Stop rationing your questions.</Text>
        </Enter>
        <Enter preset="rise" delay={300}>
          <Text variant="lead">
            {MASTER_COUNT_TITLE} Masters writing back, every story, every trial — and no counter in the corner.
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

        {plans.isPending ? (
          <View style={{ gap: space.base }}>
            {[0, 1].map((i) => (
              <View
                key={i}
                style={{
                  height: 84,
                  borderRadius: radius.card,
                  backgroundColor: ink.surface,
                  borderWidth: 1,
                  borderColor: ink.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {i === 0 ? <ActivityIndicator color={textColor.faintest} /> : null}
              </View>
            ))}
          </View>
        ) : list.length === 0 ? (
          // No offering, or the store unreachable: say so, and let them try.
          <View
            style={{
              padding: space.xl,
              borderRadius: radius.card,
              backgroundColor: ink.surface,
              borderWidth: 1,
              borderColor: ink.border,
              gap: space.base,
              alignItems: "center",
            }}
          >
            <Icon name="cloud-offline-outline" size={24} color={textColor.muted} />
            <Text variant="label" style={{ textAlign: "center" }}>
              The plans didn&apos;t load.
            </Text>
            <Text variant="caption" style={{ textAlign: "center" }}>
              Check your connection. Nothing has been charged.
            </Text>
            <Button
              label="Try again"
              variant="secondary"
              full={false}
              loading={plans.isFetching}
              loadingLabel="Loading…"
              onPress={() => void plans.refetch()}
            />
          </View>
        ) : (
          <Stagger initialDelay={300} step={160} style={{ gap: space.base }}>
            {list.map((p) => (
              <Enter key={p.id} preset="flip">
                <PlanCard
                  title={p.title}
                  detail={
                    p.lifetime
                      ? "Pay once, keep the dojo forever"
                      : p.trial
                        ? `${p.trial} free, then cancel any day`
                        : "Cancel any day"
                  }
                  price={p.price}
                  note={p.lifetime ? "one payment" : p.per ? `a ${p.per}` : undefined}
                  badge={p.lifetime && list.length > 1 ? "Best value" : undefined}
                  selected={selected?.id === p.id}
                  onPress={() => setChosenId(p.id)}
                />
              </Enter>
            ))}
          </Stagger>
        )}

        <Enter preset="fade" delay={1280}>
          <Text variant="caption" style={{ textAlign: "center" }}>
            &ldquo;Day 9 was &lsquo;send the email&rsquo;. I sent it.&rdquo; — Tomás, finished the
            30 days
          </Text>
        </Enter>
      </View>

      <View style={{ paddingVertical: space.xxl, gap: space.md }}>
        {note ? (
          <Enter preset="fade" style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <Icon name="alert-circle" size={16} color={red.base} />
            <Text variant="caption" style={{ flex: 1 }}>
              {note}
            </Text>
          </Enter>
        ) : null}
        <Enter preset="pop" delay={600}>
          <Button
            variant="pro"
            label={
              isPro ? "You already have Pro" : selected ? actionLabel(selected) : "Choose a plan"
            }
            icon={<Icon name="diamond" size={20} color={isPro || !selected ? textColor.faintest : ink.base} />}
            loading={busy === "buy"}
            loadingLabel="Opening Google Play…"
            disabled={isPro || !selected || busy === "restore"}
            onPress={() => void purchase()}
          />
        </Enter>
        {selected && !isPro ? (
          <Text variant="caption" style={{ textAlign: "center" }}>
            {termsOf(selected)}
          </Text>
        ) : null}
        <Enter preset="fade" delay={700}>
          <Button
            label="Restore purchase"
            variant="ghost"
            loading={busy === "restore"}
            loadingLabel="Checking…"
            disabled={busy === "buy"}
            onPress={() => void restoreNow()}
          />
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
    <Touchable
      feel="chip"
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
    >
      <View
        style={{
          padding: space.xl,
          borderRadius: radius.card,
          backgroundColor: selected ? indigo.tint : ink.surface,
          borderWidth: selected ? 1.5 : 1,
          borderColor: selected ? indigo.base : ink.border,
          gap: space.sm,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.base }}>
          <BladeTick done={selected} size={24} />
          <Text variant="title" style={{ flex: 1, fontSize: size.lead }}>
            {title}
          </Text>
          <Text variant="numeral" color={selected ? indigo.light : textColor.primary}>
            {price}
          </Text>
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
    </Touchable>
  );
}

/**
 * Kept on the expressive motion tone at the owner's request, the one screen
 * where the original choreography survives the restraint pass (D-036). The
 * other two, forging and the offer, went with the onboarding quiz (D-048).
 */
export default function PaywallScreen() {
  return (
    <MotionTone value="expressive">
      <PaywallScreenBody />
    </MotionTone>
  );
}
