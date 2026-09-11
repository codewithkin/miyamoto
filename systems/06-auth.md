# Auth — Google sign-in, end to end

Google is the only sign-in method for now (D-039). Apple is commented out in
three places and switched back on by uncommenting them — see the bottom of
this file. There is no password path, and the server has the credential
endpoint turned off to match.

Onboarding runs **after** sign-in (D-038). A signed-out person can reach one
screen, `/welcome`, and its one button is sign-in (D-040).

---

## How the flow works

```
phone: /welcome -> Continue with Google
  lib/use-google-sign-in.ts: marks a sign-in pending (SecureStore, 10 min)
  authClient.signIn.social({ provider: "google",
                             callbackURL: "/", errorCallbackURL: "/welcome" })
    -> opens a browser sheet at  BETTER_AUTH_URL/api/auth/expo-authorization-proxy
    -> Google's account chooser (prompt=select_account)
    -> Google redirects the browser to  BETTER_AUTH_URL/api/auth/callback/google
    -> Better Auth creates the session, then redirects to
         miyamoto:///?cookie=<session>                 (production build)
         miyamoto://<metro-host>:8081/?cookie=<session> (dev build, Metro attached)
       or, on failure, to  miyamoto:///welcome?error=<code>
phone: the link is finished by whichever of these gets it first —
  - the Expo plugin, via the browser promise (iOS; a clean Android return)
  - app/+native-intent.tsx -> lib/auth-redirect.ts (cold start, the dev
    launcher, or Android's browser promise giving up first) — D-044
  both store the same cookie; the one that confirms the session first records it
phone: "/"  ->  the gate in app/(app)/_layout.tsx
  new account      -> /(onboarding)/problem
  returning account -> the tabs
```

Two things about that return trip are not obvious and were each a bug:

- **The browser promise is not a reliable carrier on Android.** Its
  polyfill resolves "dismiss" the moment the app is active again and drops
  its link listener, which can happen a beat before the link carrying the
  session arrives. And if Android kills the app while Chrome is in front,
  the link cold-starts it (a development build shows the dev launcher, then
  replays the link into the loaded app). Either way the promise's owner is
  gone. `app/+native-intent.tsx` sees every link, on a cold start and while
  running, so the session is stored regardless. It only does so if this
  install started a sign-in in the last ten minutes, so a link from anywhere
  else can't sign the phone into someone else's account.
- **An error must come back into the app too.** Better Auth's default for a
  failure it can't tie to a request is the API's `/`, a plain page inside
  the sign-in browser reading "OK", with no way out.
  `onAPIError.errorURL` sends it to `miyamoto:///welcome?error=<code>`
  instead, and welcome turns the code into a sentence.

A successful sign-in lasts 60 days, refreshed at most daily while the app is
in use.

### After sign-in: every request carries the session (D-047)

There's no cookie jar on native. The Expo plugin keeps the session in
SecureStore, and each request to the server has to carry it as a Cookie
header. `apps/native/lib/server-fetch.ts` is the only place that happens:

- `serverFetch`: tRPC's link and chat history.
- `streamingServerFetch`: the chat transport. It runs on `expo/fetch`,
  because React Native's own `fetch` has no readable body to stream from.

Never call `fetch(` directly, and never build a `DefaultChatTransport`
without `fetch: streamingServerFetch`. `pnpm check-types` fails on both.
The one time a request skipped this, the chat's first message came back
`POST /ai 401 1ms` while every other screen worked.

When the server refuses a session (a 401, or tRPC `UNAUTHORIZED`),
`sessionRefused()` asks Better Auth whether it's still live. Live, or
unreachable: nothing moves. Gone (expired, revoked, the account deleted
elsewhere): the app goes to welcome, which says "You were signed out. Sign
in to carry on." When the signed-in account changes, the query cache is
dropped, so one account never sees another's data.

The piece that breaks on real devices is the second redirect. **Google sends
the phone's browser to whatever `BETTER_AUTH_URL` says.** If that is
`localhost`, the phone goes to itself. If it is plain `http` on a LAN
address, Google will not even let you register it.

The server checks this at boot and prints, under `[auth]`, the exact redirect
URI to register and a warning if a phone could not complete the flow.

---

## Setup — from nothing to a working sign-in on a phone

### 1. Give the server an HTTPS address the phone can reach

Pick one:

| Option | Use when | Notes |
|---|---|---|
| Deploy the server | You want it to keep working | `docker compose` is already set up. Put it behind HTTPS. |
| ngrok with its free static domain | Developing against your laptop | One stable `https://<name>.ngrok-free.app`, so Google only needs registering once. `ngrok http --url=<name>.ngrok-free.app 3000` |
| Cloudflare quick tunnel | A one-off test | `npx cloudflared tunnel --url http://localhost:3000`. The URL changes every run, so Google must be updated every run. |

Call that address `https://SERVER` below.

**Production, deployed (session 7):**

```
API   https://miyamoto-server.onrender.com   (apps/server on Render — this is SERVER below)
Web   https://miyamoto.gamesforstrangers.lol (apps/web on Vercel — CORS_ORIGIN, step 2)
```

Session 6 recorded the API on Vercel at `aoi-miyamoto.gamesforstrangers.lol`.
The server has since moved to Render, which is where Google now redirects
(the boot log prints `[auth] Google redirect URI to register:
https://miyamoto-server.onrender.com/api/auth/callback/google`). If a custom
domain is later pointed at Render, `BETTER_AUTH_URL`, the app's
`EXPO_PUBLIC_SERVER_URL` and the Google redirect URI all move with it.

### 2. Point both sides at it

Local dev, `apps/server/.env`:

```
BETTER_AUTH_URL=https://SERVER
```

Local dev, `apps/native/.env`:

```
EXPO_PUBLIC_SERVER_URL=https://SERVER
```

**Production** — set on the **Render** service's own environment variables
(not `apps/server/.env`, which is local-only and gitignored; the host reads
its own dashboard-configured values):

```
BETTER_AUTH_URL=https://miyamoto-server.onrender.com
CORS_ORIGIN=https://miyamoto.gamesforstrangers.lol
GOOGLE_CLIENT_ID=<from step 3>
GOOGLE_CLIENT_SECRET=<from step 3>
```

An EAS production build of `apps/native` needs
`EXPO_PUBLIC_SERVER_URL=https://aoi-miyamoto.gamesforstrangers.lol` set for
that build profile (`eas.json` / `eas secret`), separately from local dev.

**They must be the same host as each other on each side.** The session
cookie is issued by `BETTER_AUTH_URL`; if the app then talks to a different
host, it signs in and immediately looks signed out.

`EXPO_PUBLIC_*` values are inlined when Metro bundles, so restart Metro with
`--clear` after changing it. A development build does not need rebuilding —
only the JavaScript changes.

### 3. Google Cloud Console

At <https://console.cloud.google.com>:

1. **Create a project** (or pick one). Name it anything — "Miyamoto".
2. **Google Auth Platform -> Branding.** App name `Miyamoto`, your support
   email, developer contact email. A logo is optional and triggers a review;
   skip it for now.
3. **Audience.** User type **External**. While the app is in **Testing**,
   only the Google accounts you add under **Test users** can sign in — add
   your own. Tokens for testing apps expire after seven days.
4. **Data access.** Leave the default scopes: `openid`, `email`, `profile`.
   These are non-sensitive, so publishing needs no Google verification.
5. **Clients -> Create client.**
   - Application type: **Web application.** Not Android, not iOS — the sign-in
     runs in a browser sheet and redirects to *your server*, which makes the
     server the OAuth client.
   - Name: `Miyamoto server` (cosmetic — shown only in this console, never
     to a user).
   - **Authorized JavaScript origins: leave this empty.** Nothing here ever
     calls Google directly from a browser page — sign-in only redirects
     through the server. If the console's "+ Add URI" row won't save blank,
     just don't add a row at all; the whole section can stay with zero
     entries. **Production:** none.
   - **Authorized redirect URIs:** `https://SERVER/api/auth/callback/google`
     — exactly what the server prints at boot after
     `[auth] Google redirect URI to register:`. No trailing slash.
     **Production:**
     `https://aoi-miyamoto.gamesforstrangers.lol/api/auth/callback/google`
6. Copy the **Client ID** and **Client secret** into the Vercel server
   project's env vars, step 2 above.

### 4. Give the server the credentials

`apps/server/.env`:

```
GOOGLE_CLIENT_ID=....apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
```

Restart the server. The boot log should show the redirect URI and **no
warning**. If it warns, stop there — the phone will not get through.

### 5. Try it on the phone

Welcome -> Continue with Google -> choose the test account ->
back in the app, on the first onboarding screen.

### 6. Before launch

**Audience -> Publish app.** Until then only test users can sign in. With the
default scopes, publishing is immediate.

---

## When it goes wrong

| What you see | Cause | Fix |
|---|---|---|
| "Google sign-in isn't switched on for this server yet." | `GOOGLE_CLIENT_ID` / `_SECRET` unset, or the server was not restarted | Set both, restart, check the boot log |
| Google page: `Error 400: redirect_uri_mismatch` | The registered URI differs from the one the server sends — http vs https, a port, a trailing slash | Copy the URI from the boot log into the console exactly |
| Browser sheet never loads, or loads a phone error page | `BETTER_AUTH_URL` is localhost or unreachable from the phone | Step 1 |
| Google page: `Error 403: access_denied` | Your account is not a test user while the app is in Testing | Add it under Audience -> Test users |
| Returns to the app but still signed out | `EXPO_PUBLIC_SERVER_URL` and `BETTER_AUTH_URL` are different hosts | Step 2 — make them identical |
| "Couldn't reach Miyamoto." | The app cannot reach `EXPO_PUBLIC_SERVER_URL` at all | Check the tunnel or deployment is up |
| After choosing an account: the dev launcher, then welcome, still signed out | The app was relaunched mid-sign-in and the session in the link was never stored (fixed, D-044) | If it recurs, check `app/+native-intent.tsx` is in the bundle and the pending marker was set — it only honours a sign-in started in the last ten minutes |
| Stuck inside the sign-in browser on a page reading "OK" | A failed callback redirected to the API's `/` (fixed: `onAPIError.errorURL`) | If it recurs, the server is running code from before `67bebf9` — redeploy |
| "That sign-in went stale before it finished." | A Google page from an earlier attempt was submitted again after its one-time state was used (`state_mismatch`) | Just try again — it starts a fresh state |
| Chat says "Sign in again to ask" right after signing in; Render logs `POST /ai 401 1ms` | A request built without `serverFetch`, so no cookie (fixed, `3bb051d`) | `pnpm check-types` in apps/native names the file; route it through `lib/server-fetch.ts` |
| Welcome: "You were signed out. Sign in to carry on." | The server refused the session and Better Auth confirmed it's gone: expired, signed out elsewhere, or the account deleted | Sign in again. If it happens straight after signing in, the cookie isn't reaching the server; check the row above |
| Render log: `Rate limiting could not determine a client IP` | Neither `true-client-ip` nor `cf-connecting-ip` reached the server, and `x-forwarded-for` has several hops, which Better Auth won't trust on its own | Set `advanced.ipAddress.trustedProxies` in `packages/auth/src/index.ts` to the host's proxy ranges |

---

## Turning Apple back on

1. `packages/env/src/server.ts` — uncomment the three `APPLE_*` variables.
2. `packages/auth/src/index.ts` — uncomment the Apple provider block.
3. `apps/native/lib/use-google-sign-in.ts` — add `"apple"` to the
   `Provider` type; then add a second button on
   `apps/native/app/(auth)/welcome.tsx` calling `signIn("apple")`.
4. Set `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET` and
   `APPLE_APP_BUNDLE_IDENTIFIER`. Apple requires a paid developer account and
   a Services ID configured with the same redirect pattern:
   `https://SERVER/api/auth/callback/apple`.

---

## Files

| Path | What |
|---|---|
| `packages/auth/src/index.ts` | Provider registration, `select_account`, the boot readiness report |
| `packages/env/src/server.ts` | The env schema |
| `apps/native/lib/auth-client.ts` | Better Auth client with the Expo plugin |
| `apps/native/lib/server-fetch.ts` | The one place a request gets the session; what a refused session does |
| `apps/native/scripts/check-server-fetch.mjs` | Fails `check-types` on a request that skips it |
| `apps/native/app/(auth)/welcome.tsx` | The screen: the only thing a signed-out person sees |
| `apps/native/lib/use-google-sign-in.ts` | Running the sign-in, and the error-to-sentence mapping |
| `apps/native/app/(app)/_layout.tsx` | The gate that decides where a new session goes |
