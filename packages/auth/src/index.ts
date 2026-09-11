import { expo } from "@better-auth/expo";
import { createPrismaClient } from "@miyamoto/db";
import { env } from "@miyamoto/env/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

/**
 * Only register a provider when its credentials are actually present.
 *
 * Without this the server refuses to boot on a machine that has no OAuth
 * secrets, which would make the whole app undevelopable for anyone who has
 * not yet been given them.
 */
function socialProviders() {
  const providers: NonNullable<Parameters<typeof betterAuth>[0]["socialProviders"]> = {};

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      // Show Google's account chooser every time rather than silently reusing
      // whichever account the phone's browser last used. On a shared or
      // work phone that silent reuse signs people into the wrong account.
      prompt: "select_account",
    };
  }

  // Apple sign-in — off for now (D-039). Kept rather than deleted so turning
  // it back on is uncommenting this block, the env vars in
  // packages/env/src/server.ts and lib/use-google-sign-in.ts in apps/native.
  //
  // if (env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET) {
  //   providers.apple = {
  //     clientId: env.APPLE_CLIENT_ID,
  //     clientSecret: env.APPLE_CLIENT_SECRET,
  //     ...(env.APPLE_APP_BUNDLE_IDENTIFIER
  //       ? { appBundleIdentifier: env.APPLE_APP_BUNDLE_IDENTIFIER }
  //       : {}),
  //   };
  // }

  return providers;
}

/** Which sign-in buttons the client should render. */
export function availableProviders() {
  return Object.keys(socialProviders()) as "google"[];
}

/**
 * Says, once at boot, whether Google sign-in can actually complete on a phone.
 *
 * The OAuth round trip ends with Google redirecting the phone's browser to
 * BETTER_AUTH_URL/api/auth/callback/google. Two configurations look fine on a
 * laptop and fail on a device:
 *
 *   - BETTER_AUTH_URL is localhost. On a phone, localhost is the phone.
 *   - BETTER_AUTH_URL is plain http on a LAN address. Google refuses to
 *     register a non-HTTPS redirect URI for anything but localhost.
 *
 * Neither produces a useful error on the phone — the browser sheet just
 * fails to load — so the server says it here, and prints the exact redirect
 * URI to paste into Google Cloud Console. See systems/06-auth.md.
 */
function reportGoogleReadiness() {
  const googleOn = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  if (!googleOn) {
    console.warn(
      "[auth] Google sign-in is OFF: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not both set. " +
        "The app's only sign-in button will report that it isn't switched on.",
    );
    return;
  }

  let url: URL;
  try {
    url = new URL(env.BETTER_AUTH_URL);
  } catch {
    console.warn(`[auth] BETTER_AUTH_URL is not a valid URL: ${env.BETTER_AUTH_URL}`);
    return;
  }

  const callback = `${url.origin}/api/auth/callback/google`;
  console.info(`[auth] Google redirect URI to register: ${callback}`);

  const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname);
  if (local) {
    console.warn(
      "[auth] BETTER_AUTH_URL is localhost. Google will send the phone to " +
        `${callback}, and on a phone localhost is the phone — sign-in will fail on a device. ` +
        "Use an HTTPS URL the phone can reach (a deployed server or a tunnel).",
    );
  } else if (url.protocol !== "https:") {
    console.warn(
      "[auth] BETTER_AUTH_URL is plain http. Google only accepts non-HTTPS redirect URIs for " +
        "localhost, so it will refuse to register this one. Use an HTTPS URL.",
    );
  }
}

/**
 * The native app's URL scheme (apps/native/app.json). Better Auth redirects
 * back into the app on it, and the app finishes sign-in from that link
 * (apps/native/lib/auth-redirect.ts, D-044).
 */
const APP_SCHEME = "miyamoto";

const DAY_SECONDS = 60 * 60 * 24;

export function createAuth() {
  const prisma = createPrismaClient();
  reportGoogleReadiness();

  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),

    trustedOrigins: [
      env.CORS_ORIGIN,

      // Any miyamoto:// link — including a development build's
      // miyamoto://<metro-host>:8081/, which Linking.createURL produces when
      // Metro is attached. Better Auth matches a bare scheme to any authority.
      `${APP_SCHEME}://`,
      "exp://",
      "http://localhost:8081",
    ],

    // Where a sign-in goes when it fails before Better Auth can recover the
    // request's own error URL — a stale Google page resubmitted after the
    // first callback used up its state is the common one (state_mismatch).
    // The default is the API's own /error, which redirects to "/": a plain
    // page inside the sign-in browser, reading "OK", with no way back into
    // the app. This sends it back into the app instead, where welcome turns
    // the `error=` code into a sentence.
    onAPIError: {
      errorURL: `${APP_SCHEME}:///welcome`,
    },

    // A phone that signed in once should stay signed in. Better Auth's
    // default is seven days; for an app used daily that means a sign-in
    // prompt after any week away. Sixty days, refreshed at most once a day
    // while the app is in use.
    session: {
      expiresIn: 60 * DAY_SECONDS,
      updateAge: DAY_SECONDS,
    },

    // Email and password, for accounts the server seeds, and nobody else
    // (plan 14). Google Play's review needs a username and password that
    // opens the whole app, and its reviewers can't sign in with Google
    // accounts of their own, so the Play reviewer account
    // (apps/server/src/reviewer.ts) signs in this way. Sign-up stays off:
    // everyone else signs in with Google (D-039), and this endpoint can't
    // create an account.
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
    },

    socialProviders: socialProviders(),

    // The user's timezone lives on Profile, not on User — see
    // billing.prisma. Declaring it here too would mean two columns that can
    // disagree about what day it is.

    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
      // Rate limiting keys on the client IP. Behind a hosting proxy
      // x-forwarded-for carries several hops, and Better Auth only trusts a
      // single-value header unless proxies are listed — so every request
      // fell into one shared bucket (the "could not determine a client IP"
      // warning on Render), and a handful of sign-ins from anyone could
      // throttle everyone. Edge-set single-value headers are tried first.
      // If the warning is still in the logs after a deploy, none of these
      // is set by the host: see systems/06-auth.md.
      ipAddress: {
        ipAddressHeaders: ["true-client-ip", "cf-connecting-ip", "x-forwarded-for"],
      },
    },
    plugins: [expo()],
  });
}

export const auth = createAuth();
