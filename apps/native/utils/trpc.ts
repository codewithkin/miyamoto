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

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError }),
  mutationCache: new MutationCache({ onError }),
});

const trpcClient = createTRPCClient<AppRouter>({
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
