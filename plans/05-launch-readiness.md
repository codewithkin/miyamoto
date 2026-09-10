# 05 — Launch readiness

Everything between "it works" and "it is in the store".

## Credentials still needed

| Variable | Blocks |
|---|---|
| `OPENROUTER_API_KEY` | Every Master reply |
| `GOOGLE_CLIENT_ID` / `_SECRET` | Google sign-in |
| `APPLE_CLIENT_ID` / `_SECRET` | Apple sign-in |
| `SMTP_HOST` / `_USER` / `_PASS` | The deletion confirmation email |
| RevenueCat API keys | All purchases |
| `REVENUECAT_WEBHOOK_AUTH` | The server's own copy of entitlement. The webhook answers 503 without it; set the same value as the Authorization header of the dashboard webhook pointed at `/webhooks/revenuecat` |

Everything degrades honestly without them — providers register only when
their pair is present, mail logs under `[mail]`, purchases say they are
unavailable. Nothing pretends.

## T01 — The app icon

- [ ] `pending-T01`
- **Commit:** `feat(native): replace the app icon with an original blade mark`
- **Done when:** the icon is original work, and the Android adaptive
  foreground is centred inside the safe zone.
- **Why this is not cosmetic:** the current `icon.png` and
  `adaptive-icon.png` are a *Vagabond* panel by Takehiko Inoue. On a paid app
  that is a live takedown and rejection risk. It will also crop badly —
  Android masks the foreground and only guarantees the inner ~66%, while the
  head sits at the top edge and the hands at bottom-left.
- **The fix is already in the design language.** The icon should be a blade
  mark: original, legible at 48px where a dense ink panel is mush, and it
  ties the home screen to the in-app status system.
- **This is the owner's call to commission.** Do not ship a substitute
  without asking.

## T02 — Data safety declarations

- [ ] `pending-T02`
- **Done when:** Play's Data Safety form and the ads declaration are filled
  in, and match what the app actually does.
- **Watch:** the store listing copy does not mention ads and the app ships a
  rewarded ad. That mismatch gets listings rejected.

## T03 — Domain live

- [ ] `pending-T03`
- **Done when:** `/privacy`, `/support` and `/delete-account` resolve on the
  real domain. Both stores check them, and Play requires the deletion route.

## T04 — Device pass

- [ ] `pending-T04`
- **Done when:** onboarding through Day 1 has been walked on a real device —
  fonts rendering, animations timed, haptics firing, chat streaming.
- **Nothing in this app has ever run on a device.** Everything to date is
  typechecked, built and reasoned about. That is not the same as run, and
  this todo exists so nobody assumes otherwise.
- The owner's machine cannot run an emulator, so this needs the EAS
  development build on hardware.

## T05 — Voice pass before content scales

- [ ] `pending-T05`
- **Depends on:** 01 T12
- **Done when:** the owner has read four Masters answering the same ten
  problems and is satisfied they do not sound like one another.
- **Do this before authoring more corpus.** The corpus is tuned to the voice;
  discovering the voice is wrong afterwards means rewriting both.
