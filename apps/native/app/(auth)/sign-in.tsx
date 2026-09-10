import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { BackButton, Icon, IconBadge } from "@/components/icon";
import { Enter } from "@/components/motion";
import { Button, Screen, Text } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { ink, radius, red, size, space, text as textColor } from "@/theme/tokens";

/**
 * Sign in.
 *
 * Google only, for now (D-034). Apple is kept below, commented out rather
 * than deleted, so turning it back on is uncommenting and adding the
 * credentials — not rebuilding the screen. There is no password path and the
 * server has the credential endpoint turned off to match.
 *
 * Nothing is claimed here. Onboarding runs after sign-in (D-033): the gate at
 * "/" sends a new account into the quiz and a returning one to the app.
 */

type Provider = "google"; // | "apple"

/**
 * Turns Better Auth's error into a sentence a person can act on.
 *
 * The one worth singling out is a provider the server has not registered —
 * which is what happens when GOOGLE_CLIENT_ID / _SECRET are missing. Without
 * this it surfaces as "Provider not found", which reads like a bug in the app
 * rather than a missing setting.
 */
function explain(error: { code?: string; message?: string } | null | undefined): string {
  const code = error?.code ?? "";
  const message = error?.message ?? "";
  if (/PROVIDER_NOT_FOUND/i.test(code) || /provider/i.test(message)) {
    return "Google sign-in isn't switched on for this server yet.";
  }
  if (/network|fetch/i.test(message)) {
    return "Couldn't reach Miyamoto. Check your connection and try again.";
  }
  return "That didn't go through. Try again.";
}

export default function SignInScreen() {
  const router = useRouter();
  const [busy, setBusy] = React.useState<Provider | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function signIn(provider: Provider) {
    setBusy(provider);
    setError(null);
    try {
      // callbackURL is a real path, turned into a deep link (miyamoto:///) by
      // the Expo plugin. "/" is the gate.
      const { error: authError } = await authClient.signIn.social({
        provider,
        callbackURL: "/",
      });
      // Better Auth reports most failures as a returned error rather than a
      // throw — a cancelled browser sheet, a rejected provider — so it has to
      // be read here or the user falls through to a gate with no session.
      if (authError) {
        setError(explain(authError));
        return;
      }
      router.replace("/");
    } catch (e) {
      setError(explain(e instanceof Error ? { message: e.message } : null));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen>
      <View style={{ paddingVertical: space.lg }}>
        <BackButton onPress={() => router.back()} />
      </View>

      <View style={{ flex: 1, justifyContent: "center", gap: space.screen }}>
        <View style={{ gap: space.md }}>
          <Enter preset="rise">
            <Text variant="hero">Sign in to begin.</Text>
          </Enter>
          <Enter preset="rise" delay={160}>
            <Text variant="lead">
              Your trials and conversations are kept on your account, so they follow you to any
              phone.
            </Text>
          </Enter>
        </View>

        <Enter preset="fade" delay={320}>
          <View style={{ gap: space.base }}>
            <Button
              label={busy === "google" ? "Opening Google…" : "Continue with Google"}
              icon={<Icon name="logo-google" size={20} color={textColor.primary} />}
              disabled={busy !== null}
              onPress={() => void signIn("google")}
            />

            {/*
              Apple sign-in — off for now (D-034). To turn it back on:
                1. set APPLE_CLIENT_ID / APPLE_CLIENT_SECRET / APPLE_APP_BUNDLE_IDENTIFIER
                   and uncomment the Apple block in packages/auth/src/index.ts;
                2. add "apple" to the Provider type above;
                3. uncomment this button.

            <Button
              label={busy === "apple" ? "Opening Apple…" : "Continue with Apple"}
              icon={<Icon name="logo-apple" size={20} color={textColor.body} />}
              variant="secondary"
              disabled={busy !== null}
              onPress={() => void signIn("apple")}
            />
            */}
          </View>
        </Enter>

        {error ? (
          <Enter preset="fade">
            <View
              accessibilityRole="alert"
              style={{
                flexDirection: "row",
                gap: space.base,
                alignItems: "center",
                padding: space.xl,
                borderRadius: radius.card,
                backgroundColor: ink.surface,
                borderWidth: 1,
                borderColor: red.tint,
              }}
            >
              <Icon name="alert-circle-outline" size={20} color={red.base} />
              <Text variant="caption" color={red.base} style={{ flex: 1 }}>
                {error}
              </Text>
            </View>
          </Enter>
        ) : null}

        <Enter preset="fade" delay={480}>
          <View style={{ gap: space.base }}>
            {[
              { icon: "person-circle-outline" as const, line: "We only read your name and email." },
              { icon: "lock-closed-outline" as const, line: "Nothing is ever posted to your Google account." },
            ].map((r) => (
              <View key={r.line} style={{ flexDirection: "row", alignItems: "center", gap: space.base }}>
                <IconBadge name={r.icon} size={28} />
                <Text variant="caption" style={{ flex: 1, fontSize: size.label }}>
                  {r.line}
                </Text>
              </View>
            ))}
          </View>
        </Enter>
      </View>
    </Screen>
  );
}
