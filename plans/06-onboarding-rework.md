# 06 — Onboarding rework, auth-first, restraint

**Status: built (session 4).** Not yet seen on a device, and Google sign-in
waits on the owner's OAuth client and an HTTPS server address (B6).

The owner's brief, condensed: the app is meant to be serious and
professional, and the motion across it is over the top. Onboarding lies on
its first screen ("Try it — no account"). Onboarding must happen *after*
sign-in. Google is the only provider for now. Selections need a real tick.
Masters need faces. Some screens do not make it clear what to look at.

**Keep, explicitly:** the forging-your-30-days animation ("perfect") and the
paywall animations. Everything else is toned down.

---

## A — Foundations

## A1 — Layout props land on the pressable

- [x] `ec4173c`
- **Commit:** `fix(native): let a Touchable take flex and width like any view`
- **Touches:** `apps/native/components/touchable.tsx`
- **Done when:** a `Touchable` styled `flex: 1` inside a row takes its share
  of the row. The 4/4 reminder chips render their labels.
- **Root cause:** `style` sat on an inner `Animated.View` while the outer
  `Pressable` sized to content, so `flex: 1` resolved against nothing and the
  chip collapsed to zero width.

## A2 — Motion restraint

- [x] `0ad6e81`
- **Commit:** `feat(native): calm the motion by more than half`
- **Touches:** `apps/native/theme/motion.ts`, `apps/native/components/motion.tsx`
- **Done when:** no preset travels horizontally; entry durations and travel
  are at most 40% of what they were; no bounce, spin, flip, roll or pinwheel
  outside the screens that opt in; the forging screen and both paywalls are
  unchanged.
- **How the exceptions survive:** the original presets move behind an
  `expressive` motion tone that those three screens opt into. Everything else
  gets `restrained` by default — so a new screen is calm unless it asks not
  to be.

## A3 — A real tick

- [x] `4252a00`
- **Commit:** `feat(native): mark a selection with a tick, not a slash`
- **Touches:** `apps/native/components/blade.tsx`
- **Done when:** every `BladeTick` renders a green circle with a checkmark
  when selected and an empty ring when not.
- **Overrides the blade-mark rule for selection** (new decision, see E1). The
  owner found the slash in a box unreadable as "selected".

## A4 — Icons instead of glyphs

- [x] `3b3a53c`
- **Commit:** `feat(native): replace text glyphs with real icons`
- **Touches:** `apps/native/components/icon.tsx` (new), every screen using
  `←`, `›`, `✕`, `+`, `↑` as text
- **Done when:** no navigation or action affordance in the app is a typed
  character.

---

## B — Auth-first

## B1 — One routing gate

- [x] `7676bc0`
- **Commit:** `feat(native): route every launch through one gate`
- **Touches:** `apps/native/app/index.tsx` (new), `(auth)/` (new group),
  `(onboarding)/_layout.tsx`, `(app)/_layout.tsx`, `app/_layout.tsx`
- **Done when:** signed out → welcome; signed in and not onboarded →
  onboarding; onboarded → the app. No screen can be reached out of order, and
  no redirect loops while the onboarding status loads.

**Note (session 4): B1 and B4 merged.** Planned as two todos, they are one
seam. The claim currently fires as soon as a draft has `reachedAuthAt`,
which the sign-in screen sets on mount. Moving onboarding after sign-in
without moving that trigger would claim an empty draft the instant a user
signs in, mark the account onboarded, and route them past the quiz for good.
Neither commit can land alone and leave the app working, so they land as
one: `feat(native): route every launch through one gate, and save onboarding
at its end`.

## B2 — Welcome: one button

- [x] `9fb464f`
- **Commit:** `feat(native): welcome with a single Get started`
- **Done when:** "Try it — no account" and "I already have one" are gone; one
  "Get started" goes to sign-in. That copy was untrue — nothing works without
  an account.

## B3 — Sign-in: Google only

- [x] `d3e20c2`
- **Commit:** `feat(native): sign in with Google alone`
- **Done when:** one Google button; Apple commented out, not deleted; "Why do
  I need an account?" removed; `callbackURL` is a real path (`/`), not a route
  group.

## B4 — Onboarding after sign-in

- [x] `7676bc0` (merged into B1 — see the note above)
- **Commit:** `feat(native): run onboarding after sign-in and save it at the end`
- **Touches:** `lib/onboarding-store.tsx`, `lib/claim-draft.tsx`, the
  onboarding screens that pointed at sign-in
- **Done when:** the draft is claimed when onboarding finishes, not when the
  user reached sign-in; the offer screen finishes onboarding instead of
  pushing to sign-in; no copy still assumes the user is anonymous.

## B5 — Server: Google, and a loud warning

- [x] `da77946`
- **Commit:** `feat(auth): Google alone, and warn when a phone cannot reach the callback`
- **Touches:** `packages/auth/src/index.ts`, `packages/env/src/server.ts`
- **Done when:** Apple is commented out; Google asks the user to pick an
  account; the server logs a warning at boot when `BETTER_AUTH_URL` is
  localhost or plain http, because Google will then redirect the phone
  somewhere it cannot reach.

## B6 — Google Cloud setup, written down

- [x] `a2757c9`
- **Commit:** `docs: the exact Google OAuth setup, end to end`
- **Touches:** `apps/server/.env.example`, `systems/06-auth.md` (new)
- **Done when:** someone with a Google account can go from nothing to a
  working sign-in on a phone by following it.
- **Cannot be ticked by an agent.** Credentials and an HTTPS server URL are
  the owner's to create. The tick above is for the document; the setup
  itself is still outstanding. As of session 4, `BETTER_AUTH_URL` is
  `http://localhost:3000` while the app points at `http://192.168.1.5:3000`,
  so sign-in cannot complete on a phone until step 1 of `systems/06-auth.md`
  is done.

---

## C — Master portraits

## C1 — Avatars and the component

- [x] `1f9904b`
- **Commit:** `feat(native): give each Master a face`
- **Touches:** `designs/crop-portraits.py` (new),
  `apps/native/assets/images/portraits/avatar-*.png` (generated),
  `apps/native/components/master-avatar.tsx` (new)
- **Done when:** each active Master has a square face crop and the component
  renders it round at any size, with an initial as fallback.
- **Watch:** Sun Tzu's source is 1:2 with the face in the top third; a
  centred crop shows his torso. Crops are computed per portrait, not centred.
- **Flag:** both Musashi images are *Vagabond* artwork (Takehiko Inoue).
  Used because the owner supplied them; same open risk as the app icon
  (`plans/05-launch-readiness.md` T01).

## C2 — Faces in onboarding

- [x] `69391b5`
- **Commit:** `feat(native): show the Master's face wherever onboarding names one`
- **Done when:** 3/4 shows Musashi's portrait large and the locked Masters
  small; the aha screen, forging, payoff and reminder previews show the face
  of whoever they name.

## C3 — Faces in the app

- [x] `81cccda`
- **Commit:** `feat(native): show the Master's face across the app`
- **Done when:** chat header, Masters list, switch sheet and story screen
  show portraits.

---

## D — Onboarding polish

## D1 — 4/4 layout

- [x] `7b8bcb8`
- **Commit:** `fix(native): give the pressure screen room to breathe`
- **Done when:** the reminder row sits clearly below the three options with
  real separation, every chip shows its time, and the chosen time is marked.

## D2 — A tick on every selection

- [x] `0df34a3`
- **Commit:** `feat(native): tick every choice the user makes in onboarding`
- **Done when:** wound chips, the problem list, pressure options, reminder
  times and plan cards all show a tick when chosen.

## D3 — Your dojo is ready

- [x] `678cc09`
- **Commit:** `feat(native): make the dojo screen say one thing loudly`
- **Done when:** the motion is calm, the Day 1 trial is the unmistakable
  focus, and the two stat cards read as achievements rather than footnotes.

## D4 — The offer, prominent

- [x] `dff5ab6`
- **Commit:** `feat(native): make the countdown and the discount impossible to miss`
- **Done when:** the countdown is a large block, not a caption; the 60% off
  is a badge, not a label; the animations are unchanged.

## D5 — Focus on the home screen

- [x] `11a7b48`
- **Commit:** `feat(native): make today's trial the only thing competing for attention`
- **Done when:** a first-time viewer's eye lands on the trial and its button
  before anything else.

---

**Note (session 4): three commits no todo named.** Each came from something
found while doing a planned todo. Each was small, had nothing to do with
the todo that found it, and was committed on its own:

- `58948da`: the evening reminder came from Seneca, who is locked until
  Day 7. Both reminders now come from the user's own Master. Found in C2.
- `ee6745f`: blade marks used as generic bullets (adversity rows, delete
  and export lists, the attach sheet) became icons. This finishes A4's
  intent for the cases A4's glyph sweep could not see.
- `f6804fa`: the aha screen still promised things from the anonymous era.
  It said a typed problem "takes an account", called a sample "1 of 3 free
  answers", and had two buttons with no handlers.

---

## E — Record it

## E1 — Decisions and handoff

- [x] this commit
- **Commit:** `docs: record session 4`
- **Done when:** D-004 superseded; new decisions for auth-first routing,
  motion restraint, ticks over blade marks for selection, and Google-only;
  START-HERE rewritten; changelog entry written.

---

## Not verifiable here

Everything in this plan changes how screens look and move. Nothing here runs
on a device, and the owner builds with EAS. Typecheck is the floor; the real
check is the owner walking onboarding on hardware.
