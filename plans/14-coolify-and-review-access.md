# 14 — Coolify: migrations on start, and a sign-in for Play's reviewers

**Status: in flight (session 8).** Interleaved with plan 13, whose C2
onward waits on this: its push-token table needs migrations to reach
production, and this plan is how they get there.

The owner's requests, session 8:

1. **The server and its database moved to Coolify.** The database is only
   reachable on Coolify's internal network, so nothing on the owner's PC
   can migrate it. Migrations are written locally against the local
   database (as always), and the server's container applies them itself on
   every start. `prisma migrate deploy` only applies what's pending, so
   that's a no-op once done. The new database is empty, so the start also
   runs the content seed. The seed is idempotent, keyed on slugs and
   natural keys, and never touches user data. Without it there are no
   Masters, stories or Path.
2. **A tester account for Google Play review**, seeded on every server
   start. Play's "Sign in details" declaration needs a username and
   password that gives full access, including paid content, and reviewers
   can't use Google accounts of their own. So the app gets email and
   password sign-in, for seeded accounts only (sign-up stays off: everyone
   else signs in with Google, D-039). The reviewer account is Pro.

## F — Coolify

## F1 — Migrate and seed when the container starts

- [ ] `pending-F1`
- **Commit:** `feat(server): apply migrations and seed the content when the container starts`
- **Touches:** `apps/server/docker-entrypoint.sh` (new), `apps/server/Dockerfile`
- **Done when:** the container runs `prisma migrate deploy` (a failure
  stops the start: a server on the wrong schema is broken), then the
  content seed (a failure is logged loudly and the server starts anyway),
  then the server. The pinned Prisma CLI in the image runs under Bun, since
  the runner has no Node. No credentials are baked into the image.

## G — Review access

## G1 — Email and password, for seeded accounts only

- [ ] `pending-G1`
- **Commit:** `feat(auth): allow email sign-in for seeded accounts, with sign-up off`
- **Touches:** `packages/auth/src/index.ts`
- **Done when:** `/sign-in/email` works for an account that has a
  password; `/sign-up/email` is refused.

## G2 — The reviewer account, on every start

- [ ] `pending-G2`
- **Commit:** `feat(server): keep a Pro reviewer account for Play review`
- **Touches:** `packages/env/src/server.ts` (`REVIEWER_EMAIL`,
  `REVIEWER_PASSWORD`, `REVIEWER_NAME`), `apps/server/src/reviewer.ts` (new),
  `apps/server/src/index.ts`, `apps/server/.env.example`
- **Done when:** with both variables set, every start makes sure the
  account exists, has that password (a changed variable takes effect on
  the next start), and is Pro for life. Without them it does nothing. The
  credentials live only in the host's environment, never in the repo.
  Checked locally by signing in through the real handler.

## G3 — A way in from the welcome screen

- [ ] `pending-G3`
- **Commit:** `feat(native): add email sign-in on welcome for review accounts`
- **Touches:** `app/(auth)/welcome.tsx`, `components/email-sign-in.tsx` (new)
- **Done when:** a quiet "Sign in with email" link under the Google
  button opens a sheet with email and password. Success lands on the gate
  like Google does. A wrong password says so in one sentence.

## H — Record it

## H1 — Docs

- [ ] `pending-H1`
- **Commit:** `docs: record the Coolify start-up and the review account`
- **Touches:** `systems/12-deploys.md`, `systems/06-auth.md`,
  `systems/09-decisions.md`, `progress/00-START-HERE.md`
