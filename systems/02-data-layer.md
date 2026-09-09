# Data layer

## The split (D-014)

Two systems write to one Postgres database.

| Owner | Schema | Holds |
|---|---|---|
| Prisma | `public` | Everything except message bodies |
| Mastra | `mastra` | `mastra_threads`, `mastra_messages`, and its own tables |

`Thread` in Prisma holds only metadata — owner, current Master, title,
`mastraThreadId`. Message content is Mastra's.

Why: cross-device sync is free because both halves are rows in one database,
and `schemaName: "mastra"` means its tables can never collide with a Prisma
migration. The cost is that message history is in Mastra's format, so moving
off Mastra later is a migration.

**Consequence to remember:** the data export (`account.exportData`) cannot
include message bodies. It says so rather than omitting them quietly.

## Day boundaries (D-017)

Every "day" is the **user's local day**, stored as a `YYYY-MM-DD` string and
resolved against `Profile.timezone`.

Used by: the free 3/day counter, the streak, Day 29, "14h left".

`packages/api/src/lib/day.ts`. `msUntilLocalMidnight` walks forward in time
rather than doing offset arithmetic, so a DST transition does not skew it.

Getting this wrong hands out six free questions or breaks a streak the user
actually kept.

## The free counter (D-018)

Server-side only, in `packages/api/src/lib/usage.ts`.

- The question is spent **before** the answer generates. Checking after would
  let a rewritten client take unlimited answers and fail only on bookkeeping.
- A lapsed subscription is not Pro even if the webhook that should have
  cleared the flag never arrived.
- The bonus question from a rewarded ad is granted by the server, only after
  the reward was actually earned (D-024).

## Cascades

Every user-scoped table cascades from `User`, so deleting the user row
removes conversations, trials, charges, progress and usage with it.

**The exception is deliberate:** `DeletionRequest.userId` is a plain column,
not a relation, so the audit row survives the deletion it records. Verified
explicitly — do not "fix" it into a relation.

## Seeding

`pnpm --filter @miyamoto/db db:seed`. Idempotent: every write is an upsert on
a slug or natural key, so content can be edited and re-run without
duplicating rows.
