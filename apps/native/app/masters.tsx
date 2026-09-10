import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { MasterAvatar } from "@/components/master-avatar";
import { Enter, Stagger } from "@/components/motion";
import { Touchable } from "@/components/touchable";
import { Screen, Text } from "@/components/ui";
import { trpc } from "@/utils/trpc";
import { gold, indigo, ink, radius, size, space, text as textColor } from "@/theme/tokens";
import { MASTERS } from "@/content/onboarding-options";

/**
 * 18 · The Masters.
 *
 * The roster doubles as the progress display: what you have earned, what
 * arrives on which day, and what Pro skips the wait for. Locked rows are
 * dimmed but complete — you can read who is coming.
 */
export default function MastersScreen() {
  const router = useRouter();
  const masters = useQuery(trpc.library.masters.queryOptions());
  const createThread = useMutation(
    trpc.chat.createThread.mutationOptions({ onSuccess: () => router.push("/(app)/chat") }),
  );

  const earned = (masters.data ?? []).filter((m) => m.available).length;

  return (
    <Screen scroll>
      <View style={{ gap: space.section, paddingVertical: space.xl }}>
        <Enter preset="drop">
          <View style={{ gap: space.xxs }}>
            <Text variant="eyebrow">
              {earned} of {masters.data?.length ?? MASTERS.length} earned
            </Text>
            <Text variant="display">The Masters</Text>
          </View>
        </Enter>

        <Stagger initialDelay={220} step={110} style={{ gap: space.base }}>
          {(masters.data ?? []).map((m) => (
            <Enter key={m.id} preset="swing">
              <Touchable
                feel={m.available ? "row" : "danger"}
                disabled={createThread.isPending}
                onPress={() => {
                  if (m.available) createThread.mutate({ masterSlug: m.slug });
                }}
                style={{
                  padding: space.xl,
                  borderRadius: radius.card,
                  backgroundColor: m.available ? ink.surface : ink.surfaceDim,
                  borderWidth: 1,
                  borderColor: m.available ? ink.border : ink.borderDim,
                  gap: space.sm,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.base }}>
                  <MasterAvatar
                    slug={m.slug}
                    name={m.name}
                    size={52}
                    locked={!m.available}
                    pro={m.lockReason === "PRO"}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      variant="title"
                      color={m.available ? textColor.primary : textColor.muted}
                      style={{ fontSize: size.lead }}
                    >
                      {m.name}
                    </Text>
                    <Text variant="caption">
                      {m.title} · {m.tone}
                    </Text>
                  </View>
                  <Text
                    variant="eyebrow"
                    color={
                      m.available
                        ? indigo.light
                        : m.lockReason === "PRO"
                          ? gold.base
                          : textColor.faintest
                    }
                  >
                    {m.available ? "Speak" : m.lockReason === "PRO" ? "Pro" : `Day ${m.unlockDay}`}
                  </Text>
                </View>
                <Text variant="caption" color={m.available ? undefined : textColor.faintest}>
                  {m.domains.join(" · ")}
                </Text>
              </Touchable>
            </Enter>
          ))}
        </Stagger>
      </View>
    </Screen>
  );
}
