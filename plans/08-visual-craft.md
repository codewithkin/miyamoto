# 08 — Extend welcome's craft across the app

**Status: built (session 7).** Not yet seen on a device. The rules are D-045.

The owner's brief: welcome (`(auth)/welcome.tsx`, plan 07) reads as "a full
course meal" — layered imagery, real typographic hierarchy, color used with
intent, one clear action — and the rest of the app should read the same
way. Most of it is functionally correct and already carries the session 4–5
polish (ticks, portraits, restraint, focus work on payoff/offer/home), but
several screens are still, visually, a stack of `ink.surface` rows with a
1px border and a plain headline. This plan names which ones and what
"welcome's treatment" concretely means when there is no full-bleed hero
image to reach for.

**What actually made welcome work**, named so it can be applied on purpose
rather than re-invented per screen:

1. A visual anchor above the fold — not necessarily a photo; a portrait, an
   icon-and-number, or a colour field can do the same job of telling the
   eye where to land before it reads anything.
2. Exactly one filled, high-contrast action per screen. Everything else is
   a secondary/ghost/outline.
3. Typographic hierarchy that never flattens to two sizes: an eyebrow
   label, a hero or display headline, a lead paragraph, then body/caption.
4. Colour tied to meaning, not decoration — indigo for structure and
   progress, gold for premium/earned, green for confirmed, red only for
   alerts. A screen that's all one colour of card reads as unfinished.
5. Real information in place of a placeholder pattern — a face instead of
   an initial, a number instead of a bullet.

**Not in scope:** anything plan 06/07 already gave a deliberate pass —
onboarding's 12 screens, `(app)/index.tsx` (D5), the offer and paywall
(D4), payoff (D3). Touching those again without a specific complaint would
be motion for its own sake.

---

## A — A shared primitive

## A1 — A `ScreenHero` header

- [x] `aa7e1ff`
- **Commit:** `feat(native): a shared hero header for screens without a photo`
- **Touches:** `apps/native/components/screen-hero.tsx` (new)
- **Done when:** one component renders an eyebrow, a display/hero title,
  and an optional lead line and trailing visual (an avatar, an icon badge,
  or a stat), used by every screen this plan touches — so the next screen
  reaches for one component instead of re-deriving the pattern.

---

## B — Screens

## B1 — You (profile)

- [x] `d029831`
- **Commit:** `feat(native): give the profile screen a real focus`
- **Done when:** the user's chosen Master's face anchors the header (who is
  walking this with them), the three stats read as achievements (icons,
  accent colour) rather than three identical grey boxes, and the Bushido
  Code — the screen's emotional centre — has more presence than the row
  list below it.

## B2 — Adversity (the library)

- [x] `5b327b2`
- **Commit:** `feat(native): give the adversity library a real opening`
- **Done when:** the headline section explains what the library is in one
  line (it currently doesn't say anything), "Most searched" reads as a
  featured shelf rather than three more identical rows, and the search
  field itself is more inviting than a bare pill.

## B3 — Masters roster, second pass

- [x] `0d2b208`
- **Commit:** `feat(native): make the masters roster read as a roster`
- **Done when:** the header states the shape of the ladder (earned vs.
  waiting vs. Pro) instead of only a count, and the visual difference
  between an earned, day-locked and Pro-locked row is legible at a glance,
  not only by reading the trailing label.

## B4 — Settings

- [x] reviewed, no change. A back button beside a nav-bar title, then
  grouped rows, is the platform's own settings pattern; a hero opening
  there would be decoration.
- **Done when reviewed:** a plain grouped list is the *correct* pattern for
  a settings screen (this is true of every OS's own settings app) — confirm
  it needs no change, or note the one thing that does.

## B5 — Chat, composer and empty state

- [x] `d32466a` (also fixed "He won't comfort you", which was wrong for Curie)
- **Commit:** `feat(native): a real chat empty state`
- **Done when:** opening a fresh thread shows the Master's face and a
  proper opening rather than one line of body text with nothing above it.

---

## Not verifiable here

Visual work. Typechecked and bundled; not seen on a device. The owner's
read on whether each screen actually lands is the real check.
