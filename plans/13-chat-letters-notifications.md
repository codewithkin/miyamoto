# 13 — Chat that reads like messages, letters that find you, and more questions for an ad

**Status: built (session 8).** Android only for now. Not yet seen on a device. Push to a closed app waits on the owner's Firebase setup (`systems/13-notifications.md`). The rules are D-054 to D-057.

The owner's requests, session 8:

1. **Bubbles.** The Master's messages and the person's own are told apart by
   side and colour. A charge is its own bubble below the letter.
2. **The first message vanished.** The first thing a person sent never
   showed as a bubble. Cause: the chat loads the thread's history when it
   opens, and applies it with `setMessages(history)` whenever it arrives.
   Onboarding now opens the chat with the problem already in the composer,
   so people send at once, and history can take seconds (Render logged
   `GET /ai/history 200 12s`). The empty history then lands on top of the
   message just sent and wipes it.
3. **Letters that arrive after you leave.** Send, close the app, and get a
   notification when the letter lands: the Master's name and the start of
   the letter, cut with "…". No replying from the notification.
4. **Streaming, and a better "thinking" state.** Token streaming isn't
   possible: every letter is checked against the record before any of it
   is shown (D-012), and a streamed sentence can't be taken back. So the
   letter arrives checked and whole, and writes itself out on screen. The
   wait before it gets a proper typing indicator.
5. **Out of questions: an ad for three more, or Pro.** Two buttons with
   icons, wherever running out is met. Locked Masters stay Pro-only.
6. **Retention notifications, just enough.**

How a letter finds a closed app: the server already finishes and saves
every letter even if the phone disconnects, because nothing cancels it.
What's missing is telling the person. The phone confirms each letter it
receives. A letter nobody confirms within 30 seconds (or whose request the
server saw aborted) goes out as an Expo push. A phone that's alive but in
the background posts its own local notification and confirms, so there's
one notification either way. Push on Android needs Firebase: until the
owner adds `google-services.json` and the FCM key, only the local half
works.

## A — Chat

## A1 — History never overwrites what was just sent

- [x] `1a09e25`
- **Commit:** `fix(native): keep the first message when history arrives after it`
- **Touches:** `app/(app)/chat.tsx`
- **Done when:** history that arrives mid-send waits until the chat is
  idle, then merges: the thread's history first, then anything sent on this
  visit that the history doesn't already hold (matched by role and text).
  Returning to the app with a letter still missing reloads history.

**Note (session 8):** A2 and A3 land as one commit. The typing indicator is
a Master bubble and the reveal lives in the letter bubble, so they share
one new file. Split, A2 would carry A3's code unused, or A3 would rewrite
what A2 just added.

## A2 — Bubbles

- [x] `925d9ab` (with A3)
- **Commit:** `feat(native): draw the chat as bubbles, with the charge as its own`
- **Touches:** `app/(app)/chat.tsx`, `components/chat-bubbles.tsx` (new)
- **Done when:** the person's messages sit right in a solid indigo bubble.
  The Master's sit left in a raised ink bubble in Zen Old Mincho, with the
  face at the foot of the group. A charge is its own bubble under the
  letter. A failed send says so under the person's bubble, with Retry where
  retrying can help.

## A3 — The letter writes itself out, and the wait looks alive

- [x] `925d9ab`
- **Commit:** `feat(native): write the letter out on arrival, and show the Master typing`
- **Touches:** `components/chat-bubbles.tsx`, `app/(app)/chat.tsx`
- **Done when:** a letter that arrives on this visit reveals word by word,
  and its charge follows once it's done. History appears whole. While
  waiting, a Master bubble with three bouncing dots. After 12 seconds a
  line saying every story is checked before it's sent. After 30, that
  they can leave and will be told when it arrives, if notifications are
  on.

## B — More questions

## B1 — An ad is worth three questions, five times a day

- [x] `5403faa`
- **Commit:** `feat(api): make an ad worth three questions, up to five a day`
- **Touches:** `packages/api/src/lib/usage.ts`, `packages/api/src/routers/chat.ts`
- **Done when:** `grantBonus` adds three, refuses a sixth grant in a day,
  and `usage` reports `adsLeft`. The cap exists because the server can't
  verify an ad was watched (no AdMob server-side verification yet), so an
  uncapped grant is unlimited free model calls for a rewritten client.

## B2 — Running out offers both, everywhere

- [x] `7e616b0`
- **Commit:** `feat(native): offer an ad for three more or Pro wherever questions run out`
- **Touches:** `components/ui.tsx` (a `pro` variant), `components/overlays.tsx`,
  `app/(app)/chat.tsx`, `app/(app)/you.tsx`
- **Done when:** the chat's composer and the out-of-answers sheet show
  "Watch an ad · +3 questions" (play icon) and "Go Pro · unlimited" (gold,
  infinity icon). With no ads left today, the ad button says so. The You
  tab shows today's count with the same two ways out. Locked Masters and
  locked stories stay Pro-only.

## C — Letters that find you

## C1 — Push tokens

- [x] `3557a55`
- **Commit:** `feat(db): store a push token per install`
- **Touches:** `packages/db/prisma/schema/notifications.prisma` (new),
  `auth.prisma`, a migration
- **Done when:** `PushToken` (unique token, cascades with the user) exists
  and the migration applies locally. Production needs `migrate deploy`
  (owner).

## C2 — The server can push, and knows what was delivered

- [x] `c9ea392`
- **Commit:** `feat(api): register push tokens, send pushes, and hear which letters arrived`
- **Touches:** `packages/api/src/lib/push.ts`, `lib/deliveries.ts` (new),
  `routers/account.ts`, `routers/chat.ts`
- **Done when:** `account.registerPushToken` and `unregisterPushToken`
  work (and never throw on a missing table). `sendPush` posts to Expo and
  drops tokens Expo says are dead. `chat.replyReceived` confirms a pending
  delivery.

## C3 — `/ai` pushes a letter nobody received

- [x] `77d9cc0`
- **Commit:** `feat(server): push a letter the phone never confirmed`
- **Touches:** `apps/server/src/routes/ai.ts`
- **Done when:** after a letter is saved, the server waits up to 30 seconds
  for the phone to confirm it. No confirmation, or a request already
  aborted, sends one push: the Master's name, the letter's opening cut at a
  word with "…", and the thread id.

## C4 — The phone's half

- [x] `4a35a15`
- **Commit:** `feat(native): confirm letters, notify from the background, open the chat from a notification`
- **Touches:** `lib/notifications.ts`, `lib/letters.ts` (new), `app/(app)/_layout.tsx`,
  `app/(app)/chat.tsx`, `app/(app)/you.tsx`, `app.config.js` (new)
- **Done when:** with permission, the install registers its push token,
  and unregisters it on sign-out. Every letter received is confirmed. One
  that arrives while the app is in the background posts a local
  notification on a "Letters" channel. A letter notification is never
  shown while the app is open. Tapping one opens the chat.
  `app.config.js` adds `googleServicesFile` only when the file exists.

## C5 — Ask at the moment it matters

- [x] `0be2524`
- **Commit:** `feat(native): offer letter notifications while the first letter is on its way`
- **Touches:** `app/(app)/chat.tsx`
- **Done when:** while a letter is being written and notifications aren't
  on (and were never refused), a quiet row offers "Tell me when it
  arrives". It raises the OS prompt once.

## D — Retention, just enough

## D1 — Two notifications worth getting

- [x] `56f8c29`
- **Commit:** `feat(native): say when questions are back, and when a charge is still open`
- **Touches:** `lib/notifications.ts`, `lib/use-reminders.ts`
- **Done when:** a free user who runs out gets one notification the next
  morning at 08:00: their questions are back. A charge still open at 18:00
  on its day gets one nudge in its Master's name. Both need permission.
  Both replace rather than stack, and both are cancelled when they stop
  being true (Pro, or the charge done).

## E — Record it

## E1 — Privacy: push tokens

- [x] `587cafc`
- **Commit:** `docs(web): disclose push tokens in the privacy policy`
- **Touches:** `apps/web/src/app/privacy/page.tsx`, `systems/11-play-data-safety.md`

## E2 — Docs

- [x] this commit
- **Commit:** `docs: record bubbles, letters that find you, and ads for questions`
- **Touches:** `systems/09-decisions.md`, `systems/13-notifications.md` (new),
  `plans/00-roadmap.md`, `progress/00-START-HERE.md`
