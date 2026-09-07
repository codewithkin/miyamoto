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

    // Sign-in is Google and Apple only — the design has no password or
    // magic-link path. Both are optional so the server still boots without
    // credentials; a provider is only registered when its pair is present,
    // and sign-in for that provider is unavailable until then.
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    APPLE_CLIENT_ID: z.string().min(1).optional(),
    APPLE_CLIENT_SECRET: z.string().min(1).optional(),
    /** Native iOS bundle id, required for Sign in with Apple on device. */
    APPLE_APP_BUNDLE_IDENTIFIER: z.string().min(1).optional(),

    // The Masters run through OpenRouter, not DeepSeek directly — one key
    // covers every model and lets a Master be moved to another provider by
    // changing its id alone.
    OPENROUTER_API_KEY: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
