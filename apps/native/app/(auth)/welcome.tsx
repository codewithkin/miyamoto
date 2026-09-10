import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ActivityIndicator, Image, Linking, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GoogleLogo } from "@/components/google-logo";
import { Icon } from "@/components/icon";
import { MasterAvatar } from "@/components/master-avatar";
import { Enter } from "@/components/motion";
import { Touchable } from "@/components/touchable";
import { Text } from "@/components/ui";
import { MASTERS } from "@/content/onboarding-options";
import { failureFromCallbackCode, SIGN_IN_SENTENCE } from "@/lib/auth-errors";
import { LINKS } from "@/lib/links";
import { track } from "@/lib/telemetry";
import { useGoogleSignIn } from "@/lib/use-google-sign-in";
import { font, ink, radius, red, size, space, text as textColor } from "@/theme/tokens";

const HERO = require("@/assets/images/hero-musashi.jpg");

/**
 * 01 · Welcome — and sign-in.
 *
 * One promise and one way forward. Everything in this app needs an account,
 * and Google is the only way in (D-039), so the one button here *is* sign-in
 * (D-040). There used to be a "Get started" leading to a sign-in screen whose
 * only content was the same button — a tap that bought nothing.
 *
 * Built the way the owner's reference is: an image edge to edge under the
 * status bar, fading into the page; a large title; one line of promise; one
 * high-contrast pill. The pill is the only filled thing on the screen, so
 * there is no question what to press. The legal line is under it, the way
 * sign-in screens are expected to carry it.
 *
 * The hero is made offline by designs/make-hero.py with its fade baked in,
 * so it meets ink.base without a seam or a gradient library.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const { signIn, busy, error: hookError } = useGoogleSignIn();
  // An error the link back from Google carried (app/+native-intent.tsx
  // routes here with it) — shown even if this screen was freshly mounted,
  // as it is after the app was relaunched mid-sign-in.
  const { authError } = useLocalSearchParams<{ authError?: string }>();
  const error =
    hookError ?? (authError ? SIGN_IN_SENTENCE[failureFromCallbackCode(authError)] : null);

  function startSignIn() {
    if (authError) router.setParams({ authError: undefined });
    void signIn("google");
  }
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Tall enough to feel like a poster, never so tall that the button falls
  // below the fold on a small phone.
  const heroHeight = Math.round(Math.min(height * 0.62, width * 1.25));

  // The top of the funnel. Once per visit to the screen, not per render.
  React.useEffect(() => {
    track("Welcome.shown");
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: ink.base }}>
      <StatusBar style="light" />

      <Enter preset="fade" style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
        <Image
          source={HERO}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          style={{ width, height: heroHeight }}
        />
      </Enter>

      {/* The brand, over the shaded top of the image. */}
      <View
        style={{
          position: "absolute",
          top: insets.top + space.base,
          left: space.screen,
          right: space.screen,
        }}
      >
        <Text
          variant="eyebrow"
          color={textColor.secondary}
          style={{ letterSpacing: 4, fontSize: size.label }}
        >
          Miyamoto
        </Text>
      </View>

      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          paddingHorizontal: space.screen,
          paddingBottom: insets.bottom + space.xl,
          gap: space.section,
        }}
      >
        {/* Who is inside. */}
        <Enter preset="rise" delay={120} style={{ alignItems: "center", gap: space.md }}>
          <View style={{ flexDirection: "row" }}>
            {MASTERS.map((m, i) => (
              <View
                key={m.slug}
                style={{
                  marginLeft: i === 0 ? 0 : -10,
                  borderRadius: 22,
                  borderWidth: 2,
                  borderColor: ink.base,
                }}
              >
                <MasterAvatar slug={m.slug} name={m.name} size={40} />
              </View>
            ))}
          </View>
          <Text variant="caption" color={textColor.muted}>
            {MASTERS.map((m) => m.name).join(" · ")}
          </Text>
        </Enter>

        <Enter preset="rise" delay={200} style={{ gap: space.md }}>
          <Text
            variant="hero"
            style={{ fontSize: 40, lineHeight: 44, textAlign: "center" }}
          >
            Meet the Masters
          </Text>
          <Text
            variant="lead"
            color={textColor.muted}
            style={{ textAlign: "center", paddingHorizontal: space.sm }}
          >
            Bring the worst part of your week. People who survived worse tell you what
            they&apos;d do — and give you one thing to do today.
          </Text>
        </Enter>

        <Enter preset="rise" delay={300} style={{ gap: space.base }}>
          {/* The one action. */}
          <Touchable
            feel="button"
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            accessibilityState={{ busy: busy !== null, disabled: busy !== null }}
            disabled={busy !== null}
            onPress={startSignIn}
            style={{
              height: 58,
              borderRadius: radius.pill,
              backgroundColor: textColor.primary,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: space.base,
            }}
          >
            {busy ? <ActivityIndicator color={ink.base} /> : <GoogleLogo size={22} />}
            <Text style={{ fontFamily: font.sansBold, fontSize: size.bodyLg, color: ink.base }}>
              {busy ? "Opening Google…" : "Continue with Google"}
            </Text>
          </Touchable>

          {error ? (
            <Enter preset="fade">
              <View
                accessibilityRole="alert"
                style={{
                  flexDirection: "row",
                  gap: space.sm,
                  alignItems: "center",
                  paddingVertical: space.md,
                  paddingHorizontal: space.base,
                  borderRadius: radius.md,
                  backgroundColor: red.tintDeep,
                  borderWidth: 1,
                  borderColor: red.tint,
                }}
              >
                <Icon name="alert-circle-outline" size={18} color={red.base} />
                <Text variant="caption" color={red.base} style={{ flex: 1 }}>
                  {error}
                </Text>
              </View>
            </Enter>
          ) : null}

          <Text
            variant="caption"
            color={textColor.faintest}
            style={{ textAlign: "center", paddingHorizontal: space.xl }}
          >
            By continuing you agree to our{" "}
            <Text
              variant="caption"
              color={textColor.secondary}
              accessibilityRole="link"
              style={{ textDecorationLine: "underline" }}
              onPress={() => void Linking.openURL(LINKS.terms)}
            >
              Terms
            </Text>{" "}
            and{" "}
            <Text
              variant="caption"
              color={textColor.secondary}
              accessibilityRole="link"
              style={{ textDecorationLine: "underline" }}
              onPress={() => void Linking.openURL(LINKS.privacy)}
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </Enter>
      </View>
    </View>
  );
}
