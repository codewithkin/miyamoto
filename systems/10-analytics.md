# Analytics — TelemetryDeck

Product analytics run through TelemetryDeck (D-041). They answer four
questions, which are also the funnel:

```
Welcome.shown  ->  Auth.signInCompleted  ->  Onboarding.completed  ->  Chat.messageSent
 saw the app        got in                   said what's wrong          asked a Master
```

Dashboard: organisation *Manasseh Technologies*, app *Miyamoto - Meet the
Masters*, App ID `5D5EE985-6FCF-4D10-B283-AC4F7F7F5A08`.

---

## Rules

- **One entry point.** `track(type, payload)` in `apps/native/lib/telemetry.tsx`.
  It is fire-and-forget: it never throws, never blocks, and needs no
  awaiting. A lost signal is a lost data point, not a broken screen.
- **Signal types are a closed union** (`SignalType`). Adding one means
  adding it there and to the table below, in the same commit.
- **Nothing personal, ever.** No message text, no email, no name, no
  account id, no typed problem. Payloads are short enums, counts and
  slugs. If a new signal wants content, it does not get it.
- **Who is counted is the install, not the account.** A random id is made
  on first launch and kept in SecureStore, then salted and SHA-256 hashed
  by the SDK before it leaves the phone. One id per install keeps a
  person's path from welcome to their first message in one funnel,
  including across the moment they sign in. The cost is that one person on
  two phones counts twice. That is acceptable for these questions.
- **Development builds report in test mode.** `testMode: __DEV__`. Turn on
  the dashboard's *Test Mode* toggle to see them; the real numbers stay
  clean.

## Signals

| Type | Fired from | Payload |
|---|---|---|
| `Welcome.shown` | `app/(auth)/welcome.tsx`, once per visit | — |
| `Auth.signInStarted` | `lib/use-google-sign-in.ts`, on tap | `provider` |
| `Auth.signInCompleted` | once per sign-in, when a session the server recognises exists — from `lib/use-google-sign-in.ts` (`via: "browser"`, the Expo plugin stored it) or `lib/auth-redirect.ts` (`via: "link"`, the link back from Google did: a cold start, or Android's browser promise giving up first — D-044). Whichever confirms first clears the pending marker, so it never fires twice. Also from `components/email-sign-in.tsx` (`provider: "email"`, `via: "form"`) for seeded accounts such as Play's reviewer (D-052) | `provider`, `via` |
| `Auth.signInFailed` | the hook, on an error before the browser opened (no `via`) or when the browser closed with no session and no link (`cancelled-or-other`, `via: "browser"` — someone backing out of Google); `lib/auth-redirect.ts` on an `error=` link back from Google (`via: "link"`) | `provider`, `reason`: `provider-off` \| `network` \| `declined` \| `expired` \| `not-saved` \| `cancelled-or-other`; `via` |
| `Onboarding.completed` | `app/(onboarding)/problem.tsx` `begin()`, once the claim succeeds (D-048) | `outcome`: `picked` (a sample) \| `typed` \| `skipped`; `master` (slug). Until session 8 it fired from the offer screen with `purchased` \| `declined` \| `started-free` \| `skipped`, `plan`, `pressure` and `wounds`; that screen is gone |
| `Chat.messageSent` | `app/(app)/chat.tsx` `send()` | `master` (slug), `firstInThread` |

Every signal also carries TelemetryDeck's default parameters, so its
built-in device and version insights work: `TelemetryDeck.Device.platform`,
`TelemetryDeck.Device.operatingSystem`, `TelemetryDeck.Device.systemVersion`,
`TelemetryDeck.AppInfo.version`, `TelemetryDeck.RunContext.isDebug`. The
React SDK adds `tdReactVersion`.

`Auth.signInFailed` with `reason: provider-off` is the one to watch until
Google sign-in is set up. It means the server has no Google credentials
(`systems/06-auth.md`).

## Building the funnel in the dashboard

1. **Explore -> New insight -> Funnel.**
2. Steps, in order: `Welcome.shown`, `Auth.signInCompleted`,
   `Onboarding.completed`, `Chat.messageSent`.
3. Time range: last 30 days.

The drop between steps 1 and 2 is the welcome screen's job. The drop between
2 and 3 is onboarding's. Between 3 and 4 is the first chat.

Useful single insights:

- **How people start:** `Onboarding.completed`, broken down by `outcome`.
  Picked versus typed says whether the four samples are doing the work.
- **Sign-in health:** `Auth.signInFailed`, broken down by `reason`.
- **Who people talk to:** `Chat.messageSent`, broken down by `master`.

## How it is wired, and why

- **`@typedigital/telemetrydeck-react`** is the SDK the TelemetryDeck
  React Native guide names. Its provider is mounted in `app/_layout.tsx`.
  The app itself calls `track()`, which needs no component tree, so
  non-React code can count things too.
- **No `globalThis.crypto` patch.** The guide patches it with `expo-crypto`,
  which is a native module and so would need a new EAS development build.
  The SDK accepts a `subtleCrypto` option instead, so it gets a SHA-256 from
  `@noble/hashes`, which is pure JavaScript. Checked against Node's crypto:
  the same input gives the same hash.
- **`testMode` is always passed.** When it is undefined, the React SDK reads
  `window.location.hostname`. In React Native `window` exists but `location`
  does not, so that read throws.
- **The App ID has a code default.** It is public by design, since it
  ships in every binary. `apps/native/.env` is gitignored, so an EAS build
  would otherwise quietly report nothing. `EXPO_PUBLIC_TELEMETRYDECK_APP_ID`
  overrides it.
- **No namespace.** TelemetryDeck's namespaces are optional, and the JS SDK
  posts to the default ingest endpoint. The organisation namespace
  (`com.manassehtechnologies`) is not needed for sending.

## Disclosure

- **The privacy policy says it** (session 5): an "Anonymous analytics"
  entry, and TelemetryDeck named among the processors.
- **The Play Data safety answers** are in `systems/11-play-data-safety.md`:
  *App interactions* and *Device or other IDs*, for analytics. They still
  have to be entered in the console.
