# 09 — The Google sign-in round trip, end to end

**Status: built (session 7).** Not yet seen on a device.

The owner's report, against the Render server: choose an account, grant
consent, and land on the development build's *launcher* home screen instead
of in the app. Reconnecting shows welcome again, not signed in. A second
attempt ended inside the sign-in browser on the API's `/`, where Hono says
"OK", with no way back.

## What the code actually does

Traced through the installed sources, not guessed:

- **The session is only saved by the promise that started it.**
  `@better-auth/expo`'s client stores the session cookie in exactly one
  place: after `WebBrowser.openAuthSessionAsync` resolves `success`, it reads
  `cookie=` from the returned URL. Nothing else in the app ever reads that
  link.
- **On Android that promise can lose a race.** expo-web-browser's Android
  polyfill races "the app became active again" (resolves `dismiss`) against
  "a `url` event matching the callback arrived" (resolves `success`), and
  removes the url listener in `finally`. Coming back from Chrome fires both at
  almost the same moment; when `dismiss` wins, the cookie is dropped.
- **A cold start loses it every time.** If the app process died while
  Chrome was in front, the redirect cold-starts the app. In a development
  build that opens the dev launcher: the link is not a launcher URL, so it
  is kept as a pending intent and replayed once the app loads. But the
  promise that would have stored the cookie belonged to the old JavaScript
  context. The replayed link arrives, nobody reads `cookie=`, and the gate
  shows welcome. This is the owner's first report.
- **Errors strand the browser.** When the callback fails before Better
  Auth can recover the request's own error URL — `state_mismatch`, when a
  stale Google page is resubmitted after the first callback consumed the
  state — it redirects to `baseURL/error`, which redirects to `/`. That is
  a normal https page, so the auth session never ends. This is the "OK"
  report.
- **Dev builds redirect to `miyamoto://<metro-host>:8081/`.**
  `Linking.createURL` includes `Constants.expoConfig.hostUri` when Metro is
  attached. Better Auth trusts it (`miyamoto://` matches any authority), so
  it is not a bug in itself, but anything comparing links by prefix has to
  expect it.

## A — Client

## A1 — Finish sign-in from the link itself

- [x] `a02f8f4`
- **Commit:** `fix(native): finish Google sign-in from the returning link, whatever relaunched the app`
- **Touches:** `apps/native/lib/auth-redirect.ts` (new),
  `apps/native/app/+native-intent.tsx` (new), `apps/native/lib/auth-client.ts`
- **Done when:** any incoming deep link carrying `cookie=` is persisted to
  the same storage key and format the Better Auth Expo plugin uses (its own
  exported `getSetCookie` and `storageAdapter`), and the session is
  confirmed with the server before routing to `/`. This works on a cold
  start (`initial: true`) and a warm return alike, so it no longer depends
  on the browser promise winning a race. The session cookie never reaches
  the router's params. A link carrying `error=` routes to welcome with the
  code.
- **Guarded:** a link is only honoured if this install started a sign-in
  in the last ten minutes (a marker in SecureStore, set when sign-in
  starts and cleared when it ends). Otherwise any link could sign this
  phone into someone else's account.

## A2 — The hook settles honestly

- [x] `b0f1bd1`
- **Commit:** `fix(native): only call sign-in done when a session exists`
- **Touches:** `apps/native/lib/use-google-sign-in.ts`,
  `apps/native/app/(auth)/welcome.tsx`, `apps/native/lib/telemetry.tsx`,
  `systems/10-analytics.md`
- **Done when:** the hook marks the attempt pending and passes an
  `errorCallbackURL`, so errors Better Auth can attribute come back into
  the app. After the browser closes it checks for a real session instead of
  navigating unconditionally. If the session isn't there yet, it waits
  briefly for the Android link to land. Only then does it treat the attempt
  as a cancellation: no error shown, marker cleared. Welcome turns an
  `authError` code into a sentence. `Auth.signInCompleted` fires once, when a
  session is confirmed, however it arrived.

## B — Server

## B1 — Errors return to the app; real IPs; sessions that last

- [x] `67bebf9`
- **Commit:** `fix(auth): send sign-in errors back into the app, and keep sessions`
- **Touches:** `packages/auth/src/index.ts`
- **Done when:** `onAPIError.errorURL` is the app's own welcome deep link, so
  no failure can leave the browser on the API's `/`. Rate limiting reads the
  client IP from the edge headers before `x-forwarded-for`, and Render's
  "could not determine a client IP" warning is gone after deploy. Sessions
  last 60 days and are refreshed daily on use, so a user who signed in once
  isn't asked again within a normal gap.

## C — Record it

## C1

- [x] this commit
- **Commit:** `docs: record the sign-in round trip`
- **Done when:** `systems/06-auth.md` describes the flow as it now works and
  names the Render URL. The decisions are logged, the plan is ticked, and
  START-HERE is updated.

---

## Not verifiable here

No device from here. Every step is typechecked and bundled; the proof is
the owner signing in on a development build and landing inside the app,
signed in, and staying signed in after a restart.
