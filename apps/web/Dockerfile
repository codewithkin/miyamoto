# Build from the monorepo root: docker build -f apps/web/Dockerfile .
#
# Adapted from the static-wave / excuseless / word-hug web images — same stack and monorepo
# shape (pnpm workspaces on the `catalog:` protocol, a Next.js app fed by shared packages/).
# Those files carry fixes for failures already hit in real deployments, so the reasoning behind
# some lines isn't visible from this codebase alone; each is commented rather than left to look
# like cruft.
#
# Three differences from those references, all because this app is not database-free:
#
#   1. apps/web depends on @miyamoto/api for its tRPC types, and that package pulls in
#      @miyamoto/db (Prisma) and @miyamoto/auth. All three are copied, and packages/db's
#      postinstall runs `prisma generate`.
#   2. openssl is installed — Prisma's query engine links against it, and node:24-slim does not
#      ship it.
#   3. next.config.ts sets `output: "standalone"`, so the runner copies the pruned bundle
#      instead of the whole node_modules tree.
#
# apps/native and apps/server are never copied: the Expo app would drag the React Native
# dependency tree into a build that doesn't use it, and the server is its own image.

FROM node:24-slim AS builder

WORKDIR /app

# Prisma's engines link against OpenSSL; the slim image has no libssl.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# corepack rather than `npm install -g pnpm@11`: package.json pins packageManager to pnpm@11.4.0,
# and a floating `@11` can resolve to a newer patch than the one that wrote pnpm-lock.yaml, which
# makes --frozen-lockfile fail for no useful reason.
RUN corepack enable && corepack prepare pnpm@11.4.0 --activate

# Some platforms (Coolify, Dokku and similar) inject NODE_ENV=production as a *build-time*
# variable. pnpm reads that the same as `--prod` and silently skips devDependencies — here that
# would drop typescript, tailwindcss and @tailwindcss/postcss, all of which `next build` needs.
#
# Scoped to the install step only, and flipped back to production before `next build` below:
# leaving it as development through the build makes Next warn about a non-standard NODE_ENV and
# then fail prerendering, because the build runs against React's development bundle. NODE_ENV
# only affects what pnpm *installs*, so switching it afterwards is safe.
ENV NODE_ENV=development

# Workspace manifests + lockfile first, so the install layer survives source edits.
# .npmrc matters here: it sets node-linker=isolated, and installing without it produces a
# different node_modules layout than the one the app is developed against.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/config/package.json packages/config/
COPY packages/env/package.json packages/env/
COPY packages/ui/package.json packages/ui/
COPY packages/db/package.json packages/db/
COPY packages/auth/package.json packages/auth/
COPY packages/api/package.json packages/api/
COPY apps/web/package.json apps/web/

# packages/db's postinstall runs `prisma generate`, which needs the schema present before the
# install step rather than after it.
COPY packages/db/prisma/ packages/db/prisma/
COPY packages/db/prisma.config.ts packages/db/

# `--filter web...` installs the web app and everything it depends on, and nothing else. Without
# it pnpm would also resolve apps/native, which pulls in Expo and React Native for an image that
# never builds them.
#
# No DATABASE_URL is set for this: prisma.config.ts falls back to an unusable placeholder when
# the variable is absent, because `prisma generate` only reads the schema and never opens a
# connection. Anything that does connect still fails loudly and names the missing variable.
RUN pnpm install --frozen-lockfile --filter web...

# Source after install for better layer caching.
COPY packages/config/ packages/config/
COPY packages/env/ packages/env/
COPY packages/ui/ packages/ui/
COPY packages/db/ packages/db/
COPY packages/auth/ packages/auth/
COPY packages/api/ packages/api/
COPY apps/web/ apps/web/

# env-nextjs validates NEXT_PUBLIC_* at build time and bakes the value into the client bundle,
# so this has to be present as an ARG/ENV pair or `next build` fails rather than the run. Any
# new NEXT_PUBLIC_* in packages/env/src/web.ts must be added here too.
ARG NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL}

# Back to production for the build itself — see the NODE_ENV note above.
ENV NODE_ENV=production

RUN pnpm --filter web build

# standalone output excludes public/; create it so the runner copy below never fails on a
# project that happens not to have one.
RUN mkdir -p apps/web/public

# ---- Runner ----
FROM node:24-slim AS runner

WORKDIR /app

# Prisma's engine is present in the standalone bundle and still needs OpenSSL at run time.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

# `output: "standalone"` emits a self-contained server plus exactly the node_modules it needs,
# so nothing is installed here. static/ and public/ are not part of that bundle and are copied
# alongside it.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3001

# The standalone server keeps the workspace layout, so the entrypoint sits under apps/web.
CMD ["node", "apps/web/server.js"]
