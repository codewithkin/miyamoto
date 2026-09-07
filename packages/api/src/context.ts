import { auth } from "@miyamoto/auth";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
  context: HonoContext;
};

/**
 * The Prisma client is deliberately NOT on the context.
 *
 * Putting it here makes every inferred tRPC type transitively reference
 * Prisma's generated internals, which are not nameable from another package
 * and break declaration emit (TS2883). Routers import the client directly
 * instead, which is also less plumbing.
 */
export async function createContext({ context }: CreateContextOptions) {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });
  return { session };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
