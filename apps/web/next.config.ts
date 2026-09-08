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

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  ...(onVercel ? {} : { output: "standalone" as const }),
  transpilePackages: ["shiki"],
};

export default nextConfig;
