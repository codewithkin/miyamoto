import { router } from "expo-router";
import { fetch as expoFetch } from "expo/fetch";
import { Platform } from "react-native";

import { authClient } from "@/lib/auth-client";

/**
 * The one way the app calls its own server (D-047).
 *
 * On native there is no browser cookie jar. The Expo plugin keeps the
 * session in SecureStore, and every request has to carry it by hand as a
 * Cookie header. That used to be done separately in each place that called
 * the server: tRPC's link added it, chat history added it, and the chat
 * transport, built with `new DefaultChatTransport({ api })`, didn't. It used
 * plain `fetch` with no cookie, so the first message after sign-in came back
 * `401 UNAUTHORIZED` and the chat said "Sign in again to ask" to someone who
 * had just signed in.
 *
 * So the session is attached here and only here, and every request to the
 * server goes through one of these two functions.
 * `scripts/check-server-fetch.mjs` fails `pnpm check-types` when one doesn't.
 */

/** Plain headers with the session added, whatever form the caller passed. */
async function withSession(init: RequestInit | undefined): Promise<RequestInit> {
  const headers: Record<string, string> = {};
  new Headers(init?.headers).forEach((value, key) => {
    headers[key] = value;
  });

  if (Platform.OS !== "web") {
    const cookie = await authClient.getCookie();
    if (cookie) headers.cookie = cookie;
  }

  return {
    ...init,
    headers,
    // Web uses the browser's own cookies. Native sends the cookie by hand
    // (above) and omits the platform's, so there is only ever one session
    // on a request.
    credentials: Platform.OS === "web" ? "include" : "omit",
  };
}

let checking: Promise<void> | null = null;
let lastChecked = 0;

/**
 * The server refused the session on a request. Find out whether it's gone.
 *
 * Asks Better Auth directly (its own request, not through here, so this
 * can't loop). Two outcomes, and only one of them changes anything:
 *
 *   - Still live, or the question couldn't be asked (no signal): the screen
 *     stays as it is, and the request's own error says what failed.
 *   - Gone (expired, revoked, signed out on another device): the app goes to
 *     welcome and says why. Before this, the chat said "Sign in again to
 *     ask" to someone with no way to sign in from there.
 *
 * With no stored cookie there was no session to refuse, and the gate already
 * sends a signed-out person to welcome. Refusals that arrive together share
 * one check: a batch of queries failing at once, or the same refusal seen
 * both here and by the query cache (utils/trpc.ts).
 */
export function sessionRefused(): void {
  if (checking || Date.now() - lastChecked < 5_000) return;
  checking = (async () => {
    if (Platform.OS !== "web" && !(await authClient.getCookie())) return;
    const { data, error } = await authClient.getSession();
    if (error || data?.user) return;
    authClient.$store.notify("$sessionSignal");
    router.replace({ pathname: "/welcome", params: { authError: "session_ended" } });
  })()
    .catch(() => {
      // Couldn't ask. Leave things as they are.
    })
    .finally(() => {
      checking = null;
      lastChecked = Date.now();
    });
}

function watchForRefusal<R extends { status: number }>(response: R): R {
  if (response.status === 401) sessionRefused();
  return response;
}

/** For ordinary requests: tRPC, chat history. */
export const serverFetch: typeof globalThis.fetch = async (input, init) =>
  watchForRefusal(await fetch(input, await withSession(init)));

/**
 * For responses read as a stream: the chat reply.
 *
 * React Native's own `fetch` buffers the whole response and has no readable
 * `body`, so the AI SDK can't stream a Master's letter through it. `expo/fetch`
 * implements streaming bodies on native (and is the browser's fetch on web).
 */
export const streamingServerFetch = (async (input: RequestInfo | URL, init?: RequestInit) =>
  watchForRefusal(
    await expoFetch(
      input as Parameters<typeof expoFetch>[0],
      (await withSession(init)) as Parameters<typeof expoFetch>[1],
    ),
  )) as unknown as typeof globalThis.fetch;
