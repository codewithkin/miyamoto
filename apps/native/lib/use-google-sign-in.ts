import { useRouter } from "expo-router";
import React from "react";

import { authClient } from "@/lib/auth-client";
import { failureFromApiError, SIGN_IN_SENTENCE } from "@/lib/auth-errors";
import { markSignInPending } from "@/lib/auth-redirect";
import { track } from "@/lib/telemetry";

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

export function useGoogleSignIn() {
  const router = useRouter();
  const [busy, setBusy] = React.useState<Provider | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const signIn = React.useCallback(
    async (provider: Provider = "google") => {
      setBusy(provider);
      setError(null);
      track("Auth.signInStarted", { provider });
      // Lets the link back from Google finish this sign-in even if the app
      // is relaunched before the browser promise below returns (D-044).
      await markSignInPending();
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
          const reason = failureFromApiError(authError);
          track("Auth.signInFailed", { provider, reason });
          setError(SIGN_IN_SENTENCE[reason]);
          return;
        }
        track("Auth.signInCompleted", { provider });
        router.replace("/");
      } catch (e) {
        const reason = failureFromApiError(e instanceof Error ? { message: e.message } : null);
        track("Auth.signInFailed", { provider, reason });
        setError(SIGN_IN_SENTENCE[reason]);
      } finally {
        setBusy(null);
      }
    },
    [router],
  );

  return { signIn, busy, error };
}
