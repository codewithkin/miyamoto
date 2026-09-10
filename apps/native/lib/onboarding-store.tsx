import * as SecureStore from "expo-secure-store";
import React from "react";

/**
 * The onboarding draft.
 *
 * The quiz runs after sign-in, and every answer is held here on the device
 * until the user reaches the end, then submitted once. Held locally rather
 * than written screen by screen so a killed app resumes mid-quiz, and so a
 * user who abandons halfway leaves nothing half-built on the server.
 */

export type Pressure = "GENTLE" | "FIRM" | "UNBREAKABLE";

export type OnboardingDraft = {
  /** What they picked or typed on the opening screen. */
  seedProblem: string | null;
  /** Slug of the sample problem, when they picked rather than typed. */
  seedProblemSlug: string | null;
  /** Wound slugs claimed on "What are you carrying?". */
  wounds: string[];
  /** Slug of the Master who takes the first question. */
  firstMaster: string | null;
  pressure: Pressure;
  morningReminder: string;
  eveningReminder: string;
  remindersEnabled: boolean;
  /** Captured from the device, so day boundaries are right from Day 1. */
  timezone: string;
  /**
   * Set when the user finishes onboarding. Onboarding runs after sign-in
   * (D-004, superseded), so this — not reaching a sign-in screen — is what
   * makes a draft ready to be claimed.
   */
  finishedAt: string | null;
};

const STORAGE_KEY = "miyamoto.onboarding.draft";

function emptyDraft(): OnboardingDraft {
  return {
    seedProblem: null,
    seedProblemSlug: null,
    wounds: [],
    firstMaster: null,
    pressure: "FIRM",
    morningReminder: "06:00",
    eveningReminder: "21:00",
    remindersEnabled: false,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
    finishedAt: null,
  };
}

type Store = {
  draft: OnboardingDraft;
  /** False until the persisted draft has been read back. */
  hydrated: boolean;
  set: (patch: Partial<OnboardingDraft>) => void;
  toggleWound: (slug: string) => void;
  reset: () => void;
};

const OnboardingContext = React.createContext<Store | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = React.useState<OnboardingDraft>(emptyDraft);
  const [hydrated, setHydrated] = React.useState(false);

  // Read the draft back on launch so a killed app resumes mid-quiz rather
  // than restarting it.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(STORAGE_KEY);
        if (!cancelled && raw) {
          setDraft({ ...emptyDraft(), ...(JSON.parse(raw) as Partial<OnboardingDraft>) });
        }
      } catch {
        // A corrupt or unreadable draft is not worth blocking launch over —
        // fall back to a fresh one.
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = React.useCallback((next: OnboardingDraft) => {
    void SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next)).catch(() => {
      // Persistence is a convenience; losing it must not break the flow.
    });
  }, []);

  const set = React.useCallback(
    (patch: Partial<OnboardingDraft>) => {
      setDraft((prev) => {
        const next = { ...prev, ...patch };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const toggleWound = React.useCallback(
    (slug: string) => {
      setDraft((prev) => {
        const wounds = prev.wounds.includes(slug)
          ? prev.wounds.filter((w) => w !== slug)
          : [...prev.wounds, slug];
        const next = { ...prev, wounds };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const reset = React.useCallback(() => {
    const next = emptyDraft();
    setDraft(next);
    void SecureStore.deleteItemAsync(STORAGE_KEY).catch(() => {});
  }, []);

  const value = React.useMemo<Store>(
    () => ({ draft, hydrated, set, toggleWound, reset }),
    [draft, hydrated, set, toggleWound, reset],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = React.useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used inside <OnboardingProvider>");
  }
  return ctx;
}
