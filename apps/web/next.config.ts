import "@miyamoto/env/web";
import type { NextConfig } from "next";

/**
 * `output: "standalone"` and Vercel's build pipeline are mutually exclusive.
 *
 * Standalone emits a self-contained server and skips the per-entry
 * `.nft.json` trace files. Vercel's own onBuildComplete step reads those, so
 * setting it there fails the build after a successful compile with:
 *
 *   ENOENT: no such file or directory, open '.next/next-server.js.nft.json'
 *
 * Vercel does its own output tracing and needs the default output. Docker
 * needs standalone — apps/web/Dockerfile copies .next/standalone and would
 * have nothing to copy without it.
 *
 * VERCEL is set by their builder, so each environment gets the output it
 * can actually use and neither has to remember to flip a flag.
 */
const onVercel = Boolean(process.env.VERCEL);

/**
 * The build doesn't type-check. `pnpm check-types` does.
 *
 * The site never touches the database. Its one link to the backend is
 * `import type { AppRouter }` in src/utils/trpc.ts, which is erased before
 * anything runs. But to type-check that import, tsc follows it into
 * packages/api's routers and on into packages/db, whose Prisma client is
 * generated code that isn't in git. Vercel's web build never generates it
 * (and has no reason to), so `next build` failed on files the site doesn't
 * ship:
 *
 *   packages/db/src/index.ts: Cannot find module '../prisma/generated/client'
 *
 * plus an implicit-any error for every router callback that reads from `db`.
 * Skipping the check here keeps the database out of the site's build. The
 * site's own types are still checked by `pnpm check-types` wherever the
 * client exists (locally, after `pnpm install`).
 */
const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  typescript: { ignoreBuildErrors: true },
  ...(onVercel ? {} : { output: "standalone" as const }),
  transpilePackages: ["shiki"],
};

export default nextConfig;
