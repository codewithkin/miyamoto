import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { View } from "react-native";

import { Icon } from "@/components/icon";
import { Enter } from "@/components/motion";
import { Button, Text } from "@/components/ui";
import { showRewardedAd } from "@/lib/ads";
import { usePurchases } from "@/lib/purchases";
import { trpc } from "@/utils/trpc";
import { ink, red, space, text as textColor } from "@/theme/tokens";

/**
 * Buying Pro from anywhere: shows the store opening on the button that
 * opened it, and reports back once Pro has actually landed.
 */
export function useBuyPro(onBought?: () => void) {
  const qc = useQueryClient();
  const { buy } = usePurchases();
  const [buying, setBuying] = React.useState(false);

  async function run() {
    if (buying) return;
    setBuying(true);
    const bought = await buy().catch(() => false);
    setBuying(false);
    if (bought) {
      void qc.invalidateQueries();
      onBought?.();
    }
  }

  return { buying, buyPro: () => void run() };
}

/**
 * The two ways to more questions, offered together wherever the free
 * questions are counted (plan 13): watch an ad for three more today, or go
 * Pro and stop counting. The ad comes first because it costs nothing, and
 * the owner wants people to take it where they can. Pro sits in gold, the
 * colour of premium (D-045).
 *
 * Only for questions. Locked Masters and locked stories are Pro-only, with
 * no ad route.
 *
 * The ad is granted by the server after the reward is earned, never here
 * (lib/ads). With no ads left today (MAX_ADS_PER_DAY on the server), the ad
 * button says so rather than disappearing, so Pro doesn't look like the
 * only option by accident.
 */
export function MoreQuestions({
  onGranted,
  onBought,
}: {
  /** Called once three more questions have been added. */
  onGranted?: () => void;
  /** Called once Pro has landed. */
  onBought?: () => void;
}) {
  const qc = useQueryClient();
  const usage = useQuery(trpc.chat.usage.queryOptions());
  const { buying, buyPro } = useBuyPro(onBought);
  const [watching, setWatching] = React.useState(false);
  const [note, setNote] = React.useState<string | null>(null);

  const usageKey = trpc.chat.usage.queryKey();
  const grant = useMutation(
    trpc.chat.grantBonus.mutationOptions({
      onSuccess: (state) => {
        // The new count is in the answer; show it at once.
        qc.setQueryData(usageKey, (old) => (old ? { ...old, ...state } : old));
        void qc.invalidateQueries({ queryKey: usageKey });
        onGranted?.();
      },
      onError: (error) => {
        setNote(
          error.message === "NO_ADS_LEFT"
            ? "That was today's last ad. Pro, or tomorrow."
            : "The questions didn't get added. Try once more.",
        );
      },
    }),
  );

  const adsLeft = usage.data?.adsLeft ?? 0;
  const noAds = Boolean(usage.data) && adsLeft <= 0;

  async function watchAd() {
    setWatching(true);
    setNote(null);
    const earned = await showRewardedAd();
    setWatching(false);
    if (earned) grant.mutate();
    else setNote("No ad was available, or it closed early. Nothing was counted.");
  }

  return (
    <View style={{ gap: space.md }}>
      <Button
        variant="secondary"
        label={noAds ? "No more ads today" : "Watch an ad · 3 more questions"}
        icon={
          <Icon
            name="play-circle"
            size={22}
            color={noAds ? textColor.faintest : textColor.body}
          />
        }
        loading={watching || grant.isPending}
        loadingLabel={watching ? "Loading the ad…" : "Adding 3 questions…"}
        disabled={noAds || buying}
        onPress={() => void watchAd()}
      />
      <Button
        variant="pro"
        label="Go Pro · unlimited"
        icon={<Icon name="infinite" size={22} color={ink.base} />}
        loading={buying}
        loadingLabel="Opening the store…"
        disabled={watching || grant.isPending}
        onPress={buyPro}
      />
      {note ? (
        <Enter preset="slideLeft" style={{ flexDirection: "row", gap: space.sm }}>
          <Icon name="alert-circle" size={15} color={red.base} />
          <Text variant="caption" style={{ flex: 1 }}>
            {note}
          </Text>
        </Enter>
      ) : !noAds && usage.data ? (
        <Text variant="caption" style={{ textAlign: "center" }}>
          {adsLeft} {adsLeft === 1 ? "ad" : "ads"} left today
        </Text>
      ) : null}
    </View>
  );
}
