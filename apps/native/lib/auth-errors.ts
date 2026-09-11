/**
 * Why a sign-in didn't finish, as a category, and the sentence a person sees.
 *
 * The category is what gets counted (it never carries a server message); the
 * sentence is what gets shown. Shared by the sign-in hook, which sees Better
 * Auth's API errors, and `lib/auth-redirect.ts`, which sees the error codes
 * the OAuth callback puts on the link back into the app.
 */

export type SignInFailure =
  | "provider-off"
  | "network"
  | "declined"
  | "expired"
  | "not-saved"
  | "signed-out"
  | "cancelled-or-other";

/**
 * From an error Better Auth's client returned for `signIn.social`.
 *
 * The one worth singling out is a provider the server has not registered —
 * which is what happens when GOOGLE_CLIENT_ID / _SECRET are missing. Without
 * this it surfaces as "Provider not found", which reads like a bug in the app
 * rather than a missing setting.
 */
export function failureFromApiError(
  error: { code?: string; message?: string } | null | undefined,
): SignInFailure {
  const code = error?.code ?? "";
  const message = error?.message ?? "";
  if (/PROVIDER_NOT_FOUND/i.test(code) || /provider/i.test(message)) return "provider-off";
  if (/network|fetch/i.test(message)) return "network";
  return "cancelled-or-other";
}

/**
 * From the `error=` code Better Auth's OAuth callback appends to the link it
 * sends back into the app.
 */
export function failureFromCallbackCode(code: string): SignInFailure {
  switch (code) {
    // The person backed out on Google's consent screen.
    case "access_denied":
      return "declined";
    // The sign-in's one-time state was already used or had expired — most
    // often a stale Google page submitted a second time.
    case "state_mismatch":
    case "state_not_found":
    case "state_security_mismatch":
    case "please_restart_the_process":
    case "invalid_callback_request":
      return "expired";
    // Raised here, not by the server: the link carried a session, but the
    // server did not recognise it once stored.
    case "session_not_saved":
      return "not-saved";
    // Raised here too, by lib/server-fetch.ts: the server refused a session
    // the app was using, and Better Auth confirmed it's gone.
    case "session_ended":
      return "signed-out";
    default:
      return "cancelled-or-other";
  }
}

export const SIGN_IN_SENTENCE: Record<SignInFailure, string> = {
  "provider-off": "Google sign-in isn't switched on for this server yet.",
  network: "Couldn't reach Miyamoto. Check your connection and try again.",
  declined: "Google didn't share your account, so nothing was signed in. Try again when you're ready.",
  expired: "That sign-in went stale before it finished. Try once more — it only takes a moment.",
  "not-saved": "Google signed you in, but the session didn't save on this phone. Try once more.",
  "signed-out": "You were signed out. Sign in to carry on.",
  "cancelled-or-other": "That didn't go through. Try again.",
};
