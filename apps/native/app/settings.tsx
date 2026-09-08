import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { Blade } from "@/components/blade";
import { Enter, Stagger } from "@/components/motion";
import { Touchable } from "@/components/touchable";
import { Screen, Text } from "@/components/ui";
import { REMINDER_TIMES } from "@/content/onboarding-options";
import { usePurchases } from "@/lib/purchases";
import { trpc } from "@/utils/trpc";
import { gold, indigo, ink, radius, red, size, space, text as textColor } from "@/theme/tokens";

/**
 * Settings.
 *
 * Reachable at Profile → Settings, which is the path the Terms and the
 * store listing both name. Account deletion lives at the bottom, in red,
 * behind its own screen — visible enough to satisfy Play's requirement
 * that it be easy to find, far enough down that it is not the first thing
 * a thumb lands on.
 */
export default function SettingsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { isPro, restore } = usePurchases();

  const account = useQuery(trpc.account.overview.queryOptions());
  const setReminders = useMutation(
    trpc.account.setReminders.mutationOptions({ onSuccess: () => void qc.invalidateQueries() }),
  );

  const [restoring, setRestoring] = React.useState(false);
  const a = account.data;

  return (
    <Screen scroll>
      <Enter preset="drop">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: space.base,
            paddingVertical: space.lg,
          }}
        >
          <Touchable feel="row" onPress={() => router.back()} hitSlop={12}>
            <Text variant="title" color={textColor.muted}>
              ←
            </Text>
          </Touchable>
          <Text variant="title">Settings</Text>
        </View>
      </Enter>

      <View style={{ gap: space.section, paddingBottom: space.screen }}>
        {/* Account */}
        <Enter preset="rise" delay={120}>
          <Group title="Account">
            <Row label="Signed in as" value={a?.email ?? "…"} />
            <Row label="Plan" value={a?.isPro ? "Miyamoto Pro" : "Free · 3 questions a day"} />
            <Row label="Time zone" value={a?.timezone ?? "…"} />
          </Group>
        </Enter>

        {/* What you've done — the numbers the export will contain. */}
        <Enter preset="rise" delay={240}>
          <Group title="Your record">
            <Row label="Conversations" value={String(a?.threads ?? 0)} />
            <Row label="Trials completed" value={String(a?.trialsCompleted ?? 0)} />
            <Row label="Charges" value={String(a?.charges ?? 0)} />
          </Group>
        </Enter>

        {/* Reminders */}
        <Enter preset="rise" delay={360}>
          <Group title="Trial reminders">
            <View style={{ flexDirection: "row", gap: space.md, paddingTop: space.sm }}>
              {REMINDER_TIMES.map((t) => (
                <Touchable
                  key={t}
                  feel="chip"
                  onPress={() => setReminders.mutate({ enabled: true, morning: t })}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: space.base,
                    borderRadius: radius.pill,
                    backgroundColor: ink.high,
                    borderWidth: 1,
                    borderColor: ink.border,
                  }}
                >
                  <Text variant="label" style={{ fontSize: size.body }}>
                    {t}
                  </Text>
                </Touchable>
              ))}
            </View>
            <Touchable
              feel="row"
              onPress={() => setReminders.mutate({ enabled: false })}
              style={{ paddingTop: space.base }}
            >
              <Text variant="caption" color={textColor.muted}>
                Turn reminders off entirely
              </Text>
            </Touchable>
          </Group>
        </Enter>

        {/* Purchases */}
        <Enter preset="rise" delay={480}>
          <Group title="Purchases">
            <LinkRow
              label={restoring ? "Checking…" : "Restore purchase"}
              onPress={async () => {
                setRestoring(true);
                await restore();
                setRestoring(false);
                void qc.invalidateQueries();
              }}
            />
            {!isPro ? <LinkRow label="See Pro" onPress={() => router.push("/paywall")} /> : null}
            <Text variant="caption" style={{ paddingTop: space.sm }}>
              Subscriptions are billed by your store. Cancel there — cancelling in the app
              doesn&apos;t stop billing.
            </Text>
          </Group>
        </Enter>

        {/* Legal — Play wants these reachable from inside the app. */}
        <Enter preset="rise" delay={600}>
          <Group title="Legal">
            <LinkRow
              label="Privacy Policy"
              onPress={() => void Linking.openURL("https://miyamoto.app/privacy")}
            />
            <LinkRow
              label="Terms of Service"
              onPress={() => void Linking.openURL("https://miyamoto.app/terms")}
            />
            <LinkRow
              label="Support"
              onPress={() => void Linking.openURL("https://miyamoto.app/support")}
            />
          </Group>
        </Enter>

        {/* Your data */}
        <Enter preset="rise" delay={720}>
          <Group title="Your data">
            <LinkRow label="Export my data" onPress={() => router.push("/export-data")} />
            <Touchable
              feel="danger"
              onPress={() => router.push("/delete-account")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space.base,
                paddingVertical: space.base,
              }}
            >
              <Blade state="broken" length={14} />
              <Text variant="label" color={red.base} style={{ flex: 1, fontSize: size.body }}>
                Delete my account
              </Text>
              <Text variant="eyebrow" color={textColor.faintest}>
                ›
              </Text>
            </Touchable>
          </Group>
        </Enter>
      </View>
    </Screen>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text variant="eyebrow">{title}</Text>
      <View
        style={{
          backgroundColor: ink.surface,
          borderRadius: radius.card,
          borderWidth: 1,
          borderColor: ink.border,
          padding: space.xl,
          gap: space.sm,
        }}
      >
        {children}
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: space.xs }}>
      <Text variant="caption" style={{ flex: 1 }}>
        {label}
      </Text>
      <Text variant="label" style={{ fontSize: size.body }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Touchable
      feel="row"
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.base,
        paddingVertical: space.base,
      }}
    >
      <Text variant="label" style={{ flex: 1, fontSize: size.body }}>
        {label}
      </Text>
      <Text variant="eyebrow" color={indigo.light}>
        ›
      </Text>
    </Touchable>
  );
}
