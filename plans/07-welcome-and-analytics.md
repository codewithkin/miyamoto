# 07 — Welcome is sign-in, and analytics

**Status: built (session 5).** Not yet seen on a device.

The owner's brief, condensed. With Google as the only sign-in method, a
separate sign-in screen is one more tap in front of the only thing a new
person can do. So welcome and sign-in become one screen, and the sign-in
route is deleted. That screen gets a real design, modelled on the reference
recipe app: a full-bleed image, a big title and one unmistakable button. The
current screen is "bland and very bare".

Then analytics through TelemetryDeck, counting four things: people who see
welcome, people who sign in, people who finish onboarding, and people who
send a Master a message.

---

## A — Welcome is sign-in

## A1 — The hero image

- [x] `f8ea32a`
- **Commit:** `feat(native): an ink hero for the welcome screen`
- **Touches:** `designs/make-hero.py` (new), `apps/native/assets/images/hero-musashi.jpg` (generated)
- **Done when:** a script turns the 1024px icon drawing into a dark hero.
  It inverts the drawing to light lines on ink, tints it to the palette and
  fades it into `ink.base` at the bottom, so the screen needs no gradient
  library.
- **Why this source:** it is the only image in the repo large enough to fill
  a phone's width. The portraits are 120–447px.
- **Flag:** it is *Vagabond* artwork, the same open risk as the app icon
  (`05` T01). Using it here adds no new exposure, since it is already the
  icon. Replacing the icon means replacing this too, and the script makes
  that one command.

## A2 — One screen

- [x] `c701e46` (and `cc677c6`, two comments that still named the deleted screen)
- **Commit:** `feat(native): sign in from the welcome screen`
- **Touches:** `app/(auth)/welcome.tsx`, `app/(auth)/sign-in.tsx` (deleted),
  `systems/06-auth.md`
- **Done when:** "Continue with Google" on welcome runs the sign-in, with the
  same error sentences and busy state that `sign-in.tsx` had. `/sign-in` no
  longer exists, nothing links to it, and the Apple re-enable notes move
  with the button.

## A3 — The design

- [x] `40c0399`
- **Commit:** `feat(native): give welcome a real design`
- **Touches:** `app/(auth)/welcome.tsx`, `lib/links.ts` (new),
  `app/settings.tsx`
- **Done when:** the hero fills the top half edge to edge, under the status
  bar. The four Masters' faces sit on it. Below it are a large title, one
  line of promise, and a white "Continue with Google" pill with Google's
  four-colour G, which is the only button on the screen. The legal line
  under it links to the real terms and privacy pages. The privacy and terms
  URLs live in one place, which settings uses too.

---

## B — Analytics (TelemetryDeck)

## B1 — The client, no events yet

- [x] `fefe31a`
- **Commit:** `feat(native): wire TelemetryDeck`
- **Touches:** `apps/native/package.json`, `lib/telemetry.tsx` (new),
  `app/_layout.tsx`, `packages/env/src/native.ts`
- **Done when:** the provider wraps the app, and a `useTrack()` hook sends a
  signal and never throws or blocks the UI. Development builds send in
  test mode.
- **Polyfill without a rebuild.** The SDK hashes the user id with
  `crypto.subtle.digest`, which React Native lacks. The guide suggests
  `expo-crypto`, but that is a native module and would force a new EAS
  development build. `@noble/hashes` is pure JavaScript, already in the
  tree through Better Auth, and does SHA-256 just as well. Hermes has
  `TextEncoder` natively.
- **Note (session 5):** the SDK turned out to take a `subtleCrypto`
  option. So there is no global patch at all: the noble digest is passed
  in directly. And the planned `useTrack()` hook became a plain `track()`
  function, which does the same job and also works outside components.
- **Who is counted:** a random id made on first launch and kept in
  SecureStore. Never the account id or the email. One id per install
  means one person's path from welcome to their first message is a single
  funnel, before and after they sign in.

## B2 — Welcome and sign-in

- [x] `8429270`
- **Commit:** `feat(native): count who sees welcome and who signs in`
- **Signals:** `Welcome.shown`, `Auth.signInStarted`,
  `Auth.signInCompleted`, and `Auth.signInFailed` with a reason category,
  never the raw message.

## B3 — Onboarding completed

- [x] `404f5e8`
- **Commit:** `feat(native): count who finishes onboarding`
- **Signal:** `Onboarding.completed` with how it ended (offer claimed or
  skipped), the pressure, and how many wounds were picked. Fired once, from
  the offer screen's `finish()`.

## B4 — Messages to a Master

- [x] `2dc9ec4`
- **Commit:** `feat(native): count messages sent to a Master`
- **Signal:** `Chat.messageSent` with the Master's slug. Never the text.

## B5 — Record it

- [x] this commit
- **Commit:** `docs: record session 5`
- **Done when:** `systems/10-analytics.md` lists every signal, what it
  carries, and how to build the four-step funnel in the dashboard. The
  decisions are logged, plan 07 is ticked, and START-HERE and the changelog
  are updated.

---

## Not verifiable here

Nothing runs on a device from here, and sign-in cannot complete until the
owner's Google client exists (`systems/06-auth.md`). Signals from a
development build land in TelemetryDeck's **test mode**, so they are only
visible with the dashboard's test-mode toggle on.
