# Deploys — Vercel, and its second, hidden type-check

> **As of session 7 the server runs on Render**
> (`https://miyamoto-server.onrender.com`, started with `bun run
> dist/index.mjs`). The Vercel sections below record why deploying
> `apps/server` there failed, and still apply if it ever moves back.
> Render's own notes: the database URL's `sslmode=require` prints a `pg`
> deprecation warning on every boot; `sslmode=verify-full` means the same
> thing today and silences it. The client-IP header note is in
> `systems/06-auth.md`.

`apps/server` deploys to Vercel as its own project (`christus-veritas-technologies/server`, Root Directory `apps/server`). This is not the whole story: **Vercel runs two independent passes**, and only the first one is ours.

```
1. turbo run build  ->  server:build  ->  tsdown          (this repo's own pipeline)
2. Vercel's Node.js runtime detects apps/server/src/index.ts
   as a function (it exports a Hono app — a fetch-compatible
   default export, not a .listen() server) and TYPE-CHECKS it
   and everything it imports, independently, under its own
   compiler settings                                        (not ours)
```

Step 1 can succeed while step 2 fails — the build log shows this as two
back-to-back sections, `server:build` (tsdown, "Build complete") followed
immediately by an unlabeled `Using TypeScript 6.0.3 (local user-provided)`
line with no turbo task prefix. That second line is step 2.

## Why step 2 disagreed with `pnpm check-types`

Two real bugs were only visible there, confirmed and fixed in `3ba9f82`
(session 6):

1. **`apps/server/tsconfig.json` used two features Vercel's docs say the
   Node.js runtime does not support: "Path Mappings" and "Project
   References."** The config had both — `paths: {"@/*": [...]}` (unused by
   anything under `apps/server/src`, confirmed by grep) and `composite:
   true` (kept: nothing in the repo declares a `references` array, so it
   was inert, not implicated — and `apps/server`'s own `check-types`
   script needs `-b` mode). The unused `paths` entry was removed.

2. **`packages/env/src/server.ts` called `@t3-oss/env-core`'s `createEnv`
   with no `clientPrefix`/`client`** — the normal way to write a
   server-only schema. But `createEnv`'s `TPrefix` type parameter has no
   default, and the server-only branch of its own overload type never
   mentions `clientPrefix` at all, so TypeScript has nowhere to *infer*
   `TPrefix` from. Under most compilation contexts it infers `undefined`
   (safe); under whatever step 2 uses, it inferred `string | undefined`
   instead, and every server env var got `@t3-oss/env-core`'s own
   "should not be prefixed" branded-error type — its mapped type's
   `` TKey extends `${TPrefix}${string}` `` check matches almost any key
   once `TPrefix` includes `string`. Fix: `clientPrefix: undefined` in the
   object literal, which gives TypeScript an actual property to infer
   `TPrefix` from, rather than nothing. (Passing `<undefined>` as an
   *explicit* type argument instead is a trap: providing some but not all
   of `createEnv`'s type parameters stops the rest — `TServer` included —
   from being inferred from the arguments at all, so they fall back to
   their own defaults and `env`'s type collapses to `Readonly<{}>`. Caught
   by `pnpm check-types` before it was committed.)

3. **A third symptom in the same failing build was a genuinely separate
   bug, not a consequence of the first two.** `ai.ts` accessed `.reason`
   on `ReplyCheck` inside `if (!check.ok)` — entirely valid TypeScript,
   never reproduced by `pnpm check-types`, `tsc -b` in `apps/server`, or by
   diffing the failing commit against `HEAD` (byte-identical each time).
   Fixing (1) and (2) above and redeploying did **not** clear it — three
   separate deploys reported the exact same three lines and the exact same
   reported shape (`{ok:true, charge: string}`, `check` shown as the
   *accepted* variant, inside a block guarded by `!check.ok`), unmoved by
   either fix. So the "step 2 doesn't degrade gracefully on an unsupported
   tsconfig feature" theory from the first two bugs does **not** explain
   this one — it is unrelated, whatever its actual mechanism is.

   Fixed in `170d3a0` without ever identifying that mechanism: `reason` was
   made a field on *both* branches of `ReplyCheck` (`null` when accepted,
   the same shape `charge` already had), so reading it stops depending on
   `check.ok` having been narrowed correctly by whatever compiler evaluates
   it. This is additive and type-only — no behaviour moved, confirmed with
   `pnpm check-types` — and it is the last resort for this class of bug,
   not the first one to reach for: it stops being worth using guesses about
   an opaque checker to justify reshaping a type that enforces D-007/D-030,
   in favour of a change whose correctness doesn't depend on the guess
   being right at all.

## What this means for a new deploy-breaking error

If `pnpm check-types` (or `tsc -b` in the specific package) is clean but
Vercel's build still fails on a TypeScript error:

1. **Read which step failed.** `server:build` failing is tsdown, and is a
   real bug in the exact way `check-types` would show it. A separate,
   unlabeled `Using TypeScript X.X.X` step failing is step 2 above —
   suspect an unsupported tsconfig feature or a `createEnv`-style
   inference gap before suspecting the source.
2. **Check `apps/server/tsconfig.json` for `paths` or `references`.**
   Vercel's Node.js runtime docs (`/docs/functions/runtimes/node-js`) name
   these as unsupported, explicitly.
3. **Grep for `createEnv(` calls that omit `clientPrefix`.** Same class of
   bug as above; the fix is the same one line.
4. **Diff the failing commit against `HEAD`** for the files named in the
   error before assuming the code is wrong — a fix already on `main` can
   predate the deploy that reports the old error, if the deploy was
   triggered by an older commit.
5. **Don't assume one fix explains a second, unrelated-looking error in
   the same failed build.** The `ai.ts`/`ReplyCheck` case above looked, at
   first, like it might share a cause with the tsconfig/`createEnv` bugs —
   it didn't, and redeploying was what actually showed that. If a
   discriminated-union field access fails only on this second check and
   never locally, and a redeploy after an unrelated fix doesn't clear it,
   the direct fix is to put that field on every branch of the union
   (`null` where it doesn't otherwise apply) rather than keep narrowing a
   theory about why the checker disagrees.

## A build that succeeds, then a page that crashes: `FUNCTION_INVOCATION_FAILED`

This is a different failure from the two above — the build passes, the
deployment goes live, and *every* request to it 500s with Vercel's generic
"This Serverless Function has crashed" page. This is (almost always) not a
code bug. It is a required environment variable missing, empty, or
malformed **in the Vercel project's own settings** — not in this repo.

**Why it kills every request identically**, rather than only the routes
that use the broken thing: `apps/server/src/index.ts` imports
`@miyamoto/auth` and `@miyamoto/db`, and both construct their singleton
*eagerly, at module load* — `export const auth = createAuth();` and
`const prisma = createPrismaClient();` run the instant the module is
imported, before the `Hono` app or any route exists. Both read
`@miyamoto/env/server`, whose `createEnv(...)` validates every var **at
that same import time**. `@t3-oss/env-core`'s own default handler for a
failed variable is:

```js
console.error("❌ Invalid environment variables:", issues);
throw new Error("Invalid environment variables");
```

That throw happens before `export default app` is ever reached, so the
module fails to evaluate at all — there is no Hono app for Vercel's
function wrapper to call, on any route, on any request. That is exactly
`FUNCTION_INVOCATION_FAILED`.

**Where to look:** the `console.error` line above lands in the deployment's
function logs (Vercel dashboard -> the deployment -> Logs, or the
`/_logs?requestId=...` link on the crash page, which needs the owner's own
login — not fetchable by an agent). Search for `Invalid environment
variables`; it names the exact key(s) that failed.

**What to check before even opening the logs** — the four env vars
`packages/env/src/server.ts` requires with no default: `DATABASE_URL`,
`BETTER_AUTH_SECRET` (must be ≥32 characters), `BETTER_AUTH_URL`,
`CORS_ORIGIN` (the latter two must each parse as a full URL). Confirm each
is set on the **Production** environment specifically (Vercel scopes vars
per environment — a Preview-only value does not exist in Production), with
no stray quotes or trailing whitespace from a paste. `BETTER_AUTH_URL`
must equal the domain actually being deployed to, exactly — see
`systems/06-auth.md`'s production values, and keep that doc's recorded
domain in sync with whatever real domain gets attached in Vercel.

## Migrations are not run on deploy

Nothing in the build applies pending Prisma migrations. `postinstall` runs
only `prisma generate` (regenerates the client from the schema; touches no
data). Until session 6, `packages/db/prisma/migrations/` held only
`.gitkeep` — this project had never used `prisma migrate` (dev or deploy);
every schema change went through `prisma db push` by hand.

This means: **a schema change committed to `main` still does not reach the
production database by deploying.** Someone has to run `pnpm --filter
@miyamoto/db db:push` with `DATABASE_URL` pointed at production, separately,
by hand — that has not changed.

**What session 6 did:** started the migration history for the LOCAL dev
database, by baselining. `prisma migrate dev` refused to run outright — it
saw the live schema already matching, with zero recorded migrations
("drift"), and offered to reset it (drop everything) rather than proceed.
The fix is Prisma's own documented baseline procedure, not `migrate dev`:

```bash
# 1. Generate the migration SQL from nothing to the current schema, without applying it
npx prisma migrate diff --from-empty --to-schema=prisma/schema --script \
  -o prisma/migrations/<YYYYMMDDHHMMSS>_init/migration.sql

# 2. Record it as already applied — the tables already exist, nothing to run
npx prisma migrate resolve --applied <YYYYMMDDHHMMSS>_init

# 3. Confirm
npx prisma migrate status   # "Database schema is up to date!"
npx prisma migrate dev      # "Already in sync" — a clean no-op
```

Run these with the CLI actually pinned in `packages/db/package.json`
(`npx prisma` from inside `packages/db`, or `pnpm --filter @miyamoto/db
exec prisma`) — **not `pnpm dlx prisma`**, which always fetches the newest
published version regardless of what the project pins. At the time of
writing that's a preview major that renamed `migrate` to an unrelated
`migration` command tree and rejects this repo's `prisma.config.ts`,
written for Prisma 7, as unreadable. It reads fine under the pinned 7.10.0.

**Production is now migrated (session 7) — but it needed a reset, not a
baseline.** `prisma db push` against production's real `DATABASE_URL`
refused with a data-loss warning naming tables and an enum with no
relationship to this schema at all: `Guardian`, `PaymentOrder`,
`PaymentSession`, `RefreshToken`, a PascalCase `User`, and `Plan` values
like `STUDENT_SCHOLAR` and `GUARDIAN_FAMILY_STARTER`. The `DATABASE_URL`
Vercel had was a leftover Prisma Postgres instance from an unrelated
project, not an out-of-sync Miyamoto database — this was never the
"production already has these tables, mark the migration applied without
running it" case the local baseline was. The owner confirmed it was
disposable; `prisma migrate reset --force` dropped it and applied
`20260910162522_init` cleanly, then `pnpm --filter @miyamoto/db db:seed`
populated it (5 Masters, 28 moments, 14 quotations, 20 stories, 30 Path
days, 90 trials, 6 wounds — the same counts `db:seed` produces locally;
it is idempotent, safe to re-run). `prisma migrate status` against
production now reports the same "Database schema is up to date!" as dev.

**A reset needs fresh, explicit consent every time, not blanket
pre-launch authorisation.** `CLAUDE.md`'s "destructive actions are fine
pre-launch, just announce them" rule covers ordinary schema changes to
*our own* data — it is not enough on its own to justify dropping tables
whose ownership hasn't been confirmed. This one only proceeded after the
owner explicitly named the old data as disposable and confirmed via
`AskUserQuestion`, with `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`
set for that one command.

**Still not wired into the build — still the owner's call.** Production
being migrated now makes this possible, not automatic: adding `prisma
migrate deploy` to `packages/db`'s `postinstall` (after `prisma
generate`, guarded so a missing `DATABASE_URL` — e.g. a fresh CI checkout
with none configured — skips rather than fails) would make every deploy
apply pending migrations on its own. That's a deliberate step to take
once, not a default this session picked silently: it changes production
data on every push from then on. See `progress/00-START-HERE.md`.
