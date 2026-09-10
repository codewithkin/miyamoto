import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
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
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
