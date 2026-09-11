import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";

import { Chevron, IconBadge, type IconName } from "@/components/icon";
import { MasterAvatar } from "@/components/master-avatar";
import { MoreQuestions } from "@/components/more-questions";
import { Touchable } from "@/components/touchable";
import { Enter, Stagger } from "@/components/motion";
import { ScreenHero } from "@/components/screen-hero";
import { Screen, Text } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { gold, indigo, ink, radius, size, space, text as textColor } from "@/theme/tokens";

/**
 * 19 · Profile and your Code.
 *
 * The Code is the emotional centre of the screen, so it is set in Caveat —
 * the user's own hand — and unfurls line by line rather than appearing as a
 * block of text. Before Day 29 it shows what is coming instead.
 *
 * The header carries the face of whoever the user is walking this with
 * (plan 08 — this is someone's dojo, not an anonymous stats page), the
 * three numbers get an icon and an accent apiece instead of reading as
 * three identical grey boxes, and the Code sits on a warmer, gold-leaning
 * ground so it reads as the one thing on the screen worth writing by hand.
 */
export default function YouScreen() {
  const router = useRouter();
  const today = useQuery(trpc.path.today.queryOptions());
  const code = useQuery(trpc.path.code.queryOptions());
  const usage = useQuery(trpc.chat.usage.queryOptions());
  const [signingOut, setSigningOut] = React.useState(false);

  const d = today.data;
  const daysToCode = Math.max(0, 29 - (d?.currentDay ?? 1));

  return (
    <Screen scroll>
      <View style={{ gap: space.section, paddingVertical: space.xl }}>
        <ScreenHero
          eyebrow={`Day ${d?.currentDay ?? 1} of 30`}
          title={d?.displayName ?? "You"}
          lead={`${d?.streak ?? 0}-day streak, walking with ${d?.master?.name ?? "a Master"}`}
          visual={
            d?.master ? (
              <MasterAvatar slug={d.master.slug} name={d.master.name} size={56} active />
            ) : undefined
          }
        />

        <Stagger initialDelay={200} step={90} style={{ flexDirection: "row", gap: space.base }}>
          <Enter preset="pop" style={{ flex: 1 }}>
            <Stat
              icon="shield-half"
              value={String(d?.bushidoScore ?? 0)}
              label="Bushido"
              accent={indigo.light}
            />
          </Enter>
          <Enter preset="pop" style={{ flex: 1 }}>
            <Stat
              icon="trophy-outline"
              value={String(d?.longestStreak ?? 0)}
              label="Best streak"
              accent={gold.base}
            />
          </Enter>
          <Enter preset="pop" style={{ flex: 1 }}>
            <Stat
              icon={usage.data?.isPro ? "diamond" : "person-outline"}
              value={usage.data?.isPro ? "Pro" : "Free"}
              label="Plan"
              accent={usage.data?.isPro ? gold.base : textColor.muted}
            />
          </Enter>
        </Stagger>

        {/* The Code — the one thing on this screen worth writing by hand. */}
        <Enter preset="rise" delay={520}>
          <View
            style={{
              padding: space.section,
              borderRadius: radius.panel,
              backgroundColor: gold.tint,
              borderWidth: 1.5,
              borderColor: gold.tintAlt,
              gap: space.base,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <IconBadge name="ribbon-outline" color={gold.base} background={ink.base} size={30} />
              <Text variant="eyebrow" color={gold.base} style={{ flex: 1 }}>
                Your Bushido Code
              </Text>
            </View>

            {code.data?.lines?.length ? (
              <Stagger initialDelay={680} step={200} style={{ gap: space.md }}>
                {code.data.lines.map((line, i) => (
                  <Enter key={i} preset="slideLeft">
                    <View style={{ flexDirection: "row", gap: space.base }}>
                      <Text variant="hand" color={gold.base}>
                        {i + 1}.
                      </Text>
                      <Text variant="hand" style={{ flex: 1 }}>
                        {line}
                      </Text>
                    </View>
                  </Enter>
                ))}
              </Stagger>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.base }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    borderWidth: 2,
                    borderColor: gold.tintAlt,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text variant="numeral" color={gold.base} style={{ fontSize: 16 }}>
                    {daysToCode}
                  </Text>
                </View>
                <Text variant="caption" style={{ flex: 1 }}>
                  Written on Day 29, from the thirty days you actually lived. {daysToCode}{" "}
                  {daysToCode === 1 ? "day" : "days"} away.
                </Text>
              </View>
            )}
          </View>
        </Enter>

        {/* Today's questions, with the two ways to more (plan 13). Free
            accounts only: Pro has no counter to show. */}
        {usage.data && !usage.data.isPro ? (
          <Enter preset="rise" delay={760}>
            <View
              style={{
                padding: space.xl,
                borderRadius: radius.card,
                backgroundColor: ink.surface,
                borderWidth: 1,
                borderColor: ink.border,
                gap: space.base,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                <IconBadge name="chatbubbles-outline" color={indigo.light} size={30} />
                <Text variant="eyebrow" style={{ flex: 1 }}>
                  Today&apos;s questions
                </Text>
                <Text variant="numeral" color={indigo.light} style={{ fontSize: size.title }}>
                  {usage.data.remaining}/{usage.data.limit}
                </Text>
              </View>
              <Text variant="caption">
                {usage.data.remaining
                  ? "Watch an ad for three more, or go Pro and stop counting."
                  : "None left today. Watch an ad for three more, or go Pro and stop counting."}
              </Text>
              <MoreQuestions />
            </View>
          </Enter>
        ) : null}

        <Stagger initialDelay={900} step={80} style={{ gap: space.md }}>
          <Enter preset="slideLeft">
            <Row icon="people-outline" label="The Masters" onPress={() => router.push("/masters")} />
          </Enter>
          <Enter preset="slideLeft">
            <Row
              icon="diamond-outline"
              label={usage.data?.isPro ? "Miyamoto Pro · active" : "Miyamoto Pro"}
              accent={!usage.data?.isPro}
              onPress={() => router.push("/paywall")}
            />
          </Enter>
          <Enter preset="slideLeft">
            <Row icon="settings-outline" label="Settings" onPress={() => router.push("/settings")} />
          </Enter>
          <Enter preset="slideLeft">
            <Row
              icon="log-out-outline"
              label="Sign out"
              loading={signingOut}
              onPress={async () => {
                if (signingOut) return;
                setSigningOut(true);
                // Signed out on this phone even if the server can't be
                // reached: the plugin clears the stored session either way.
                await authClient.signOut().catch(() => {});
                setSigningOut(false);
                router.replace("/");
              }}
            />
          </Enter>
        </Stagger>
      </View>
    </Screen>
  );
}

function Stat({
  icon,
  value,
  label,
  accent,
}: {
  icon: IconName;
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <View
      style={{
        padding: space.base,
        borderRadius: radius.card,
        backgroundColor: ink.surface,
        borderWidth: 1,
        borderColor: ink.border,
        gap: space.sm,
      }}
    >
      <IconBadge name={icon} color={accent} background={ink.raised} size={28} />
      <View style={{ gap: 2 }}>
        <Text variant="numeral" color={accent}>
          {value}
        </Text>
        <Text variant="caption">{label}</Text>
      </View>
    </View>
  );
}

function Row({
  icon,
  label,
  accent,
  onPress,
  loading = false,
}: {
  icon: IconName;
  label: string;
  accent?: boolean;
  onPress: () => void;
  /** Waiting on the server: a spinner for the chevron, presses ignored. */
  loading?: boolean;
}) {
  return (
    <Touchable
      feel="row"
      onPress={onPress}
      disabled={loading}
      dimWhenDisabled={false}
      accessibilityState={{ busy: loading }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.base,
        padding: space.xl,
        borderRadius: radius.card,
        backgroundColor: ink.surface,
        borderWidth: 1,
        borderColor: accent ? gold.tintAlt : ink.border,
      }}
    >
      <IconBadge name={icon} color={accent ? gold.base : indigo.light} size={32} />
      <Text variant="label" style={{ flex: 1, fontSize: size.body }}>
        {label}
      </Text>
      {loading ? (
        <ActivityIndicator size="small" color={indigo.light} />
      ) : accent ? (
        <Text variant="eyebrow" color={gold.base}>
          Upgrade
        </Text>
      ) : (
        <Chevron />
      )}
    </Touchable>
  );
}
