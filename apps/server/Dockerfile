# Build from the monorepo root: docker build -f apps/server/Dockerfile .
#
# Same conventions as apps/web/Dockerfile, which carries the fuller commentary. The differences
# here are the runtime and the shape of the output:
#
#   - The server runs on Bun, so the builder is node (for pnpm and the tsdown build) and the
#     runner is oven/bun. Only the bundle and the Prisma client cross between them.
#   - There is no standalone bundler equivalent, so node_modules is carried over from the
#     builder rather than reinstalled — a fresh `pnpm install --prod` would drop the workspace
#     links the bundle resolves against.

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

# See apps/web/Dockerfile: platforms that inject NODE_ENV=production at build time make pnpm skip
# devDependencies, which here would drop tsdown and typescript.
ENV NODE_ENV=development

# The env schema is validated at import time and the real values arrive from compose at run time,
# so the build must not require them.
ENV SKIP_ENV_VALIDATION=1

# Workspace manifests + lockfile first, so the install layer survives source edits.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/config/package.json packages/config/
COPY packages/env/package.json packages/env/
COPY packages/db/package.json packages/db/
COPY packages/auth/package.json packages/auth/
COPY packages/api/package.json packages/api/
COPY apps/server/package.json apps/server/

# packages/db's postinstall runs `prisma generate`, which needs the schema present before the
# install rather than after it. No DATABASE_URL is set: prisma.config.ts falls back to an
# unusable placeholder when the variable is absent, because generate only reads the schema.
COPY packages/db/prisma/ packages/db/prisma/
COPY packages/db/prisma.config.ts packages/db/

# `--filter server...` takes the server and its dependencies only — not apps/web, and not
# apps/native with the whole React Native tree behind it.
RUN pnpm install --frozen-lockfile --filter server...

COPY packages/config/ packages/config/
COPY packages/env/ packages/env/
COPY packages/db/ packages/db/
COPY packages/auth/ packages/auth/
COPY packages/api/ packages/api/
COPY apps/server/ apps/server/

ENV NODE_ENV=production

RUN pnpm --filter server build

# ---- Runner ----
FROM oven/bun:1 AS runner

WORKDIR /app

# Prisma's query engine needs OpenSSL at run time as well as at build time.
USER root
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000

# The tsdown bundle still resolves @miyamoto/* and the generated Prisma client from
# node_modules, so the tree comes across whole. packages/ is copied for the generated client and
# the schema; nothing else in the image reads it.
COPY --from=builder --chown=bun:bun /app/node_modules ./node_modules
COPY --from=builder --chown=bun:bun /app/package.json ./
COPY --from=builder --chown=bun:bun /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=bun:bun /app/.npmrc ./
COPY --from=builder --chown=bun:bun /app/packages ./packages
COPY --from=builder --chown=bun:bun /app/apps/server ./apps/server

USER bun

WORKDIR /app/apps/server

EXPOSE 3000

CMD ["bun", "dist/index.mjs"]
