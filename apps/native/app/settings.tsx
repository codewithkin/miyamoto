import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";

import { Enter, Stagger } from "@/components/motion";
import { Touchable } from "@/components/touchable";
import { Screen, Text } from "@/components/ui";
import { BackButton, Chevron, Icon } from "@/components/icon";
import { REMINDER_TIMES } from "@/content/onboarding-options";
import { LINKS } from "@/lib/links";
import { requestReminderPermission } from "@/lib/notifications";
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
  // The chosen time lights up on the tap (D-049), and the app shell's
  // schedule follows the same cache, so the phone's reminders move with it.
  // A refusal puts both back and says so.
  const overviewKey = trpc.account.overview.queryKey();
  const setReminders = useMutation(
    trpc.account.setReminders.mutationOptions({
      onMutate: async (input) => {
        await qc.cancelQueries({ queryKey: overviewKey });
        const previous = qc.getQueryData(overviewKey);
        qc.setQueryData(overviewKey, (old) =>
          old
            ? {
                ...old,
                reminders: {
                  ...old.reminders,
                  enabled: input.enabled,
                  morning: input.morning ?? old.reminders.morning,
                },
              }
            : old,
        );
        return { previous };
      },
      onError: (_error, _input, context) => {
        if (context?.previous) qc.setQueryData(overviewKey, context.previous);
        setReminderNote("That didn't save. Try again.");
      },
      onSettled: () => {
        void qc.invalidateQueries({ queryKey: overviewKey });
      },
    }),
  );

  const [restoring, setRestoring] = React.useState(false);
  const [reminderNote, setReminderNote] = React.useState<string | null>(null);

  // Choosing a time is the user asking for reminders, so this is a fair
  // place to raise the prompt — but only this, and only once (see
  // lib/notifications). Without permission nothing is switched on, because a
  // reminder the phone will not deliver is a setting that lies.
  async function remindAt(time: string) {
    const outcome = await requestReminderPermission();
    if (outcome !== "granted") {
      setReminderNote("Notifications are off for Miyamoto in your phone's settings. Turn them on there first.");
      return;
    }
    setReminderNote(null);
    setReminders.mutate({ enabled: true, morning: time });
  }
  const a = account.data;
  const reminders = a?.reminders;

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
          <BackButton onPress={() => router.back()} />
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
              {REMINDER_TIMES.map((t) => {
                const chosen = Boolean(reminders?.enabled) && reminders?.morning === t;
                return (
                  <Touchable
                    key={t}
                    feel="chip"
                    accessibilityRole="radio"
                    accessibilityState={{ checked: chosen }}
                    disabled={setReminders.isPending}
                    dimWhenDisabled={!chosen}
                    onPress={() => void remindAt(t)}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      paddingVertical: space.base,
                      borderRadius: radius.pill,
                      backgroundColor: chosen ? indigo.tint : ink.high,
                      borderWidth: chosen ? 1.5 : 1,
                      borderColor: chosen ? indigo.base : ink.border,
                    }}
                  >
                    <Text
                      variant="label"
                      color={chosen ? textColor.primary : undefined}
                      style={{ fontSize: size.body }}
                    >
                      {t}
                    </Text>
                  </Touchable>
                );
              })}
            </View>
            {reminderNote ? (
              <Text variant="caption" color={textColor.muted} style={{ paddingTop: space.sm }}>
                {reminderNote}
              </Text>
            ) : null}
            {reminders?.enabled ? (
              <Touchable
                feel="row"
                disabled={setReminders.isPending}
                onPress={() => setReminders.mutate({ enabled: false })}
                style={{ paddingTop: space.base }}
              >
                <Text variant="caption" color={textColor.muted}>
                  Every morning at {reminders.morning}. Turn reminders off
                </Text>
              </Touchable>
            ) : (
              <Text variant="caption" style={{ paddingTop: space.base }}>
                Off. Pick a time to be reminded each morning.
              </Text>
            )}
          </Group>
        </Enter>

        {/* Purchases */}
        <Enter preset="rise" delay={480}>
          <Group title="Purchases">
            <LinkRow
              label={restoring ? "Checking…" : "Restore purchase"}
              loading={restoring}
              onPress={async () => {
                setRestoring(true);
                await restore().catch(() => false);
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
              onPress={() => void Linking.openURL(LINKS.privacy)}
            />
            <LinkRow
              label="Terms of Service"
              onPress={() => void Linking.openURL(LINKS.terms)}
            />
            <LinkRow
              label="Support"
              onPress={() => void Linking.openURL(LINKS.support)}
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
              <Icon name="trash-outline" size={18} color={red.base} />
              <Text variant="label" color={red.base} style={{ flex: 1, fontSize: size.body }}>
                Delete my account
              </Text>
              <Chevron />
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

function LinkRow({
  label,
  onPress,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  /** Waiting on the store or the server: a spinner for the chevron, presses ignored. */
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
        paddingVertical: space.base,
      }}
    >
      <Text variant="label" style={{ flex: 1, fontSize: size.body }}>
        {label}
      </Text>
      {loading ? (
        <ActivityIndicator size="small" color={indigo.light} />
      ) : (
        <Chevron color={indigo.light} />
      )}
    </Touchable>
  );
}
