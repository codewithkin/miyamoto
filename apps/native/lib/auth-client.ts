import { expoClient } from "@better-auth/expo/client";
import { env } from "@miyamoto/env/native";
import { createAuthClient } from "better-auth/react";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

/**
 * The app's URL scheme ("miyamoto"), from app.json. Better Auth's redirect
 * back into the app arrives on it, and the server trusts `miyamoto://`.
 */
export const AUTH_SCHEME = Constants.expoConfig?.scheme as string;

/**
 * Where the Expo plugin keeps the session: SecureStore, under
 * `${AUTH_STORAGE_PREFIX}_cookie`. Exported so `lib/auth-redirect.ts` writes
 * to exactly the key and format the plugin reads.
 */
export const AUTH_STORAGE_PREFIX = AUTH_SCHEME;

export const authClient = createAuthClient({
  baseURL: env.EXPO_PUBLIC_SERVER_URL,
  plugins: [
    expoClient({
      scheme: AUTH_SCHEME,
      storagePrefix: AUTH_STORAGE_PREFIX,
      storage: SecureStore,
    }),
  ],
});
