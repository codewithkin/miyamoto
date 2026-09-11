import type { AppRouter } from "@miyamoto/api/routers/index";
import { env } from "@miyamoto/env/native";
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, TRPCClientError } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

import { serverFetch, sessionRefused } from "@/lib/server-fetch";

/**
 * A procedure refused the session. serverFetch sees most of these as a 401,
 * but a batch that mixes a refused call with public ones comes back 207, so
 * each failed call is checked here too. sessionRefused dedupes the two.
 */
function onError(error: unknown) {
  if (error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED") {
    sessionRefused();
  }
}

/**
 * A refusal is an answer, not a hiccup: 4xx (signed out, not found, not
 * allowed) comes back the same on every try, so it's shown at once instead
 * of after three retries' worth of spinner. Network failures and 5xx get two
 * more tries.
 */
function retry(failureCount: number, error: unknown) {
  const status = error instanceof TRPCClientError ? error.data?.httpStatus : undefined;
  if (typeof status === "number" && status >= 400 && status < 500) return false;
  return failureCount < 2;
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError }),
  mutationCache: new MutationCache({ onError }),
  defaultOptions: {
    queries: {
      // Fresh for 30 seconds. With the default of 0, every tab switch and
      // screen mount refetched everything the screen read. Mutations still
      // invalidate what they change, so nothing shows stale after the person
      // acts.
      staleTime: 30_000,
      retry,
    },
  },
});

/** For calls made outside React (lib/letters). Screens use `trpc` below. */
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${env.EXPO_PUBLIC_SERVER_URL}/trpc`,
      // The session rides on serverFetch, like every request to the server
      // (D-047).
      fetch: serverFetch,
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
