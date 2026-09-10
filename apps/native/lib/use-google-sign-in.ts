import { useRouter } from "expo-router";
import React from "react";

import { authClient } from "@/lib/auth-client";

/**
 * Google sign-in, as one hook: run it, whether it is running, and what went
 * wrong in a sentence.
 *
 * Google is the only provider for now (D-039), and the welcome screen is
 * where it runs (D-040) — there is no separate sign-in screen. There is no
 * password path, and the server has the credential endpoint turned off to
 * match.
 *
 * Nothing is claimed here. Onboarding runs after sign-in (D-038): the gate at
 * "/" sends a new account into the quiz and a returning one to the app.
 *
 * Apple — off for now (D-039). To turn it back on: set APPLE_CLIENT_ID /
 * APPLE_CLIENT_SECRET / APPLE_APP_BUNDLE_IDENTIFIER, uncomment the Apple
 * block in packages/auth/src/index.ts, widen `Provider` below to include
 * "apple", and add a second button on app/(auth)/welcome.tsx calling
 * `signIn("apple")`.
 */

export type Provider = "google"; // | "apple"

/**
 * Why a sign-in failed, as a category. The sentence is for the person; the
 * category is safe to count (it never carries a server message).
 */
export type SignInFailure = "provider-off" | "network" | "cancelled-or-other";

/**
 * Turns Better Auth's error into a sentence a person can act on.
 *
 * The one worth singling out is a provider the server has not registered —
 * which is what happens when GOOGLE_CLIENT_ID / _SECRET are missing. Without
 * this it surfaces as "Provider not found", which reads like a bug in the app
 * rather than a missing setting.
 */
function classify(error: { code?: string; message?: string } | null | undefined): SignInFailure {
  const code = error?.code ?? "";
  const message = error?.message ?? "";
  if (/PROVIDER_NOT_FOUND/i.test(code) || /provider/i.test(message)) return "provider-off";
  if (/network|fetch/i.test(message)) return "network";
  return "cancelled-or-other";
}

const SENTENCE: Record<SignInFailure, string> = {
  "provider-off": "Google sign-in isn't switched on for this server yet.",
  network: "Couldn't reach Miyamoto. Check your connection and try again.",
  "cancelled-or-other": "That didn't go through. Try again.",
};

export function useGoogleSignIn() {
  const router = useRouter();
  const [busy, setBusy] = React.useState<Provider | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const signIn = React.useCallback(
    async (provider: Provider = "google") => {
      setBusy(provider);
      setError(null);
      try {
        // callbackURL is a real path, turned into a deep link (miyamoto:///)
        // by the Expo plugin. "/" is the gate.
        const { error: authError } = await authClient.signIn.social({
          provider,
          callbackURL: "/",
        });
        // Better Auth reports most failures as a returned error rather than
        // a throw — a cancelled browser sheet, a rejected provider — so it
        // has to be read here or the user falls through to a gate with no
        // session.
        if (authError) {
          setError(SENTENCE[classify(authError)]);
          return;
        }
        router.replace("/");
      } catch (e) {
        setError(SENTENCE[classify(e instanceof Error ? { message: e.message } : null)]);
      } finally {
        setBusy(null);
      }
    },
    [router],
  );

  return { signIn, busy, error };
}
