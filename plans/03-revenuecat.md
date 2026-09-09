# 03 — RevenueCat

Groundwork is done and deliberately inert. `apps/native/lib/purchases.tsx`
configures per platform, binds `appUserID` to the Better-Auth user id
(D-021), reads the `miyamoto_meet_the_masters_pro` entitlement and presents
RevenueCatUI's paywall. The purchase button on `paywall.tsx` says plainly
that purchases are unavailable rather than faking a flow.

**Blocked on:** RevenueCat API keys and dashboard products. This plan is
unblocking, not building.

## T01 — Real API keys and products

- [ ] `pending-T01`
- **Commit:** `feat(native): switch RevenueCat to live keys`
- **Touches:** `apps/native/lib/purchases.tsx`
- **Done when:** the test keys are replaced, the monthly subscription and the
  lifetime non-consumable exist in the dashboard, and a sandbox purchase
  completes on a device.

## T02 — Entitlement webhook to the server

- [ ] `pending-T02`
- **Commit:** `feat(server): write entitlement from RevenueCat webhooks`
- **Depends on:** T01
- **Done when:** RevenueCat webhooks write the `Subscription` row, so the
  free counter reads Pro from our own database rather than from the client
  (D-018).
- On-device `getCustomerInfo` stays for instant gating; the server keeps its
  own copy because a gate the client can answer is not a gate.

## T03 — Verify the Pro gates end to end

- [ ] `pending-T03`
- **Commit:** `chore: verify Pro unlocks every gate`
- **Depends on:** T02
- **Done when:** a sandbox Pro account sees no counter in chat, all Masters
  selectable in the switch sheet, and the full library unlocked — checked on
  a device, not inferred from the code.
- Also verify the reverse: that an expired subscription loses access even if
  the clearing webhook never arrived. `usage.ts` already treats a lapsed
  `expiresAt` as not-Pro; this confirms it.
