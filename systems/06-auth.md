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
  authClient.signIn.social({ provider: "google", callbackURL: "/" })
    -> opens a browser sheet at  BETTER_AUTH_URL/api/auth/sign-in/social
    -> Google's account chooser (prompt=select_account)
    -> Google redirects the browser to  BETTER_AUTH_URL/api/auth/callback/google
    -> Better Auth creates the session, then redirects to  miyamoto:///
    -> the Expo plugin catches the deep link, stores the session cookie
       in SecureStore, and closes the sheet
phone: router.replace("/")  ->  the gate in app/(app)/_layout.tsx
  new account      -> /(onboarding)/problem
  returning account -> the tabs
```

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

### 2. Point both sides at it

`apps/server/.env`:

```
BETTER_AUTH_URL=https://SERVER
```

`apps/native/.env`:

```
EXPO_PUBLIC_SERVER_URL=https://SERVER
```

**They must be the same host.** The session cookie is issued by
`BETTER_AUTH_URL`; if the app then talks to a different host, it signs in and
immediately looks signed out.

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
   - Name: `Miyamoto server`.
   - **Authorized redirect URIs:** `https://SERVER/api/auth/callback/google`
     — exactly what the server prints at boot after
     `[auth] Google redirect URI to register:`. No trailing slash.
   - Authorized JavaScript origins: leave empty.
6. Copy the **Client ID** and **Client secret**.

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
| `apps/native/app/(auth)/welcome.tsx` | The screen: the only thing a signed-out person sees |
| `apps/native/lib/use-google-sign-in.ts` | Running the sign-in, and the error-to-sentence mapping |
| `apps/native/app/(app)/_layout.tsx` | The gate that decides where a new session goes |
