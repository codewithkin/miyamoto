import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";

import { Blade } from "@/components/blade";
import { Enter, Stagger } from "@/components/motion";
import { Screen, Text } from "@/components/ui";
import { trpc } from "@/utils/trpc";
import { gold, indigo, ink, radius, size, space, text as textColor } from "@/theme/tokens";

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
              {earned} of {masters.data?.length ?? 5} earned
            </Text>
            <Text variant="display">The Masters</Text>
          </View>
        </Enter>

        <Stagger initialDelay={220} step={110} style={{ gap: space.base }}>
          {(masters.data ?? []).map((m) => (
            <Enter key={m.id} preset="swing">
              <Pressable
                disabled={!m.available || createThread.isPending}
                onPress={() => createThread.mutate({ masterSlug: m.slug })}
                style={({ pressed }) => ({
                  padding: space.xl,
                  borderRadius: radius.card,
                  backgroundColor: m.available ? ink.surface : ink.surfaceDim,
                  borderWidth: 1,
                  borderColor: m.available ? ink.border : ink.borderDim,
                  opacity: m.available ? (pressed ? 0.85 : 1) : 0.55,
                  gap: space.sm,
                })}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.base }}>
                  <Blade
                    state={m.available ? "complete" : m.lockReason === "PRO" ? "locked" : "empty"}
                    length={16}
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="title" style={{ fontSize: size.lead }}>
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
                <Text variant="caption">{m.domains.join(" · ")}</Text>
              </Pressable>
            </Enter>
          ))}
        </Stagger>
      </View>
    </Screen>
  );
}
