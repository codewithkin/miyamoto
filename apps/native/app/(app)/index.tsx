import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";

import { Blade, BladeRail, BladeTick } from "@/components/blade";
import { Animated, Enter, Stagger, useFlicker } from "@/components/motion";
import { CoachMarks } from "@/components/coach-marks";
import { Button, Screen, Text } from "@/components/ui";
import { trpc } from "@/utils/trpc";
import {
  gold,
  green,
  indigo,
  ink,
  radius,
  size,
  space,
  text as textColor,
} from "@/theme/tokens";

/**
 * 13 · Day N home.
 *
 * Today's trial is the only thing on this screen with a button. Everything
 * else — streak, score, the four acts, the story of the day — is context
 * for the one action, and lands after it.
 */
export default function PathHomeScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const today = useQuery(trpc.path.today.queryOptions());
  const acts = useQuery(trpc.path.acts.queryOptions());
  const featured = useQuery(trpc.library.mostSearched.queryOptions());

  const complete = useMutation(
    trpc.path.completeTrial.mutationOptions({
      onSuccess: () => {
        void qc.invalidateQueries();
      },
    }),
  );

  const flame = useFlicker((today.data?.streak ?? 0) > 0);
  const d = today.data;
  const hoursLeft = d ? Math.floor(d.msUntilReset / 3_600_000) : null;

  return (
    <Screen scroll>
      <View style={{ gap: space.section, paddingVertical: space.xl }}>
        {/* Where you are. */}
        <Enter preset="drop">
          <View style={{ gap: space.xxs }}>
            <Text variant="eyebrow">
              Day {d?.currentDay ?? 1} · {actLabel(d?.day?.act)}
            </Text>
            <Text variant="display">Morning, {d?.displayName ?? "you"}</Text>
          </View>
        </Enter>

        {/* Today's trial. */}
        <Enter preset="flip" delay={200}>
          <View
            style={{
              padding: space.section,
              borderRadius: radius.panel,
              backgroundColor: ink.surface,
              borderWidth: 1,
              borderColor: d?.completedToday ? green.base : indigo.base,
              gap: space.base,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <Blade state={d?.completedToday ? "complete" : "active"} length={14} delay={340} />
              <Text variant="eyebrow" style={{ flex: 1 }}>
                Today&apos;s trial
              </Text>
              {hoursLeft !== null && !d?.completedToday ? (
                <Text variant="caption">{hoursLeft}h left</Text>
              ) : null}
            </View>

            <Text variant="voice" style={{ fontSize: size.subtitle }}>
              {d?.trial?.body ?? "Loading your trial…"}
            </Text>

            {d?.day ? <Text variant="caption">{d.day.brief}</Text> : null}

            {d?.completedToday ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                <BladeTick done />
                <Text variant="label" color={green.fg}>
                  Done today
                </Text>
              </View>
            ) : (
              <Button
                label={complete.isPending ? "Marking…" : "Mark complete"}
                variant="confirm"
                disabled={complete.isPending || !d?.trial}
                onPress={() => complete.mutate({})}
              />
            )}
          </View>
        </Enter>

        {/* Numbers. */}
        <Stagger initialDelay={520} step={90} style={{ flexDirection: "row", gap: space.base }}>
          <Enter preset="pop" style={{ flex: 1 }}>
            <Stat
              value={String(d?.streak ?? 0)}
              label="Streak"
              icon={
                <Animated.View style={flame}>
                  <Ionicons name="flame" size={16} color={gold.base} />
                </Animated.View>
              }
            />
          </Enter>
          <Enter preset="pop" style={{ flex: 1 }}>
            <Stat value={String(d?.bushidoScore ?? 0)} label="Bushido" />
          </Enter>
          <Enter preset="pop" style={{ flex: 1 }}>
            <Stat value={`${d?.currentDay ?? 1}/30`} label="Day" />
          </Enter>
        </Stagger>

        {/* The four acts. */}
        <Enter preset="rise" delay={760}>
          <View style={{ gap: space.base }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text variant="eyebrow" style={{ flex: 1 }}>
                The 30 days
              </Text>
            </View>
            <View style={{ gap: space.md }}>
              {(acts.data ?? []).map((a, i) => (
                <Enter key={a.act} preset="slideLeft" delay={860 + i * 90}>
                  <View style={{ gap: space.xs }}>
                    <View style={{ flexDirection: "row" }}>
                      <Text
                        variant="label"
                        color={a.active ? textColor.primary : textColor.faintest}
                        style={{ flex: 1 }}
                      >
                        {a.label}
                      </Text>
                      <Text variant="caption">
                        {Math.max(0, a.done)}/{a.total}
                      </Text>
                    </View>
                    <BladeRail
                      count={a.total}
                      progress={Math.max(0, a.done)}
                      activeIndex={a.active ? Math.max(0, a.done) : undefined}
                      delay={900 + i * 90}
                      step={26}
                    />
                  </View>
                </Enter>
              ))}
            </View>
          </View>
        </Enter>

        {/* Adversity of the day. */}
        {featured.data?.[0] ? (
          <Enter preset="zoomUp" delay={1240}>
            <Pressable
              onPress={() => router.push(`/story/${featured.data![0]!.slug}`)}
              style={{
                padding: space.xl,
                borderRadius: radius.card,
                backgroundColor: ink.raised,
                borderWidth: 1,
                borderColor: ink.border,
                gap: space.sm,
              }}
            >
              <Text variant="eyebrow">Adversity of the day</Text>
              <Text variant="title" style={{ fontSize: size.lead }}>
                &ldquo;{featured.data[0].title}&rdquo;
              </Text>
              <Text variant="caption">
                {featured.data[0].master.name} · {featured.data[0].readSeconds}s
              </Text>
            </Pressable>
          </Enter>
        ) : null}
      </View>

      <CoachMarks />
    </Screen>
  );
}

function Stat({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <View
      style={{
        padding: space.base,
        borderRadius: radius.card,
        backgroundColor: ink.surface,
        borderWidth: 1,
        borderColor: ink.border,
        gap: 2,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
        {icon}
        <Text variant="numeral">{value}</Text>
      </View>
      <Text variant="caption">{label}</Text>
    </View>
  );
}

function actLabel(act?: string | null) {
  switch (act) {
    case "FACE_IT":
      return "Act I · Face it";
    case "CONTROL_IT":
      return "Act II · Control it";
    case "ENDURE_IT":
      return "Act III · Endure it";
    case "BECOME_IT":
      return "Act IV · Become it";
    default:
      return "Act I · Face it";
  }
}
