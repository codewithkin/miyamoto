import React from "react";
import { Platform } from "react-native";
import Purchases, { LOG_LEVEL, type CustomerInfo } from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";

import { authClient } from "@/lib/auth-client";

/**
 * RevenueCat.
 *
 * The app-user id is set to the Better-Auth user id, so entitlements key
 * straight to our own `user` rows and there is no mapping table to keep in
 * sync. `getCustomerInfo()` is used for instant gating on device; the
 * server keeps its own copy from webhooks, because the free counter has to
 * be checked somewhere the client cannot edit.
 */

/** The entitlement configured in the RevenueCat dashboard. */
export const PRO_ENTITLEMENT = "miyamoto_meet_the_masters_pro";

const IOS_API_KEY = "test_XPKxrBfvXYhCVerxrXaJKWYejlm";
const ANDROID_API_KEY = "test_XPKxrBfvXYhCVerxrXaJKWYejlm";

let configured = false;

export function configurePurchases() {
  if (configured) return;
  Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

  if (Platform.OS === "ios") {
    Purchases.configure({ apiKey: IOS_API_KEY });
  } else if (Platform.OS === "android") {
    Purchases.configure({ apiKey: ANDROID_API_KEY });
  } else {
    // Web has no store; leave it unconfigured rather than throwing.
    return;
  }
  configured = true;
}

/** True when the Pro entitlement is currently active. */
export async function hasProEntitlement(): Promise<boolean> {
  try {
    const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();
    return typeof customerInfo.entitlements.active[PRO_ENTITLEMENT] !== "undefined";
  } catch {
    // A failed lookup must not silently grant access.
    return false;
  }
}

/** Presents the dashboard-configured paywall. Resolves true if they bought. */
export async function presentPaywall(): Promise<boolean> {
  try {
    const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall();

    switch (paywallResult) {
      case PAYWALL_RESULT.NOT_PRESENTED:
      case PAYWALL_RESULT.ERROR:
      case PAYWALL_RESULT.CANCELLED:
        return false;
      case PAYWALL_RESULT.PURCHASED:
      case PAYWALL_RESULT.RESTORED:
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const info = await Purchases.restorePurchases();
    return typeof info.entitlements.active[PRO_ENTITLEMENT] !== "undefined";
  } catch {
    return false;
  }
}

type PurchasesState = {
  ready: boolean;
  isPro: boolean;
  refresh: () => Promise<void>;
  buy: () => Promise<boolean>;
  restore: () => Promise<boolean>;
};

const PurchasesContext = React.createContext<PurchasesState | null>(null);

export function PurchasesProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);
  const [isPro, setIsPro] = React.useState(false);
  const { data: session } = authClient.useSession();

  React.useEffect(() => {
    configurePurchases();
    setReady(true);
  }, []);

  // Bind the RevenueCat identity to our own user id, so a purchase made on
  // one device follows the account rather than the install.
  React.useEffect(() => {
    if (!ready) return;
    const userId = session?.user?.id;
    (async () => {
      try {
        if (userId) await Purchases.logIn(userId);
        else await Purchases.logOut();
      } catch {
        // Identity binding failing is not fatal — gating still falls back
        // to the server's copy of the entitlement.
      }
      setIsPro(await hasProEntitlement());
    })();
  }, [ready, session?.user?.id]);

  const refresh = React.useCallback(async () => {
    setIsPro(await hasProEntitlement());
  }, []);

  const buy = React.useCallback(async () => {
    const bought = await presentPaywall();
    if (bought) await refresh();
    return bought;
  }, [refresh]);

  const restore = React.useCallback(async () => {
    const restored = await restorePurchases();
    if (restored) await refresh();
    return restored;
  }, [refresh]);

  const value = React.useMemo(
    () => ({ ready, isPro, refresh, buy, restore }),
    [ready, isPro, refresh, buy, restore],
  );

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
}

export function usePurchases() {
  const ctx = React.useContext(PurchasesContext);
  if (!ctx) throw new Error("usePurchases must be used inside <PurchasesProvider>");
  return ctx;
}
