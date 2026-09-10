import { sha256 } from "@noble/hashes/sha2.js";
import { env } from "@miyamoto/env/native";
import { createTelemetryDeck, TelemetryDeckProvider } from "@typedigital/telemetrydeck-react";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import React from "react";
import { Platform } from "react-native";

/**
 * Product analytics, through TelemetryDeck (D-041).
 *
 * `track(type, payload)` is the only way to send a signal. It never throws,
 * never blocks the caller, and never needs awaiting — a failed signal is a
 * lost data point, not a broken screen. The signals themselves are listed in
 * systems/10-analytics.md, with what each one carries.
 *
 * Who is counted: a random id made on first launch and kept in SecureStore.
 * Never the account id, never the email. TelemetryDeck hashes it again (with
 * the salt below) before it leaves the phone. One id per install means a
 * person's path from welcome to first message is one funnel, across the
 * moment they sign in.
 *
 * No global patching. The SDK hashes with `crypto.subtle.digest`, which React
 * Native does not have. Its own guide monkey-patches `globalThis.crypto` with
 * expo-crypto — a native module, so a new EAS development build. Instead the
 * SDK's `subtleCrypto` option gets a SHA-256 from @noble/hashes, which is
 * pure JavaScript. Hermes has TextEncoder natively.
 *
 * `testMode` is always passed. Left undefined, the React SDK decides it by
 * reading `window.location.hostname`, which does not exist in React Native.
 */

// Public by design — it ships in every build. The env override exists so a
// staging app can be pointed elsewhere without a code change.
const APP_ID = env.EXPO_PUBLIC_TELEMETRYDECK_APP_ID ?? "5D5EE985-6FCF-4D10-B283-AC4F7F7F5A08";

const SALT = "miyamoto.meet-the-masters";
const INSTALL_ID_KEY = "miyamoto.telemetry.install-id";

/** `crypto.subtle`, as much of it as the SDK uses. */
const subtleCrypto = {
  async digest(_algorithm: string, data: ArrayBuffer | Uint8Array) {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    // A copy, so the returned buffer is exactly the 32 bytes of the hash.
    return new Uint8Array(sha256(bytes)).buffer;
  },
};

// The React SDK's plugin shape; its index does not export the type.
type Payload = Record<string, unknown>;
type Plugin = (next: (payload: Payload) => Payload) => (payload: Payload) => Payload;

const OS_NAME: Record<string, string> = { ios: "iOS", android: "Android" };

/**
 * TelemetryDeck's own default parameter names, so the dashboard's built-in
 * device and version insights work without custom queries.
 */
const nativeContext: Plugin = (next) => (payload) =>
  next({
    "TelemetryDeck.Device.platform": Platform.OS,
    "TelemetryDeck.Device.operatingSystem": OS_NAME[Platform.OS] ?? Platform.OS,
    "TelemetryDeck.Device.systemVersion": String(Platform.Version),
    "TelemetryDeck.AppInfo.version": Constants.expoConfig?.version ?? "unknown",
    "TelemetryDeck.RunContext.isDebug": __DEV__ ? "true" : "false",
    ...payload,
  });

const td = createTelemetryDeck({
  appID: APP_ID,
  // Replaced with the install id as soon as it has been read; nothing is sent
  // before then (see `ready` below).
  clientUser: "pending",
  salt: SALT,
  // Development builds report in TelemetryDeck's test mode, so testing never
  // pollutes the real numbers. Toggle "Test Mode" in the dashboard to see them.
  testMode: __DEV__,
  subtleCrypto: subtleCrypto as unknown as Function,
  plugins: [nativeContext],
});

function randomId() {
  // Not a secret and never used for security, only to tell installs apart;
  // Math.random is enough and needs no native module.
  const part = () =>
    Math.floor(Math.random() * 0x100000000)
      .toString(16)
      .padStart(8, "0");
  return `${Date.now().toString(16)}-${part()}${part()}${part()}`;
}

async function loadInstallId(): Promise<string> {
  try {
    const existing = await SecureStore.getItemAsync(INSTALL_ID_KEY);
    if (existing) return existing;
    const made = randomId();
    await SecureStore.setItemAsync(INSTALL_ID_KEY, made);
    return made;
  } catch {
    // SecureStore unavailable (web, or a locked keychain): count this launch
    // as its own install rather than not counting it.
    return randomId();
  }
}

const ready: Promise<void> = loadInstallId().then((id) => {
  td.clientUser = id;
});

export type SignalType =
  | "Welcome.shown"
  | "Auth.signInStarted"
  | "Auth.signInCompleted"
  | "Auth.signInFailed"
  | "Onboarding.completed"
  | "Chat.messageSent";

/** Values go over the wire as strings; keep them to short enums and counts. */
export type SignalPayload = Record<string, string | number | boolean>;

/**
 * Send a signal. Fire and forget: safe to call from effects, event handlers
 * and non-React code alike.
 */
export function track(type: SignalType, payload: SignalPayload = {}): void {
  void (async () => {
    try {
      await ready;
      const enhanced = td.payloadEnhancer ? td.payloadEnhancer(payload) : payload;
      await td.signal(type, enhanced);
    } catch (e) {
      if (__DEV__) console.warn(`[telemetry] ${type} not sent:`, e);
    }
  })();
}

/**
 * Mounts TelemetryDeck's provider, per its React Native guide, so
 * `useTelemetryDeck()` works for anyone reaching for it. `track()` does not
 * need it and is what the app uses.
 */
export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  return <TelemetryDeckProvider telemetryDeck={td}>{children}</TelemetryDeckProvider>;
}
