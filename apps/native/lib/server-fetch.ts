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

/** For ordinary requests: tRPC, chat history. */
export const serverFetch: typeof globalThis.fetch = async (input, init) =>
  fetch(input, await withSession(init));

/**
 * For responses read as a stream: the chat reply.
 *
 * React Native's own `fetch` buffers the whole response and has no readable
 * `body`, so the AI SDK can't stream a Master's letter through it. `expo/fetch`
 * implements streaming bodies on native (and is the browser's fetch on web).
 */
export const streamingServerFetch = (async (input: RequestInfo | URL, init?: RequestInit) =>
  expoFetch(
    input as Parameters<typeof expoFetch>[0],
    (await withSession(init)) as Parameters<typeof expoFetch>[1],
  )) as unknown as typeof globalThis.fetch;
