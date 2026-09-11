# 15 — The paywall buys what it shows

**Status: in flight (session 8).** Interleaved with plan 13 (C5 onward
waits on this).

The owner's report (session 8): pressing buy on the app's own paywall
opened a second paywall, RevenueCat's. The cause is `lib/purchases.tsx`:
`buy()` called `RevenueCatUI.presentPaywall()`, the dashboard-designed
paywall, so every "buy" button in the app, the coded paywall included,
put RevenueCat's paywall on top. The coded paywall also showed hardcoded
prices ($149, $9.99, "3 days free") that the store may not charge.

Following RevenueCat's "Displaying Products" guide: the paywall fetches
the current Offering, shows its packages with the store's own localized
prices and trial terms, and buys the one chosen with `purchasePackage`.
No hardcoded prices, no hardcoded trial text, no second paywall.

The SDK key is already in `lib/purchases.tsx` (RevenueCat's test key, as
the owner sent it). Nothing to add.

## P — Purchases

**Note (session 8):** the order is P3, then P1 and P2 as one commit.
`buy()` changing to take a package breaks its callers. With P3 done first
the paywall is the only one left, and P1 without P2 wouldn't compile, so
they're one todo: the paywall buys the chosen package.

## P1 — Buy a package, not a paywall

- [ ] `pending-P1`
- **Commit:** `feat(native): buy the chosen package directly, and read plans from the offering`
- **Touches:** `lib/purchases.tsx`
- **Done when:** `usePlans()` reads the current Offering (monthly and
  lifetime, by package type) with localized price, period and any free
  trial from the store product. `buy(pkg)` purchases that package and
  reports purchased, cancelled or failed, a cancel being no error.
  `RevenueCatUI.presentPaywall` is gone from the app.

## P2 — The paywall shows the store's plans

- [ ] `pending-P2`
- **Commit:** `feat(native): draw the paywall from the store's plans and buy the one chosen`
- **Touches:** `app/paywall.tsx`
- **Done when:** plan cards show the store's prices, and "Best value" goes
  on lifetime only when the offering has it. The button says what it
  does ("Start 3-day free trial", "Subscribe · $9.99/month", "Get lifetime ·
  $149"), from the product rather than copy. Plans that can't load say so
  and retry. After a purchase, Pro is re-read from the server a few times,
  because the server learns of it by webhook, seconds later.

## P3 — Every "Go Pro" leads to it

- [ ] `pending-P3`
- **Commit:** `refactor(native): send every Pro button to the paywall`
- **Touches:** `components/more-questions.tsx`, `components/overlays.tsx`
- **Done when:** "Go Pro" in the questions pair and the switch sheet opens
  the paywall screen. Nothing else in the app starts a purchase.

## P4 — Docs

- [ ] `pending-P4`
- **Commit:** `docs: record the paywall buying directly`
- **Touches:** `systems/09-decisions.md`, `plans/03-revenuecat.md` (a note),
  `progress/00-START-HERE.md`
