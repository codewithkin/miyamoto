# 11 — "Your first week" replaces the proof screen

**Status: in flight (session 7).**

The owner's decision (session 7): the proof screen after "Your dojo is
ready" was built from figures with nothing behind them — "10,431 people are
on a trial right now", "4.8 from 2,140 ratings", two named testimonials.
It is replaced by **Days 1–7 at the pressure the person just chose**, from
the seeded Path. It is true today, it is the real content, and it shows what
they are committing to right before the reminder and offer screens.

Building it exposed a second untruth. Payoff's "Day 1 · written for you" card
hardcodes the **Firm** Day 1 trial for everyone, and the reminder preview
paraphrases it. A Gentle or Unbreakable user was shown a trial they will not
get, and the new week screen would contradict it one screen later.

## A — Server

## A1 — `path.preview`

- [ ] `pending-A1`
- **Commit:** `feat(api): preview the first days of the Path at a pressure`
- **Touches:** `packages/api/src/routers/path.ts`
- **Done when:** a signed-in caller can ask for Days 1–N (default 7, at most
  30) at a given pressure and gets each day's number, act, title, brief and
  the trial at that pressure. It takes the pressure as input, because during
  onboarding the draft has not been claimed and the server doesn't know it
  yet.

## B — Client

## B1 — The screen

- [ ] `pending-B1`
- **Commit:** `feat(native): replace the proof screen with the person's first week`
- **Touches:** `app/(onboarding)/proof.tsx` → `app/(onboarding)/first-week.tsx`,
  `app/(onboarding)/payoff.tsx` (its button), `lib/use-first-week.ts` (new)
- **Done when:** the screen lists Days 1–7 at the chosen pressure, with Day 1
  as the focus. If the week can't load, it says so and still lets the person
  continue: onboarding never traps anyone. The route is renamed, since it is
  no longer proof, and payoff's button says where it goes.

## B2 — One Day 1 everywhere

- [ ] `pending-B2`
- **Commit:** `fix(native): show the Day 1 trial they'll actually get`
- **Touches:** `app/(onboarding)/payoff.tsx`, `app/(onboarding)/reminders.tsx`
- **Done when:** payoff's Day 1 card and the morning reminder preview both
  show the real Day 1 trial at the chosen pressure, from the same query. The
  hardcoded Firm text stays only as the fallback when the query can't load.

## B3 — The Path's real length

**Note (session 7):** added mid-plan. Wiring B2 surfaced a third untrue
number on the same two screens. Payoff says "16 trials waiting" at Firm
(10 at Gentle, 30 at Unbreakable), and forging's step says "Chose 16 trials
at Firm pressure". The seeded Path has 30 trials at every pressure, one per
day (checked against the database): pressure changes how hard each day is,
not how many days there are.

- [ ] `pending-B3`
- **Commit:** `fix(native): count the Path's real thirty days`
- **Touches:** `app/(onboarding)/payoff.tsx`, `app/(onboarding)/forging.tsx` (copy only)
- **Done when:** both say 30. Forging's two theatrical claims ("Matched 3
  wounds to Act I", "…is picking the first trial from what you told us")
  become true lines. **Its animation is untouched**: the owner called it
  perfect, and this changes words only.

## C — Record it

## C1

- [ ] `pending-C1`
- **Commit:** `docs: record the first-week screen and the rule behind it`
- **Done when:** a decision records that onboarding shows only true things,
  with previews drawn from real content. START-HERE's open item on figures
  is narrowed to what is left: payoff's 2.4× and the offer/paywall quotes.

---

## Not verifiable here

Typechecked; the query is checked against the seeded local database. Not
seen on a device.
