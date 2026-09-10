import React from "react";
import { View } from "react-native";

import { Icon } from "@/components/icon";
import { MasterAvatar } from "@/components/master-avatar";
import { Enter } from "@/components/motion";
import { Button, Screen, Text } from "@/components/ui";
import { MASTER_COUNT_TITLE } from "@/content/onboarding-options";
import { SAMPLE_ANSWERS } from "@/content/sample-answers";
import { useGoogleSignIn } from "@/lib/use-google-sign-in";
import { indigo, ink, radius, red, size, space, text as textColor } from "@/theme/tokens";

/**
 * 01 · Welcome.
 *
 * One promise and one way forward. Everything in this app needs an account,
 * and Google is the only way in (D-039), so the one button here *is* sign-in
 * (D-040). There used to be a "Get started" leading to a sign-in screen whose
 * only content was the same button — a tap that bought nothing.
 *
 * The panel above the promise used to be a design placeholder that shipped: a
 * "Playing" chip with a live red dot over the words "looping 8s video", with
 * nothing playing. It now shows the thing it stood in for — a real problem and
 * the opening of a real reply, taken from the sourced sample answers, so the
 * first screen someone sees makes no claim the app cannot back.
 */
const EXCHANGE = SAMPLE_ANSWERS["procrastinating"];

export default function WelcomeScreen() {
  const { signIn, busy, error } = useGoogleSignIn();
  const opening = EXCHANGE?.body.split("\n\n")[0] ?? "";

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", gap: space.screen }}>
        {/* A real exchange, the way it looks in the app. */}
        {EXCHANGE ? (
          <Enter preset="fade">
            <View
              style={{
                borderRadius: radius.panel,
                backgroundColor: ink.surface,
                borderWidth: 1,
                borderColor: ink.border,
                padding: space.section,
                gap: space.xl,
              }}
            >
              <View
                style={{
                  alignSelf: "flex-end",
                  maxWidth: "86%",
                  backgroundColor: indigo.tint,
                  borderRadius: radius.sheet,
                  borderBottomRightRadius: space.sm,
                  paddingVertical: space.base,
                  paddingHorizontal: space.xl,
                }}
              >
                <Text variant="label" style={{ fontSize: size.body }}>
                  {EXCHANGE.echo}
                </Text>
              </View>

              <View style={{ gap: space.base }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                  <MasterAvatar slug={EXCHANGE.masterSlug} name={EXCHANGE.masterName} size={32} />
                  <Text variant="eyebrow" color={indigo.light}>
                    {EXCHANGE.masterName} replies
                  </Text>
                </View>
                <Text variant="voice" numberOfLines={5}>
                  {opening}
                </Text>
              </View>
            </View>
          </Enter>
        ) : null}

        <View style={{ gap: space.md }}>
          <Enter preset="rise" delay={200}>
            <Text variant="hero">Bring the worst part of your week.</Text>
          </Enter>

          <Enter preset="rise" delay={380}>
            <Text variant="lead">
              {MASTER_COUNT_TITLE} people who survived worse will tell you what they&apos;d do — and
              give you one thing to do today.
            </Text>
          </Enter>
        </View>
      </View>

      <View style={{ paddingVertical: space.xxl, gap: space.base }}>
        <Enter preset="fade" delay={560}>
          <Button
            label={busy ? "Opening Google…" : "Continue with Google"}
            icon={<Icon name="logo-google" size={20} color={textColor.primary} />}
            disabled={busy !== null}
            onPress={() => void signIn("google")}
          />
        </Enter>
        {error ? (
          <Enter preset="fade">
            <View
              accessibilityRole="alert"
              style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}
            >
              <Icon name="alert-circle-outline" size={18} color={red.base} />
              <Text variant="caption" color={red.base} style={{ flex: 1 }}>
                {error}
              </Text>
            </View>
          </Enter>
        ) : null}
      </View>
    </Screen>
  );
}
