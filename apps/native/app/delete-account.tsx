import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { TextInput, View } from "react-native";

import { Blade } from "@/components/blade";
import { Enter, Stagger } from "@/components/motion";
import { Touchable } from "@/components/touchable";
import { Button, Screen, Text } from "@/components/ui";
import { BackButton } from "@/components/icon";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { gold, ink, radius, red, size, space, text as textColor } from "@/theme/tokens";

/**
 * In-app account deletion — the route Google Play requires.
 *
 * The session already proves who is asking, so there is no emailed token
 * here. What there is instead is friction proportionate to the outcome:
 * the user retypes their own email, because this is irreversible and one
 * mistaken tap should not be able to do it.
 */

const GOES = [
  "Your account, name and email",
  "Every conversation, trial, journal note and attachment",
  "Your streak, Bushido score and earned Masters",
];

const TIMELINE = [
  { when: "Right away", what: "Sign-in stops working and the account is locked." },
  { when: "Within 72 hours", what: "Conversations, trials and attachments leave live systems." },
  { when: "Within 30 days", what: "Backups roll over and the last copies are gone." },
];

export default function DeleteAccountScreen() {
  const router = useRouter();
  const account = useQuery(trpc.account.overview.queryOptions());
  const [typed, setTyped] = React.useState("");

  const del = useMutation(
    trpc.account.deleteAccount.mutationOptions({
      onSuccess: async () => {
        // The account is gone; the local session has nothing left to point
        // at, so clear it and return to the start rather than leaving a
        // signed-in shell behind.
        await authClient.signOut().catch(() => {});
        router.replace("/");
      },
    }),
  );

  const email = account.data?.email ?? "";
  const matches = typed.trim().toLowerCase() === email.toLowerCase() && email.length > 0;

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
          <Text variant="eyebrow">Your data</Text>
        </View>
      </Enter>

      <View style={{ gap: space.section, paddingBottom: space.screen }}>
        <View style={{ gap: space.md }}>
          <Enter preset="rise" delay={100}>
            <Text variant="display">Delete your account</Text>
          </Enter>
          <Enter preset="rise" delay={240}>
            <Text variant="lead">
              This cannot be undone. Your 30 days will not be recoverable.
            </Text>
          </Enter>
        </View>

        {/* What goes. */}
        <Enter preset="rise" delay={380}>
          <View style={{ gap: space.base }}>
            <Text variant="eyebrow">What gets deleted</Text>
            <Stagger initialDelay={460} step={80} style={{ gap: space.md }}>
              {GOES.map((g) => (
                <Enter key={g} preset="slideLeft">
                  <View style={{ flexDirection: "row", gap: space.base, alignItems: "flex-start" }}>
                    <View style={{ paddingTop: 7 }}>
                      <Blade state="broken" length={12} />
                    </View>
                    <Text variant="label" style={{ flex: 1, fontSize: size.body }}>
                      {g}
                    </Text>
                  </View>
                </Enter>
              ))}
            </Stagger>
          </View>
        </Enter>

        {/* What is kept, and why. */}
        <Enter preset="rise" delay={720}>
          <View
            style={{
              padding: space.xl,
              borderRadius: radius.card,
              backgroundColor: gold.tint,
              borderWidth: 1,
              borderColor: gold.tintAlt,
              gap: space.sm,
            }}
          >
            <Text variant="eyebrow" color={gold.base}>
              What we have to keep
            </Text>
            <Text variant="caption">
              Purchase receipts, for up to 7 years, because tax and fraud law require it. No
              conversation content is attached to them.
            </Text>
          </View>
        </Enter>

        {/* Billing warning — deleting does not cancel. */}
        <Enter preset="rise" delay={840}>
          <View
            style={{
              padding: space.xl,
              borderRadius: radius.card,
              backgroundColor: ink.surface,
              borderWidth: 1,
              borderColor: ink.border,
              gap: space.sm,
            }}
          >
            <Text variant="eyebrow">Cancel your subscription first</Text>
            <Text variant="caption">
              Deleting the account doesn&apos;t cancel billing — your store owns that. Cancel there,
              then delete here.
            </Text>
          </View>
        </Enter>

        {/* Timeline. */}
        <Enter preset="rise" delay={960}>
          <View style={{ gap: space.base }}>
            <Text variant="eyebrow">Timeline</Text>
            {TIMELINE.map((t) => (
              <View key={t.when} style={{ gap: 2, paddingVertical: space.xs }}>
                <Text variant="label" color={red.base} style={{ fontSize: size.label }}>
                  {t.when}
                </Text>
                <Text variant="caption">{t.what}</Text>
              </View>
            ))}
          </View>
        </Enter>

        {/* The confirmation. */}
        <Enter preset="slideUp" delay={1080}>
          <View style={{ gap: space.base }}>
            <Text variant="eyebrow">Type your email to confirm</Text>
            <Text variant="caption">{email || "Loading your account…"}</Text>
            <TextInput
              value={typed}
              onChangeText={setTyped}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder={email || "you@example.com"}
              placeholderTextColor={textColor.faintest}
              style={{
                borderRadius: radius.card,
                backgroundColor: ink.high,
                borderWidth: 1,
                borderColor: matches ? red.base : ink.border,
                padding: space.xl,
                color: textColor.body,
                fontSize: size.body,
              }}
            />

            {del.isError ? (
              <Text variant="caption" color={red.base}>
                {del.error.message === "EMAIL_MISMATCH"
                  ? "That doesn't match the address on the account."
                  : "That didn't go through. Try again, or delete from miyamoto.app/delete-account."}
              </Text>
            ) : null}

            <Button
              label={del.isPending ? "Deleting…" : "Delete my account"}
              variant="danger"
              disabled={!matches || del.isPending}
              onPress={() => del.mutate({ confirmEmail: typed })}
              style={{
                backgroundColor: matches ? "#5C2E28" : "transparent",
                borderWidth: 1,
                borderColor: matches ? red.base : ink.border,
                minHeight: 56,
              }}
            />

            <Button label="Keep my account" variant="ghost" onPress={() => router.back()} />
          </View>
        </Enter>
      </View>
    </Screen>
  );
}
