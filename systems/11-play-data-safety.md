# Play Console — Data safety answers

What to enter in **Play Console -> App content -> Data safety**, section by
section, and why each answer is true of the code as of session 5. The form
itself can only be filled in by the owner, in the console.

**Keep this and the privacy policy in step.** The policy is
`apps/web/src/app/privacy/page.tsx` (https://miyamoto.app/privacy). If a
feature starts collecting something new, update the code, this file and the
policy in the same change. Play compares the form with the app's behaviour
and with the policy, and rejects listings where they disagree.

---

## Overview

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes.** The API, TelemetryDeck, RevenueCat and AdMob are all HTTPS/TLS. |
| Do you provide a way for users to request that their data is deleted? | **Yes.** In the app (Settings -> Delete my account) and on the web at https://miyamoto.app/delete-account |

## Data types

"Shared" in Play's sense means sent to a third party that is **not** acting
on our behalf. Our service providers (hosting, the AI provider, email,
RevenueCat, TelemetryDeck) process data for us, which Play does not count as
sharing. Google AdMob uses ad data for its own purposes as well, so its
data **is** shared.

| Category -> type | Collected | Shared | Required or optional | Purposes | What it is |
|---|---|---|---|---|---|
| Personal info -> **Name** | Yes | No | Required | App functionality, Account management | From Google sign-in |
| Personal info -> **Email address** | Yes | No | Required | App functionality, Account management | From Google sign-in; used for account and deletion emails |
| Personal info -> **User IDs** | Yes | No | Required | App functionality, Account management | The account id, also used as the RevenueCat app user id |
| Messages -> **Other in-app messages** | Yes | No | Required | App functionality | Messages to the Masters and their replies. Sent to the AI provider to generate the reply, as a service provider. |
| App activity -> **Other user-generated content** | Yes | No | Required | App functionality | Onboarding answers, trials and charges accepted |
| App activity -> **App interactions** | Yes | **Yes** | Optional for the ad part; required for analytics | Analytics; Advertising or marketing; Fraud prevention, security, and compliance | TelemetryDeck: six anonymous events (see `systems/10-analytics.md`). AdMob: taps and views on a rewarded ad the user chose to watch. |
| Financial info -> **Purchase history** | Yes | No | Optional (only if they buy) | App functionality | Subscription state from Google Play via RevenueCat |
| Device or other IDs -> **Device or other IDs** | Yes | **Yes** | Optional for the ad part; required for analytics | Analytics; Advertising or marketing; Fraud prevention, security, and compliance | TelemetryDeck: a random per-install id, hashed on the phone. AdMob: the Android advertising ID and app set ID. |
| Location -> **Approximate location** | Yes | **Yes** | Optional (only when watching an ad) | Advertising or marketing; Fraud prevention, security, and compliance | AdMob collects the IP address, "which may be used to estimate the general location of a device" (Google's own disclosure). We never derive location ourselves. |
| App info and performance -> **Diagnostics** | Yes | **Yes** | Optional (only when watching an ad) | Analytics; Fraud prevention, security, and compliance | AdMob's performance data about the SDK. We run no crash reporter. |

Also:

- **Is data processed ephemerally?** Answer No for every type above. The
  TelemetryDeck and AdMob data is stored by those services, and our own
  data is stored until the account is deleted.
- **Can users choose whether this data is collected?** Mark the AdMob-only
  rows optional, since ads only load when the user taps "Watch an ad for
  +1". Everything else is required to use the app.

## Not collected — answer No

| Type | Why not |
|---|---|
| Photos and videos | The attach sheet opens the picker, but nothing is uploaded; the picked image is discarded. |
| Precise location | Never requested. |
| Contacts, Calendar, Health, Files and docs, Audio | Not accessed. |
| Web browsing | No. |
| Crash logs | There is no crash reporter in the app. |
| Search history | Story search runs on our server and is not stored per user. |

## Elsewhere in App content

| Declaration | Answer |
|---|---|
| **Ads** | **Yes, my app contains ads.** A rewarded ad (Google AdMob, non-personalised) is offered when the daily free questions run out. The store listing must not say "no ads". |
| **Privacy policy URL** | https://miyamoto.app/privacy |
| **Account deletion URL** | https://miyamoto.app/delete-account |
| **Target audience** | 13+, matching the privacy policy's "Children" clause |

## When this must be revisited

- The attach sheet starts uploading photos -> add Photos and videos.
- A crash reporter is added -> add Crash logs.
- AdMob moves to personalised ads -> this becomes an advertising-ID-based
  profiling disclosure, and the consent flow changes. Treat that as a new
  decision, not an edit.
- A new analytics signal carries anything a user typed -> it must not
  (D-041).
