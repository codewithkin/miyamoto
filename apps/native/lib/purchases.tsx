import { useQuery } from "@tanstack/react-query";
import React from "react";
import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesPackage,
} from "react-native-purchases";

import { authClient } from "@/lib/auth-client";

/**
 * RevenueCat.
 *
 * The app-user id is set to the Better-Auth user id, so entitlements key
 * straight to our own `user` rows and there is no mapping table to keep in
 * sync. `getCustomerInfo()` is used for instant gating on device; the
 * server keeps its own copy from webhooks, because the free counter has to
 * be checked somewhere the client cannot edit.
 *
 * The app's own paywall (app/paywall.tsx) is the only place a purchase
 * starts (plan 15). It reads the plans from the current Offering and buys
 * the one chosen with `purchasePackage`, following RevenueCat's "Displaying
 * Products" guide. There used to be a `RevenueCatUI.presentPaywall()` here,
 * behind every buy button, and it put RevenueCat's dashboard paywall on top
 * of ours.
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

export async function restorePurchases(): Promise<boolean> {
  try {
    const info = await Purchases.restorePurchases();
    return typeof info.entitlements.active[PRO_ENTITLEMENT] !== "undefined";
  } catch {
    return false;
  }
}

// ── Plans, from the store ────────────────────────────────────────────────

/** One package from the current Offering, with what the paywall shows for it. */
export type Plan = {
  /** The package's identifier in the Offering. */
  id: string;
  lifetime: boolean;
  /** "Lifetime", "Monthly", "Yearly"…, from the package type. */
  title: string;
  /** Localised by the store: "$9.99", "R 179,99". */
  price: string;
  /** "month", "year", "week", or null for a one-off purchase. */
  per: string | null;
  /** "3-day", "1-week", when the product starts with a free trial. */
  trial: string | null;
  pkg: PurchasesPackage;
};

const TITLE: Partial<Record<PACKAGE_TYPE, string>> = {
  [PACKAGE_TYPE.LIFETIME]: "Lifetime",
  [PACKAGE_TYPE.ANNUAL]: "Yearly",
  [PACKAGE_TYPE.SIX_MONTH]: "Six months",
  [PACKAGE_TYPE.THREE_MONTH]: "Three months",
  [PACKAGE_TYPE.TWO_MONTH]: "Two months",
  [PACKAGE_TYPE.MONTHLY]: "Monthly",
  [PACKAGE_TYPE.WEEKLY]: "Weekly",
};

/** "P1M" → "month", "P3M" → "3 months", "P1Y" → "year". Null when there's no period. */
function periodWord(iso: string | null): string | null {
  const match = iso ? /^P(\d+)([DWMY])$/.exec(iso) : null;
  if (!match) return null;
  const count = Number(match[1]);
  const unit = { D: "day", W: "week", M: "month", Y: "year" }[match[2] as "D" | "W" | "M" | "Y"];
  return count === 1 ? unit : `${count} ${unit}s`;
}

/** The free trial the store will actually give, if any: "3-day". */
function trialOf(pkg: PurchasesPackage): string | null {
  const free = pkg.product.defaultOption?.freePhase?.billingPeriod;
  if (free && free.value > 0) return `${free.value}-${free.unit.toLowerCase()}`;
  const intro = pkg.product.introPrice;
  if (intro && intro.price === 0 && intro.periodNumberOfUnits > 0) {
    return `${intro.periodNumberOfUnits}-${intro.periodUnit.toLowerCase()}`;
  }
  return null;
}

/** The current Offering's packages, in the dashboard's order. Throws if the store can't be reached. */
export async function loadPlans(): Promise<Plan[]> {
  const offerings = await Purchases.getOfferings();
  const packages = offerings.current?.availablePackages ?? [];
  return packages.map((pkg) => {
    const lifetime = pkg.packageType === PACKAGE_TYPE.LIFETIME;
    return {
      id: pkg.identifier,
      lifetime,
      title: TITLE[pkg.packageType] ?? pkg.product.title,
      price: pkg.product.priceString,
      per: lifetime ? null : periodWord(pkg.product.subscriptionPeriod),
      trial: lifetime ? null : trialOf(pkg),
      pkg,
    };
  });
}

/** The plans the paywall shows. RevenueCat caches Offerings, so this is usually instant. */
export function usePlans() {
  return useQuery({
    queryKey: ["revenuecat", "plans"],
    queryFn: loadPlans,
    staleTime: 5 * 60_000,
    retry: 1,
    enabled: Platform.OS !== "web",
  });
}

export type PurchaseOutcome = "purchased" | "cancelled" | "failed";

/**
 * Buys one package. "cancelled" is the person closing the store sheet, which
 * is not an error and gets no error message. A purchase the store completed
 * is "purchased" even if the entitlement isn't active on the device yet:
 * they paid, so the paywall must not tell them it failed.
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseOutcome> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    if (!customerInfo.entitlements.active[PRO_ENTITLEMENT]) {
      console.warn(
        `[purchases] bought ${pkg.identifier}, but "${PRO_ENTITLEMENT}" isn't active: check the product is attached to the entitlement in RevenueCat`,
      );
    }
    return "purchased";
  } catch (e) {
    const error = e as { code?: string; userCancelled?: boolean | null };
    if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR || error.userCancelled) {
      return "cancelled";
    }
    console.warn("[purchases] purchase failed", e);
    return "failed";
  }
}

type PurchasesState = {
  ready: boolean;
  isPro: boolean;
  refresh: () => Promise<void>;
  buy: (pkg: PurchasesPackage) => Promise<PurchaseOutcome>;
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

  const buy = React.useCallback(
    async (pkg: PurchasesPackage) => {
      const outcome = await purchasePackage(pkg);
      if (outcome === "purchased") await refresh();
      return outcome;
    },
    [refresh],
  );

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
