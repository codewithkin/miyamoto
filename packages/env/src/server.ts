import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * This schema is server-only, so `clientPrefix`/`client` were omitted —
 * the usual way to call `createEnv` with no client vars. But
 * @t3-oss/env-core's `createEnv` has no default for its `TPrefix` type
 * parameter, and the "server-only" overload branch never mentions
 * `clientPrefix` at all, so TypeScript has nowhere to *infer* `TPrefix`
 * from and, in some compilation contexts, widens it to `string |
 * undefined` instead of `undefined`. When that happens every `server` key
 * gets flagged with @t3-oss/env-core's "should not be prefixed" branded
 * error, because the mapped type's `` TKey extends `${TPrefix}${string}` ``
 * check matches almost any key once `TPrefix` includes `string`.
 *
 * `clientPrefix: undefined` below gives TypeScript an actual property to
 * infer `TPrefix` from, rather than nothing to infer from at all — passing
 * `<undefined>` as an explicit type argument instead breaks inference of
 * `TServer` too (it stops being inferred from `server: {...}` and falls
 * back to its own default, emptying `env`'s type — caught by
 * `pnpm check-types` before this was committed).
 *
 * This one compiled clean locally (`pnpm check-types`) but broke a Vercel
 * deploy, whose Node.js runtime type-checks `apps/server`'s entry
 * independently of our own build, under settings that hit the unstable
 * path — see `systems/12-deploys.md`.
 */
export const env = createEnv({
  clientPrefix: undefined,
  client: {},
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

    // Sign-in is Google only for now (D-039) — there is no password or
    // magic-link path. Optional so the server still boots without
    // credentials; the provider is only registered when both are present,
    // and the server says at boot whether a phone can complete the flow.
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    // Apple sign-in is off for now (D-039). Uncomment together with the
    // provider block in packages/auth/src/index.ts.
    // APPLE_CLIENT_ID: z.string().min(1).optional(),
    // APPLE_CLIENT_SECRET: z.string().min(1).optional(),
    // /** Native iOS bundle id, required for Sign in with Apple on device. */
    // APPLE_APP_BUNDLE_IDENTIFIER: z.string().min(1).optional(),

    // The Masters run through OpenRouter, not DeepSeek directly — one key
    // covers every model and lets a Master be moved to another provider by
    // changing its id alone.
    OPENROUTER_API_KEY: z.string().min(1).optional(),

    // Transactional mail over SMTP. Optional so the server boots without
    // it; sendMail logs and swallows when it is absent.
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASS: z.string().min(1).optional(),
    SMTP_FROM: z.string().min(1).optional(),
    /** Public site origin, used to build links in emails. */
    WEB_URL: z.url().optional(),

    // The value RevenueCat sends as the webhook's Authorization header, set
    // in its dashboard. Optional so the server boots without it; the webhook
    // answers 503 until it is present rather than accepting unsigned events.
    REVENUECAT_WEBHOOK_AUTH: z.string().min(16).optional(),

    // The Google Play reviewer account (plan 14). With both set, every start
    // makes sure it exists, has this password and is Pro; without them,
    // nothing is seeded. Held only in the host's environment, never in the
    // repo: they're the same values typed into Play Console's "Sign in
    // details".
    //
    // Deliberately unchecked: no format, no length, no strength. The owner
    // wants the reviewer password simple, and this schema runs at startup,
    // so a rule here once stopped the whole server over a short reviewer
    // password. Nothing about the reviewer may ever stop the server.
    REVIEWER_EMAIL: z.string().optional(),
    REVIEWER_PASSWORD: z.string().optional(),
    REVIEWER_NAME: z.string().optional(),

    // Expo's push service. Only needed if "enhanced push security" is turned
    // on for the project in Expo's dashboard; pushes go out without it.
    EXPO_ACCESS_TOKEN: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
