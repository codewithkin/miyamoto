# Notifications: what the app sends, when, and how a letter finds a closed app

> Android only for now (plan 13). Everything here needs the person's
> permission, asked for once, at a moment with a reason on screen, and a
> refusal is never asked again (`lib/notifications.ts`).

## Everything the app can send

| What | When | Channel | From | Where it's built |
|---|---|---|---|---|
| **A letter** | A Master's letter finished after the person left the app | Letters from the Masters | The server (push) or the phone (local) | `lib/letters.ts`, `apps/server/src/routes/ai.ts` |
| **Morning trial** | Daily at the chosen time, if reminders are on | Trial reminders | The phone | `lib/use-reminders.ts` |
| **Evening check-in** | Daily, if reminders are on | Trial reminders | The phone | `lib/use-reminders.ts` |
| **Streak warning** | Only on a day the streak would break | Trial reminders | The phone | `lib/use-reminders.ts` |
| **Questions back** | 08:00 the morning after a free account ran out | Questions and charges | The phone | `useRetentionNudges` |
| **Charge still open** | 18:00 on the day a charge was handed over, if still open | Questions and charges | The phone | `useRetentionNudges` |

That's the whole list, and it's meant to stay short (D-057). Each has one
fixed slot, so rescheduling replaces rather than stacks. Each is cancelled
when it stops being true. None is a "we miss you". A letter, a nudge or a
charge opens the chat when tapped. A trial reminder opens the app on the
Path.

A letter is never shown while the app is open: the chat is already writing
it out. Trial reminders are shown in the foreground, without sound.

## How a letter finds the person (D-055)

The server writes, checks and saves every letter before responding, and
nothing cancels that if the phone disconnects. So a letter is never lost
to someone leaving. The work is in telling them:

```
phone sends a question ──► server writes, checks, saves the letter
                                 │
                                 ├─ request already aborted? ─► push now
                                 │
                                 └─ wait up to 30 s for chat.replyReceived
                                        │
       phone got the letter ◄───────────┤ confirmed: nothing more
       (app open: shown in chat;        │
        app in background: the phone    └─ not confirmed: push
        posts its own notification,
        then confirms)
```

One notification either way. The phone confirms every letter it receives,
and the server pushes only the ones nobody confirmed. The wait lives in
memory (`packages/api/src/lib/deliveries.ts`); a server restart mid-wait
loses at most one notification, never the letter.

A push is the Master's name as the title and the letter's opening, cut at
a word near 90 characters with "…", as the body. It carries the thread id.
There's no reply action, by the owner's call.

## What push needs (owner setup)

A push reaches a closed Android app only through Firebase Cloud Messaging.
Until this is done, letters reach an app in the background (the phone's
own notification) but not a closed one, and the chat never claims "you can
leave":

1. Create a Firebase project and add an Android app with the package in
   `apps/native/app.json` (`com.anonymous.miyamoto` today. If the package
   changes before launch, do this again for the new one).
2. Download `google-services.json`. Either put it at
   `apps/native/google-services.json`, or make it an EAS environment
   variable of type **file** named `GOOGLE_SERVICES_JSON`.
   `app.config.js` picks up whichever exists.
3. In Firebase, create a service-account key for FCM V1 and upload it to
   EAS: `eas credentials` -> Android -> Push Notifications (FCM V1).
4. Build a new development build: the Firebase config is native.
5. Sign in, allow notifications, and check the server log. A registered
   install shows no `[letters] push registration unavailable` warning on
   the phone, and `push_token` has a row.

`EXPO_ACCESS_TOKEN` on the server is only needed if "enhanced push
security" is turned on in Expo's dashboard.

## When it goes wrong

| What you see | Cause | Fix |
|---|---|---|
| Phone log: `[letters] push registration unavailable … FirebaseApp is not initialized` | No `google-services.json` in the build | Steps 1–4 above |
| Letters arrive in the background but never when the app is closed | Same, or permission refused | Steps 1–4; check the app's notification permission in Android settings |
| Server log: `[push] Expo answered 401` | Enhanced push security on, no token | Set `EXPO_ACCESS_TOKEN` |
| Server log: `[push] could not read push tokens` | The database hasn't been migrated since push tokens were added | The container migrates on start (D-051); redeploy |
| Two notifications for one letter | The phone's confirmation took longer than 30 s | Rare by design; raise `DELIVERY_WAIT_MS` in `routes/ai.ts` if it isn't |

## Files

| Path | What |
|---|---|
| `apps/native/lib/notifications.ts` | Permission (asked once), the three channels, reminders, nudges, the foreground rule |
| `apps/native/lib/letters.ts` | Push registration, confirming letters, the background notification, opening the chat from a tap |
| `apps/native/lib/use-reminders.ts` | Reminders, streak warning and the two nudges, kept in step with the server |
| `apps/native/app.config.js` | Adds `googleServicesFile` when it exists |
| `packages/api/src/lib/push.ts` | Sending through Expo, dropping dead tokens, the letter preview |
| `packages/api/src/lib/deliveries.ts` | The 30-second wait for a confirmation |
| `apps/server/src/routes/ai.ts` | Where a saved letter starts that wait, or pushes at once |
