import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    EXPO_PUBLIC_SERVER_URL: z.url(),
    // TelemetryDeck app. Optional: lib/telemetry.tsx falls back to the
    // production app ID, which is public by design (it ships in every
    // binary), so an EAS build without the variable still reports.
    EXPO_PUBLIC_TELEMETRYDECK_APP_ID: z.string().min(1).optional(),
  },
  runtimeEnv: {
    EXPO_PUBLIC_SERVER_URL: process.env.EXPO_PUBLIC_SERVER_URL,
    EXPO_PUBLIC_TELEMETRYDECK_APP_ID: process.env.EXPO_PUBLIC_TELEMETRYDECK_APP_ID,
  },
  emptyStringAsUndefined: true,
});
