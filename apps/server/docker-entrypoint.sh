#!/bin/sh
# The server container's start, in three steps (plan 14).
#
# The production database (Coolify) is only reachable on the host's internal
# network, so nothing outside can migrate it. Migrations are written locally
# against a local database, committed, and applied here, by the server
# itself, every time it starts:
#
#   1. prisma migrate deploy: applies only the migrations not yet recorded
#      in _prisma_migrations, so it's a no-op once done. A failure stops the
#      start: a server running against the wrong schema is broken in ways
#      that show up later and look like something else (a missing table,
#      P2021).
#   2. The content seed: Masters, corpus, stories, the Path. Idempotent,
#      keyed on slugs and natural keys, and it never touches user data. An
#      empty database has no Masters without it. A failure is logged loudly
#      and the server starts anyway, since yesterday's content beats no
#      server.
#   3. The server.
#
# The runner image has Bun and no Node, so the pinned Prisma CLI (the one
# packages/db depends on, never a freshly downloaded one) runs under Bun.
# DATABASE_URL comes from the host's environment. prisma.config.ts only
# reads apps/server/.env when one exists, and none is in the image.
set -e

cd /app/packages/db

echo "[boot] applying database migrations"
bun ./node_modules/prisma/build/index.js migrate deploy

echo "[boot] seeding content"
if ! bun prisma/seed/index.ts; then
  echo "[boot] SEED FAILED: starting with the content already in the database" >&2
fi

cd /app/apps/server
echo "[boot] starting the server"
exec bun dist/index.mjs
