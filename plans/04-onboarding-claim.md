# 04 — Persist the onboarding draft

**The most user-visible gap currently in the app.**

Onboarding collects eleven screens of answers into a local SecureStore draft
— the seed problem, wounds, first Master, pressure, reminder times, timezone
— and nothing ever writes them to the server. A user completes the quiz,
signs in, and lands on a Path built from defaults.

`sign-in.tsx` deliberately does not clear the draft, so the data is still
sitting there. Nothing consumes it.

**Depends on:** nothing.
**Read first:** `apps/native/lib/onboarding-store.tsx`.

## T01 — The claim mutation

- [ ] `pending-T01`
- **Commit:** `feat(api): claim the onboarding draft at sign-up`
- **Touches:** `packages/api/src/routers/onboarding.ts` (new)
- **Done when:** an authenticated mutation takes the draft, resolves wound
  and master slugs to rows, and writes `OnboardingProfile`, `Profile`
  (timezone) and an initial `PathProgress`.
- **Must be idempotent.** Claiming twice cannot reset a user's progress — a
  retry after a flaky network must be safe.

## T02 — Call it after sign-in, then clear the draft

- [ ] `pending-T02`
- **Commit:** `feat(native): submit the draft once a session exists`
- **Depends on:** T01
- **Touches:** `apps/native/app/(onboarding)/sign-in.tsx`
- **Done when:** the draft is submitted on a successful session and cleared
  **only** after the server confirms. A failed round trip must not lose
  eleven screens of answers.

- **Note (session 3):** `sign-in.tsx` also routes to `/(drawer)`, a group
  that does not exist — the app's shell is `(app)`. Every successful sign-in
  lands on the not-found screen today. Fixed in the same commit, because the
  submission and the destination are one handler.

## T02a — A signed-in user does not see onboarding again

- [ ] `pending-T02a`
- **Commit:** `feat(native): send a signed-in user straight to the Path`
- **Depends on:** T02
- **Touches:** `apps/native/app/(onboarding)/_layout.tsx`, `app/(app)/_layout.tsx`
- **Note (session 3):** not in the original plan. Nothing reads the session
  at launch, so a returning user reopens the app on the welcome screen and
  the `(app)` group renders for a user with no session.
- **Done when:** a session redirects onboarding to `(app)`, and no session
  redirects `(app)` to onboarding.

## T03 — Day 1 reflects the quiz

- [ ] `pending-T03`
- **Commit:** `feat(native): build Day 1 from the user's own answers`
- **Depends on:** T02
- **Done when:** the home screen's trial is at the chosen pressure with the
  chosen Master speaking — the thing onboarding screen 08 promised when it
  said the plan was written for them.

## T04 — The first question has somewhere to go

- [ ] `pending-T04`
- **Commit:** `feat(native): open the first thread with the problem they brought`
- **Depends on:** T01
- **Touches:** `packages/api/src/routers/onboarding.ts`, `app/(app)/chat.tsx`
- **Note (session 3):** not in the original plan. The chat tab picks
  `threads[0]` and disables the composer when there is none, so a new user
  opens Chat to a screen that cannot send. `OnboardingProfile.seedProblem`
  is documented as "the first thing their Master answers" and nothing
  reads it.
- **Done when:** claiming creates the first thread with the first Master,
  titled with the seed problem, and the chat composer opens pre-filled with
  it — unsent, because spending a question is the user's decision (D-018).
