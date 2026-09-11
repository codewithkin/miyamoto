import { useRouter } from "expo-router";
import React from "react";
import { TextInput, View } from "react-native";

import { Icon } from "@/components/icon";
import { Enter } from "@/components/motion";
import { Sheet } from "@/components/sheet";
import { Button, Text } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { confirmSession } from "@/lib/auth-redirect";
import { track } from "@/lib/telemetry";
import { ink, radius, red, size, space, text as textColor } from "@/theme/tokens";

/**
 * Email and password sign-in, for accounts the server seeds (plan 14).
 *
 * Google is how people sign in (D-039). This exists because Google Play's
 * review needs a username and password that opens the whole app, and its
 * reviewers can't use Google accounts of their own. The server seeds that
 * account and refuses email sign-ups, so this sheet only ever opens an
 * account that already exists.
 *
 * On success it lands on the gate, as a Google sign-in does, and the gate
 * decides between the first question and the app.
 */
export function EmailSignInSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const ready = /\S+@\S+\.\S+/.test(email.trim()) && password.length > 0;

  async function submit() {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { error: failed } = await authClient.signIn.email({
        email: email.trim(),
        password,
      });
      if (failed) {
        setError(
          failed.status === 401
            ? "That email and password don't match."
            : failed.status === 429
              ? "Too many tries. Wait a minute and try again."
              : "That didn't go through. Try again.",
        );
        return;
      }
      if (!(await confirmSession())) {
        setError("Signed in, but the session didn't save on this phone. Try once more.");
        return;
      }
      track("Auth.signInCompleted", { provider: "email", via: "form" });
      onClose();
      router.replace("/");
    } catch {
      setError("Couldn't reach Miyamoto. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const field = {
    minHeight: 52,
    borderRadius: radius.card,
    backgroundColor: ink.high,
    borderWidth: 1,
    borderColor: ink.border,
    paddingHorizontal: space.xl,
    color: textColor.body,
    fontSize: size.body,
  } as const;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Sign in with email"
      subtitle="For accounts we've given a password to, like app review. Everyone else: Continue with Google."
    >
      <View style={{ gap: space.md }}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={textColor.faintest}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="username"
          editable={!busy}
          style={field}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={textColor.faintest}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
          editable={!busy}
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
          style={field}
        />
        {error ? (
          <Enter preset="fade" style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <Icon name="alert-circle-outline" size={16} color={red.base} />
            <Text variant="caption" color={red.base} style={{ flex: 1 }}>
              {error}
            </Text>
          </Enter>
        ) : null}
        <Button
          label="Sign in"
          icon={<Icon name="log-in-outline" size={20} color={ready ? textColor.primary : textColor.faintest} />}
          loading={busy}
          loadingLabel="Signing in…"
          disabled={!ready}
          onPress={() => void submit()}
        />
      </View>
    </Sheet>
  );
}
