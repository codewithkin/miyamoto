# 12 — The session on every request, onboarding in one question, buttons that show their work

**Status: in flight (session 7).**

Three requests from the owner, in the order they're built.

1. **The 401.** After signing in, sending the first chat message said "Sign
   in again to ask", and the server logged `POST /ai 401 1ms`. The chat
   transport was the one request to our server that never attached the
   session: tRPC adds the cookie in its link's `headers()`, chat history adds
   it by hand, and `new DefaultChatTransport({ api })` used plain `fetch`
   with nothing. React Native's own `fetch` can't stream a response either,
   so with the cookie fixed, the reply would have failed next. Fix it once,
   for every request, so a new request can't forget.
2. **Onboarding becomes one question.** Sign in, say what's troubling you
   (pick or type), and land in the real chat with a real Master, the
   message already in the composer. Every onboarding step after that
   question is removed.
3. **Buttons show their work.** Anything that waits on the server is
   disabled while it waits, and looks disabled. Where the server's answer is
   predictable, the screen shows it at once and rolls back if it's refused.

## A — The session on every request

## A1 — One way to call our server

- [ ] `pending-A1`
- **Commit:** `fix(native): send the session with every request to the server`
- **Touches:** `lib/server-fetch.ts` (new), `utils/trpc.ts`, `app/(app)/chat.tsx`
- **Done when:** `serverFetch` attaches the stored session cookie on native
  (credentials `include` on web). tRPC, chat history and the chat transport
  all call it, and the transport streams through `expo/fetch`.

## A2 — A refused session sends you to sign in, once, with a reason

- [ ] `pending-A2`
- **Commit:** `feat(native): send a signed-out session back to welcome, with the reason`
- **Touches:** `lib/server-fetch.ts`, `utils/trpc.ts`, `lib/auth-errors.ts`
- **Done when:** a 401 from `/ai` or `UNAUTHORIZED` from tRPC asks Better
  Auth whether the session is still live. If it isn't, the app goes to
  welcome, which says "You were signed out. Sign in to carry on." A
  still-live session leaves the screen as it is. Concurrent 401s share one
  check.

## A3 — The rule can't quietly break again

- [ ] `pending-A3`
- **Commit:** `chore(native): fail check-types when a request skips serverFetch`
- **Touches:** `scripts/check-server-fetch.mjs` (new), `package.json`
- **Done when:** `pnpm check-types` in apps/native fails on a bare `fetch(`
  outside `lib/server-fetch.ts`, and on a `DefaultChatTransport` that is not
  handed our fetch.

## B — Onboarding in one question

## B1 — Chat takes a message to put in the composer

- [ ] `pending-B1`
- **Commit:** `feat(native): let chat open with a message ready to send`
- **Touches:** `app/(app)/chat.tsx`
- **Done when:** `/(app)/chat?prefill=…` opens with that text in the
  composer, unsent (D-018: spending a free question is the person's
  decision). It clears the param so the text doesn't come back after
  they've cleared it, and wins over the thread-title seed, which is cut to
  120 characters.

## B2 — The problem screen is the whole of onboarding

- [ ] `pending-B2`
- **Commit:** `feat(native): go from the first question straight into a real chat`
- **Touches:** `app/(onboarding)/problem.tsx`
- **Done when:** picking or typing a problem and pressing the button claims
  the account (Musashi, Firm, reminders off, device timezone), counts
  Onboarding.completed, and replaces to the chat with the problem in the
  composer. The button shows the claim in progress, and a failed claim says
  so and can be retried. Skip does the same with an empty composer.
  Every row says Musashi answers, because he's the only Master a new
  account has (Seneca arrives on Day 7, Curie on Day 21, Sun Tzu with Pro).
  The old per-row faces promised Seneca and Curie, who couldn't answer in
  a real chat (D-046).

## B3 — Remove the steps after it

- [ ] `pending-B3`
- **Commit:** `refactor(native): remove the onboarding steps after the first question`
- **Touches:** deletes `app/(onboarding)/{answer,carrying,master,pressure,forging,payoff,first-week,reminders,offer}.tsx`,
  `components/onboarding-header.tsx`, `lib/use-first-week.ts`,
  `content/sample-answers.ts`, plus anything left unused by them
- **Done when:** nothing imports them, `tsc` passes, and the Android bundle
  builds.

## C — Buttons that show their work

## C1 — Button has a loading state, and disabled looks disabled

- [ ] `pending-C1`
- **Commit:** `feat(native): give Button a loading state and an unmistakable disabled one`
- **Touches:** `components/ui.tsx`, `components/touchable.tsx`
- **Done when:** `<Button loading>` shows a spinner in the variant's colour
  and a working label, blocks presses, and reports `busy` to screen
  readers. A disabled Button is drawn in ink with faint text rather than
  as translucent indigo. Touchable's disabled dim is part of its animated
  style, because the press animation's opacity was overriding it.

## C2 — Every server action shows it is waiting

- [ ] `pending-C2`
- **Commit:** `feat(native): show every server action in progress and block double taps`
- **Touches:** every screen with a mutation or a store call: path, chat
  (charge card, send), masters, story, switch sheet, settings, delete
  account, export, you (sign out), paywall, out-of-answers sheet
- **Done when:** each button that waits on the server uses `loading`, and a
  row that starts a request (a Master, a story's "ask") shows it on that
  row and disables its siblings.

## C3 — Optimistic where the answer is predictable

- [ ] `pending-C3`
- **Commit:** `feat(native): show predictable results at once and roll back on refusal`
- **Touches:** `app/(app)/index.tsx`, `app/(app)/chat.tsx`,
  `components/overlays.tsx`, `app/settings.tsx`
- **Done when:** completing today's trial, accepting or completing a
  charge, switching the Master, toggling reminders and spending a question
  (the "N of 3 left" counter) change on screen before the server answers.
  Each restores the previous value if the server refuses and says so.

## C4 — The query client behaves on a phone

- [ ] `pending-C4`
- **Commit:** `feat(native): refetch on return to the app, and never retry a refusal`
- **Touches:** `utils/trpc.ts`, `app/_layout.tsx`
- **Done when:** queries are fresh for 30 seconds (no refetch storm on
  every tab switch), refetch when the app returns to the foreground
  (focusManager on AppState), and 4xx errors are never retried.

## D — Record it

## D1 — Docs

- [ ] `pending-D1`
- **Commit:** `docs: record the session rule, one-question onboarding and loading states`
- **Touches:** `systems/09-decisions.md` (D-047..D-049), `systems/06-auth.md`,
  `systems/12-deploys.md` (the web build), `plans/00-roadmap.md`,
  `progress/00-START-HERE.md`
