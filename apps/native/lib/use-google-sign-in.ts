import { useRouter } from "expo-router";
import React from "react";

import { authClient } from "@/lib/auth-client";
import {
  failureFromApiError,
  failureFromCallbackCode,
  SIGN_IN_SENTENCE,
} from "@/lib/auth-errors";
import {
  type AuthOutcome,
  confirmSession,
  markSignInPending,
  onAuthOutcome,
  takeSignInPending,
} from "@/lib/auth-redirect";
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
 * "Done" means a session the server recognises — never just "the browser
 * closed". The browser closes the same way whether the person finished,
 * backed out or hit an error, so after it closes this checks for a session,
 * and on Android waits briefly for the link back from Google, which can land
 * a moment after the browser promise has already given up (D-044,
 * `lib/auth-redirect.ts`). No session and no link means the person backed
 * out, and backing out is not an error: nothing is shown.
 *
 * Apple — off for now (D-039). To turn it back on: set APPLE_CLIENT_ID /
 * APPLE_CLIENT_SECRET / APPLE_APP_BUNDLE_IDENTIFIER, uncomment the Apple
 * block in packages/auth/src/index.ts, widen `Provider` below to include
 * "apple", and add a second button on app/(auth)/welcome.tsx calling
 * `signIn("apple")`.
 */

export type Provider = "google"; // | "apple"

/**
 * How long to wait, after the browser reports it closed, for the link back
 * from Google to land. Only Android ever needs it; the app is already in the
 * foreground by then, so the link is a beat behind, not seconds.
 */
const LATE_LINK_MS = 3000;

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

      // Listen before the browser opens, so an outcome delivered by the link
      // path while the promise is still pending isn't missed.
      let fromLink: AuthOutcome | null = null;
      let onLateLink: ((outcome: AuthOutcome) => void) | null = null;
      const stopListening = onAuthOutcome((outcome) => {
        fromLink = outcome;
        onLateLink?.(outcome);
      });

      try {
        // Both are real paths, turned into links back into the app by the
        // Expo plugin. "/" is the gate; errors Better Auth can tie to this
        // request come back to welcome with `error=`, not to the server.
        const { error: authError } = await authClient.signIn.social({
          provider,
          callbackURL: "/",
          errorCallbackURL: "/welcome",
        });

        // Failures before the browser ever opened — a provider the server
        // hasn't switched on, no network. The marker is spent.
        if (authError) {
          await takeSignInPending();
          const reason = failureFromApiError(authError);
          track("Auth.signInFailed", { provider, reason });
          setError(SIGN_IN_SENTENCE[reason]);
          return;
        }

        let outcome: AuthOutcome | null = fromLink;

        // The plugin stores the session itself when the browser returns
        // cleanly (always on iOS, usually on Android).
        if (!outcome && (await confirmSession())) {
          if (await takeSignInPending()) {
            track("Auth.signInCompleted", { provider, via: "browser" });
          }
          outcome = { kind: "signed-in" };
          router.replace("/");
        }

        // Android can report the browser closed a beat before the link
        // carrying the session arrives; the link path finishes it.
        if (!outcome) {
          outcome = await new Promise<AuthOutcome | null>((resolve) => {
            onLateLink = resolve;
            setTimeout(() => resolve(null), LATE_LINK_MS);
          });
        }

        if (!outcome) {
          // Backed out of Google. The marker is left to expire on its own,
          // so a sign-in finished in the browser a moment later still counts.
          track("Auth.signInFailed", { provider, reason: "cancelled-or-other", via: "browser" });
          return;
        }

        // A link outcome is already routed by app/+native-intent.tsx —
        // "/" for a session, welcome with the code for an error. Only the
        // sentence is set here, so it shows even before that route settles.
        if (outcome.kind === "error") {
          setError(SIGN_IN_SENTENCE[failureFromCallbackCode(outcome.code)]);
        }
      } catch (e) {
        await takeSignInPending();
        const reason = failureFromApiError(e instanceof Error ? { message: e.message } : null);
        track("Auth.signInFailed", { provider, reason });
        setError(SIGN_IN_SENTENCE[reason]);
      } finally {
        stopListening();
        setBusy(null);
      }
    },
    [router],
  );

  return { signIn, busy, error };
}
