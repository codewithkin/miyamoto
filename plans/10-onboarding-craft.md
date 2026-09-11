# 10 — Onboarding, held to welcome's bar

**Status: built (session 7).** Not yet seen on a device. Proof is still the owner's call.

The owner asked for welcome's craft on onboarding as well as the app shell.
Plan 08 covered the shell and deliberately left onboarding out, because
plans 06 and 07 had already given it a pass. This plan covers onboarding,
judged screen by screen against D-045 rather than redone wholesale.

**Out of scope, on purpose:** forging (the owner called its animation
perfect), the offer and paywall (D4, their motion kept at the owner's
request), and payoff (D3). The **proof** screen is also out: its user
count, rating and named testimonials have no data behind them, which is
legal exposure and so the owner's call. It is raised with a recommended
replacement rather than polished.

---

## A — A shared primitive

## A1 — One onboarding header

- [x] `b451e10`
- **Commit:** `feat(native): one header for the four quiz steps`
- **Touches:** `apps/native/components/onboarding-header.tsx` (new),
  problem, carrying, master, pressure
- **Done when:** the back button, "Step N of 4" and the blade rail are one
  component. The first step (problem) shows where it sits too; today it
  shows only "Skip".

## B — Screens

## B1 — Problem: show who answers

- [x] `1533481` (the screen also scrolls now; taller rows would have overflowed it)
- **Commit:** `feat(native): show whose answer each sample problem gets`
- **Done when:** each sample row carries the face and name of the Master
  who answers it, which is real information and a visual anchor. The
  own-words field has an icon, and the button carries the chosen Master's
  face.

## B2 — Answer: the charge looks like a charge

- [x] `5e57d42`
- **Commit:** `feat(native): make the sample charge match the real one`
- **Done when:** the charge card uses the same language as chat's
  `ChargeCard` (indigo edge, "Your charge", voice type), so the first
  charge anyone sees looks like every later one. The typed-problem branch
  opens on the face of the Master who will answer it, not on text alone.

## B3 — Carrying: the lean has a face

- [x] `6545307`
- **Commit:** `feat(native): put a face on the carrying nudge`
- **Done when:** when the picks lean towards a Master, the nudge is a row
  with that Master's face, not a caption. "Most people pick three" is
  replaced, because it is a claim about users the app doesn't have yet.

## B4 — Master: the art from welcome

- [x] `e14e6b6` (crop checked offline with Pillow at a real card width)
- **Commit:** `feat(native): open 3/4 on the same ink Musashi as welcome`
- **Done when:** the starter card leads with the ink hero art the person
  saw on welcome, when the starter is Musashi, since it's the only Master
  with that art. Otherwise it falls back to the avatar card. The lead loses
  its hardcoded pronoun.

## B5 — Pressure: intensity you can see

- [x] `d037501`
- **Commit:** `feat(native): show pressure as intensity, not three titles`
- **Done when:** each option carries a one-, two- or three-blade rail,
  the brand's own progress language, so the step up is visible at a
  glance. "Most people start at Firm" becomes a recommendation rather than
  an unbacked claim.

## C — Record it

## C1

- [x] this commit
- **Commit:** `docs: record the onboarding craft pass`

---

## Not verifiable here

Visual work. Typechecked and bundled; not seen on a device.
