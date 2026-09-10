# 02 — Notifications

**Status: built (session 3). Not run on a device, which is the only place
a notification can be seen to fire.**

`expo-notifications` is installed and its config plugin registered, but
nothing schedules anything. Onboarding screen 10 shows the user two preview
notifications, records their choice and their preferred time, and neither is
ever acted on.

**Depends on:** 01 T04–T08 — a trial has to exist before anyone can be
reminded of one.

## T01 — Raise the real permission prompt

- [x] `55bad9d`
- **Commit:** `feat(native): raise the OS notification prompt after priming`
- **Touches:** `apps/native/app/(onboarding)/reminders.tsx`
- **Done when:** tapping "Wake me at 06:00" raises the OS prompt, and a
  denial is recorded rather than re-asked on every launch.
- The screen is already built to prime it — it shows what will be sent
  before asking, which is the whole reason it exists.

## T02 — Schedule the two daily reminders

- [x] `5bafce9`
- **Commit:** `feat(native): schedule the morning and evening reminders`
- **Depends on:** T01
- **Done when:** two local notifications fire at the user's chosen times in
  their own timezone (D-017), and rescheduling replaces the existing pair
  rather than stacking a second one.

## T03 — The reminder is in the Master's voice

- [x] `d38ce2f`
- **Commit:** `feat(native): put the day's trial in the notification`
- **Depends on:** T02
- **Done when:** the morning notification carries the day's actual trial text
  and the evening one asks whether it was done — matching the previews
  screen 10 promises.
- A generic "Don't forget to complete your trial!" is a D-001 violation and
  breaks the promise the priming screen made.

## T04 — Streak reminders only on the day one would break

- [x] `b771bb2`
- **Commit:** `feat(native): warn only on the day the streak would break`
- **Depends on:** T02
- **Done when:** behaviour matches the promise printed on screen 10 —
  "Streak reminders only on the day you'd break it. No marketing, no we miss
  you." That copy is shipped; this makes it true.
