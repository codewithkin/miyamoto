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
    };
  }

  if (env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET) {
    providers.apple = {
      clientId: env.APPLE_CLIENT_ID,
      clientSecret: env.APPLE_CLIENT_SECRET,
      ...(env.APPLE_APP_BUNDLE_IDENTIFIER
        ? { appBundleIdentifier: env.APPLE_APP_BUNDLE_IDENTIFIER }
        : {}),
    };
  }

  return providers;
}

/** Which sign-in buttons the client should render. */
export function availableProviders() {
  return Object.keys(socialProviders()) as ("google" | "apple")[];
}

export function createAuth() {
  const prisma = createPrismaClient();

  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),

    trustedOrigins: [
      env.CORS_ORIGIN,

      "miyamoto://",
      "exp://",
      "http://localhost:8081",
    ],

    // The design promises "no passwords or emailed links". Leaving this on
    // would leave a credential endpoint live that no screen ever uses.
    emailAndPassword: {
      enabled: false,
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
    },
    plugins: [expo()],
  });
}

export const auth = createAuth();
