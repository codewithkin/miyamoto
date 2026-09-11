import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { BladeRail } from "@/components/blade";
import { Chevron, Icon, IconBadge } from "@/components/icon";
import { MasterAvatar } from "@/components/master-avatar";
import { Animated, Enter, Stagger, useFlicker } from "@/components/motion";
import { CoachMarks } from "@/components/coach-marks";
import { Touchable } from "@/components/touchable";
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
 *
 * The trial card is the only surface with a coloured ground: indigo while it
 * is open, green once it is done. When it is done, the card's one action
 * becomes the next useful thing — talking it through with the Master — so
 * the screen always has exactly one obvious move.
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

        {/* Today's trial — the focus. */}
        <Enter preset="flip" delay={200}>
          <View
            style={{
              padding: space.section,
              borderRadius: radius.panel,
              backgroundColor: d?.completedToday ? green.tint : indigo.tint,
              borderWidth: 1.5,
              borderColor: d?.completedToday ? green.base : indigo.base,
              gap: space.base,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <Icon
                name={d?.completedToday ? "checkmark-circle" : "flag"}
                size={16}
                color={d?.completedToday ? green.fg : indigo.light}
              />
              <Text
                variant="eyebrow"
                color={d?.completedToday ? green.fg : indigo.light}
                style={{ flex: 1 }}
              >
                {d?.completedToday ? "Done today" : "Today\u2019s trial"}
              </Text>
              {hoursLeft !== null && !d?.completedToday ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingVertical: 3,
                    paddingHorizontal: space.md,
                    borderRadius: radius.pill,
                    backgroundColor: ink.base,
                  }}
                >
                  <Icon name="time-outline" size={13} color={textColor.muted} />
                  <Text variant="caption" color={textColor.muted}>
                    {hoursLeft}h left
                  </Text>
                </View>
              ) : null}
            </View>

            <Text variant="voice" style={{ fontSize: size.title, lineHeight: size.title * 1.4 }}>
              {d?.trial?.body ?? "Loading your trial…"}
            </Text>

            {d?.day ? (
              <Text variant="caption" color={textColor.secondaryDim}>
                {d.day.brief}
              </Text>
            ) : null}

            {d?.master ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                <MasterAvatar slug={d.master.slug} name={d.master.name} size={28} />
                <Text variant="caption" color={textColor.secondaryDim} style={{ flex: 1 }}>
                  Set by {d.master.name}
                </Text>
              </View>
            ) : null}

            {d?.completedToday ? (
              <Button
                label={`Talk it through with ${d.master?.name ?? "your Master"}`}
                variant="secondary"
                onPress={() => router.push("/(app)/chat")}
              />
            ) : (
              <Button
                label="Mark complete"
                variant="confirm"
                loading={complete.isPending}
                loadingLabel="Marking…"
                disabled={!d?.trial}
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
              accent={gold.base}
              icon={
                <Animated.View style={flame}>
                  <Ionicons name="flame" size={16} color={gold.base} />
                </Animated.View>
              }
            />
          </Enter>
          <Enter preset="pop" style={{ flex: 1 }}>
            <Stat
              value={String(d?.bushidoScore ?? 0)}
              label="Bushido"
              accent={indigo.light}
              icon={<Ionicons name="shield-half" size={15} color={indigo.light} />}
            />
          </Enter>
          <Enter preset="pop" style={{ flex: 1 }}>
            <Stat
              value={`${d?.currentDay ?? 1}/30`}
              label="Day"
              icon={<Ionicons name="calendar-outline" size={15} color={textColor.muted} />}
            />
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
            <Touchable
              feel="row"
              onPress={() => router.push(`/story/${featured.data![0]!.slug}`)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space.base,
                padding: space.xl,
                borderRadius: radius.card,
                backgroundColor: ink.raised,
                borderWidth: 1,
                borderColor: ink.border,
              }}
            >
              <View style={{ flex: 1, gap: space.sm }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                  <IconBadge name="book-outline" size={24} />
                  <Text variant="eyebrow">Adversity of the day</Text>
                </View>
                <Text variant="title" style={{ fontSize: size.lead }}>
                  &ldquo;{featured.data[0].title}&rdquo;
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                  <MasterAvatar
                    slug={featured.data[0].master.slug}
                    name={featured.data[0].master.name}
                    size={22}
                  />
                  <Text variant="caption">
                    {featured.data[0].master.name} · {featured.data[0].readSeconds}s read
                  </Text>
                </View>
              </View>
              <Chevron />
            </Touchable>
          </Enter>
        ) : null}
      </View>

      <CoachMarks from={d?.master?.name} />
    </Screen>
  );
}

function Stat({
  value,
  label,
  icon,
  accent = textColor.primary,
}: {
  value: string;
  label: string;
  icon?: React.ReactNode;
  accent?: string;
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
        <Text variant="numeral" color={accent}>
          {value}
        </Text>
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
