import { getSetCookie, storageAdapter } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

import { AUTH_SCHEME, AUTH_STORAGE_PREFIX, authClient } from "@/lib/auth-client";
import { failureFromCallbackCode } from "@/lib/auth-errors";
import { track } from "@/lib/telemetry";

/**
 * The end of a Google sign-in, handled wherever it lands (D-044).
 *
 * Better Auth's server finishes the OAuth callback by redirecting the browser
 * to the app's own link — `miyamoto://…?cookie=<the session>` on success,
 * `…?error=<code>` on failure. The Expo plugin only reads that link through
 * the `WebBrowser.openAuthSessionAsync` promise that started the sign-in,
 * and that promise is not reliable on Android:
 *
 *   - expo-web-browser races "the app became active" (resolves "dismiss")
 *     against "the link arrived" (resolves "success"), and drops its link
 *     listener once either wins. Coming back from Chrome fires both; when
 *     "dismiss" wins, the session is thrown away.
 *   - If the app process died while Chrome was in front, the link cold-starts
 *     the app — in a development build, via the dev launcher — and the promise
 *     belonged to a JavaScript context that no longer exists.
 *
 * So every incoming link passes through `app/+native-intent.tsx`, which calls
 * `handleAuthReturn` here, on a cold start and while running. That stores the
 * session in exactly the key and format the plugin uses (its own exported
 * helpers), confirms it with the server, and picks the route to show. The
 * plugin's own path still runs too; both write the same value, and whichever
 * confirms the session first records the sign-in.
 *
 * A link is only honoured if this install started a sign-in in the last ten
 * minutes. Without that, any link — a message, a web page — could carry a
 * session and sign this phone into someone else's account.
 */

const PENDING_KEY = "miyamoto.auth.pending-sign-in";
const PENDING_TTL_MS = 10 * 60 * 1000;
const COOKIE_KEY = `${AUTH_STORAGE_PREFIX}_cookie`;

const storage = storageAdapter(SecureStore);

/** Called when a sign-in starts. Survives the process dying. */
export async function markSignInPending(): Promise<void> {
  try {
    await SecureStore.setItemAsync(PENDING_KEY, String(Date.now()));
  } catch {
    // Without the marker a link-delivered session is ignored and the
    // plugin's own path is all that remains — degraded, not broken.
  }
}

/**
 * Reads and clears the marker: true only once per sign-in, and only if it
 * started here recently. Clearing on read is what makes "record the sign-in"
 * happen exactly once when the plugin and the link both finish it.
 */
export async function takeSignInPending(): Promise<boolean> {
  try {
    const raw = await SecureStore.getItemAsync(PENDING_KEY);
    if (raw === null) return false;
    await SecureStore.deleteItemAsync(PENDING_KEY);
    const startedAt = Number(raw);
    return Number.isFinite(startedAt) && Date.now() - startedAt < PENDING_TTL_MS;
  } catch {
    return false;
  }
}

export type AuthOutcome = { kind: "signed-in" } | { kind: "error"; code: string };

const listeners = new Set<(outcome: AuthOutcome) => void>();

/** Lets the sign-in hook hear a link that lands after its browser promise gave up. */
export function onAuthOutcome(listener: (outcome: AuthOutcome) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(outcome: AuthOutcome) {
  for (const listener of listeners) listener(outcome);
}

/**
 * Query parameters, parsed by hand: React Native's URL support for custom
 * schemes has been uneven across versions, and this must never throw.
 * The server encodes with URLSearchParams, so "+" is a space.
 */
function queryParams(url: string): Map<string, string> {
  const params = new Map<string, string>();
  const start = url.indexOf("?");
  if (start === -1) return params;
  const end = url.indexOf("#", start);
  const query = url.slice(start + 1, end === -1 ? undefined : end);
  const decode = (part: string) => {
    try {
      return decodeURIComponent(part.replace(/\+/g, " "));
    } catch {
      return part;
    }
  };
  for (const pair of query.split("&")) {
    if (!pair) continue;
    const eq = pair.indexOf("=");
    const key = decode(eq === -1 ? pair : pair.slice(0, eq));
    if (key) params.set(key, eq === -1 ? "" : decode(pair.slice(eq + 1)));
  }
  return params;
}

/** Merges the callback's Set-Cookie into the plugin's stored cookie jar. */
async function persistSessionCookie(setCookieHeader: string): Promise<void> {
  const previous = await storage.getItemAsync(COOKIE_KEY);
  await storage.setItemAsync(COOKIE_KEY, getSetCookie(setCookieHeader, previous ?? undefined));
}

/** Asks the server whether the stored cookie is a live session, and wakes useSession. */
export async function confirmSession(): Promise<boolean> {
  try {
    const { data } = await authClient.getSession();
    authClient.$store.notify("$sessionSignal");
    return Boolean(data?.user);
  } catch {
    return false;
  }
}

/**
 * For a link into the app: if it is the end of a sign-in this install
 * started, finish it and return the route to show. Returns null for any other
 * link, so it is routed as normal. Never throws.
 */
export async function handleAuthReturn(url: string): Promise<string | null> {
  if (!AUTH_SCHEME || !url.startsWith(`${AUTH_SCHEME}:`)) return null;

  const params = queryParams(url);
  const cookie = params.get("cookie");
  const error = params.get("error");
  if (!cookie && !error) return null;

  if (!(await takeSignInPending())) {
    // Not ours, or long finished. Store nothing, and keep the session cookie
    // out of the router's params — go to the gate, which knows where to go.
    return "/";
  }

  if (error) {
    track("Auth.signInFailed", {
      provider: "google",
      reason: failureFromCallbackCode(error),
      via: "link",
    });
    emit({ kind: "error", code: error });
    return `/welcome?authError=${encodeURIComponent(error)}`;
  }

  try {
    await persistSessionCookie(cookie ?? "");
  } catch {
    // Falls through to the check below, which will say it didn't save.
  }

  if (await confirmSession()) {
    track("Auth.signInCompleted", { provider: "google", via: "link" });
    emit({ kind: "signed-in" });
    return "/";
  }

  track("Auth.signInFailed", { provider: "google", reason: "not-saved", via: "link" });
  emit({ kind: "error", code: "session_not_saved" });
  return "/welcome?authError=session_not_saved";
}
