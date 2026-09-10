import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { Blade } from "@/components/blade";
import { Touchable } from "@/components/touchable";
import { Enter, Stagger } from "@/components/motion";
import { Button, Screen, Text } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { ink, radius, red, size, space, text as textColor } from "@/theme/tokens";

/**
 * 12 · Sign in.
 *
 * Google and Apple only — the design promises no passwords and no emailed
 * links, and the server has the credential endpoint turned off to match.
 *
 * This is also where the on-device onboarding draft stops being a draft:
 * the answers collected across the previous eleven screens are submitted
 * once, against a real identity, immediately after the provider returns.
 */
export default function SignInScreen() {
  const router = useRouter();
  const [busy, setBusy] = React.useState<"google" | "apple" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function signIn(provider: "google" | "apple") {
    setBusy(provider);
    setError(null);
    try {
      // callbackURL is a real path. The Expo plugin turns it into a deep link
      // with Linking.createURL, and a route group like "/(app)" is not a URL
      // path. "/" is the gate, which decides where a new session belongs.
      const { error: authError } = await authClient.signIn.social({
        provider,
        callbackURL: "/",
      });
      // Better Auth reports most failures as a returned error rather than a
      // throw, so a cancelled sheet or a rejected provider must be read here
      // or it falls through to the Path with no session behind it.
      if (authError) {
        setError(authError.message ?? "That didn't go through. Try again, or use the other provider.");
        return;
      }
      // Onboarding runs after sign-in (D-033). The gate sends a new account
      // into it and a returning one straight to the app.
      router.replace("/");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "That didn't go through. Try again, or use the other provider.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen>
      <Enter preset="drop">
        <View style={{ paddingVertical: space.lg }}>
          <Touchable feel="row" onPress={() => router.back()} hitSlop={12}>
            <Text variant="title" color={textColor.muted}>
              ←
            </Text>
          </Touchable>
        </View>
      </Enter>

      <View style={{ flex: 1, gap: space.section, justifyContent: "center" }}>
        <View style={{ gap: space.md }}>
          <Enter preset="rise">
            <Text variant="hero">Keep your 30 days safe.</Text>
          </Enter>
          <Enter preset="rise" delay={200}>
            <Text variant="lead">
              Two taps. No password to invent, no code to wait for.
            </Text>
          </Enter>
        </View>

        <Stagger initialDelay={460} step={160} style={{ gap: space.base }}>
          <Enter preset="pop">
            <Button
              label={busy === "google" ? "Opening Google…" : "Continue with Google"}
              disabled={busy !== null}
              onPress={() => void signIn("google")}
            />
          </Enter>
          <Enter preset="pop">
            <Button
              label={busy === "apple" ? "Opening Apple…" : "Continue with Apple"}
              variant="secondary"
              disabled={busy !== null}
              onPress={() => void signIn("apple")}
            />
          </Enter>
        </Stagger>

        {error ? (
          <Enter preset="slideLeft">
            <View
              style={{
                padding: space.xl,
                borderRadius: radius.card,
                backgroundColor: ink.surface,
                borderWidth: 1,
                borderColor: red.tint,
              }}
            >
              <Text variant="caption" color={red.base}>
                {error}
              </Text>
            </View>
          </Enter>
        ) : null}

        <Enter preset="fade" delay={840}>
          <Text variant="caption" style={{ textAlign: "center" }}>
            Google and Apple only — we don&apos;t do passwords or emailed links.
          </Text>
        </Enter>

        <Stagger initialDelay={980} step={140} style={{ gap: space.md }}>
          {[
            "We only read your name and email. Nothing is posted, ever.",
            "Your trials and journal stay private.",
          ].map((line) => (
            <Enter key={line} preset="slideLeft">
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.base }}>
                <Blade state="complete" length={10} />
                <Text variant="caption" style={{ flex: 1 }}>
                  {line}
                </Text>
              </View>
            </Enter>
          ))}
        </Stagger>
      </View>

      <Enter preset="fade" delay={1200}>
        <View style={{ paddingVertical: space.xxl }}>
          <Text variant="caption" style={{ textAlign: "center" }}>
            Why do I need an account?
          </Text>
        </View>
      </Enter>
    </Screen>
  );
}
