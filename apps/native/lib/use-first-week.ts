import { useQuery } from "@tanstack/react-query";

import { useOnboarding } from "@/lib/onboarding-store";
import { trpc } from "@/utils/trpc";

/**
 * Days 1–7 of the Path at the pressure chosen in onboarding (plan 11).
 *
 * One query for every onboarding screen that quotes the Path — the first-week
 * screen, payoff's Day 1 card, the morning reminder preview — so they can't
 * disagree about what Day 1 is. It's authored content, the same for everyone
 * at a pressure, so it never goes stale within a session.
 */
export function useFirstWeek() {
  const { draft } = useOnboarding();
  return useQuery({
    ...trpc.path.preview.queryOptions({ pressure: draft.pressure, days: 7 }),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
