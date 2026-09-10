# Deploys — Vercel, and its second, hidden type-check

`apps/server` deploys to Vercel as its own project (`christus-veritas-technologies/server`, Root Directory `apps/server`). This is not the whole story: **Vercel runs two independent passes**, and only the first one is ours.

```
1. turbo run build  ->  server:build  ->  tsdown          (this repo's own pipeline)
2. Vercel's Node.js runtime detects a server entrypoint
   (apps/server/src/index.ts calls .listen()) and TYPE-CHECKS
   it and everything it imports, independently, under its own
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

A third symptom in the same failing build — `ai.ts` accessing `.reason` on
`ReplyCheck` inside `if (!check.ok)`, which is entirely valid TypeScript —
was **not reproduced** by `pnpm check-types`, `tsc -b` in `apps/server`,
or by diffing the failing commit against `HEAD` (byte-identical). The
leading theory is that step 2's compiler, upon meeting the two unsupported
tsconfig features above, did not degrade gracefully — so the `paths` fix
may resolve it too. **Unconfirmed** as of this writing; the next deploy is
the real test. If it recurs, it needs its own investigation before touching
`template.ts` or `ai.ts` — that file enforces D-007/D-030, and should not
be reshaped on a guess.

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

## Migrations are not run on deploy

Nothing in the build applies pending Prisma migrations. `postinstall` runs
only `prisma generate` (regenerates the client from the schema; touches no
data). `packages/db/prisma/migrations/` exists but holds only `.gitkeep` —
**this project has never used `prisma migrate` (dev or deploy).** Schema
changes have gone through `prisma db push` by hand, against whichever
`DATABASE_URL` was current.

This means: **a schema change committed to `main` does not reach the
production database by deploying.** Someone has to run `pnpm --filter
@miyamoto/db db:push` with `DATABASE_URL` pointed at production, separately,
by hand.

**Not fixed here — this is the owner's call, not a default to pick
silently.** Wiring `prisma migrate deploy` into the build would require
first generating a baseline migration from the current schema (there is no
history to deploy against yet), and wiring `db push` into the build would
mean every push touches the live schema unattended, including a push that
happens to contain a destructive change — `db push` without
`--accept-data-loss` fails safely in a script, but that safety is worth
keeping deliberate rather than automatic. See `progress/00-START-HERE.md`
for this as an open item.
