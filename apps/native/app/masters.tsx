import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { MasterAvatar } from "@/components/master-avatar";
import { Enter, Stagger } from "@/components/motion";
import { ScreenHero } from "@/components/screen-hero";
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
 *
 * The header now says what the ladder actually is, not only a count of it
 * (plan 08), and the two locked states — waiting for a day, waiting for
 * Pro — get their own border colour so the difference reads before the
 * trailing label does.
 */
export default function MastersScreen() {
  const router = useRouter();
  const masters = useQuery(trpc.library.masters.queryOptions());
  const createThread = useMutation(
    trpc.chat.createThread.mutationOptions({ onSuccess: () => router.push("/(app)/chat") }),
  );

  const list = masters.data ?? [];
  const earned = list.filter((m) => m.available).length;

  return (
    <Screen scroll>
      <View style={{ gap: space.section, paddingVertical: space.xl }}>
        <ScreenHero
          eyebrow={`${earned} of ${list.length || MASTERS.length} earned`}
          title="The Masters"
          lead="Musashi from Day 1. The rest are earned by staying on the path — or Pro skips the wait."
          visual={
            <View style={{ flexDirection: "row" }}>
              {list
                .filter((m) => m.available)
                .slice(0, 3)
                .map((m, i) => (
                  <View
                    key={m.id}
                    style={{
                      marginLeft: i === 0 ? 0 : -12,
                      borderRadius: 20,
                      borderWidth: 2,
                      borderColor: ink.base,
                    }}
                  >
                    <MasterAvatar slug={m.slug} name={m.name} size={36} />
                  </View>
                ))}
            </View>
          }
        />

        <Stagger initialDelay={220} step={110} style={{ gap: space.base }}>
          {list.map((m) => {
            const isProLocked = !m.available && m.lockReason === "PRO";
            const isDayLocked = !m.available && m.lockReason !== "PRO";
            return (
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
                    backgroundColor: m.available
                      ? ink.surface
                      : isProLocked
                        ? gold.tint
                        : ink.surfaceDim,
                    borderWidth: isProLocked ? 1.5 : 1,
                    borderColor: m.available
                      ? ink.border
                      : isProLocked
                        ? gold.tintAlt
                        : ink.borderDim,
                    gap: space.sm,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: space.base }}>
                    <MasterAvatar
                      slug={m.slug}
                      name={m.name}
                      size={52}
                      locked={!m.available}
                      pro={isProLocked}
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
                      color={m.available ? indigo.light : isProLocked ? gold.base : textColor.faintest}
                    >
                      {m.available ? "Speak" : isProLocked ? "Pro" : `Day ${m.unlockDay}`}
                    </Text>
                  </View>
                  <Text
                    variant="caption"
                    color={
                      m.available ? undefined : isDayLocked ? textColor.faintest : textColor.muted
                    }
                  >
                    {m.domains.join(" · ")}
                  </Text>
                </Touchable>
              </Enter>
            );
          })}
        </Stagger>
      </View>
    </Screen>
  );
}
