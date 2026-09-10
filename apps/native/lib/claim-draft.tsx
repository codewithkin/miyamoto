import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";

import { authClient } from "@/lib/auth-client";
import { useOnboarding } from "@/lib/onboarding-store";
import { trpc } from "@/utils/trpc";

/**
 * Submits the onboarding draft once a session exists, and clears it only
 * after the server confirms.
 *
 * This lives in the app shell rather than in the sign-in handler because the
 * handler runs exactly once. If the round trip fails there — no signal on the
 * train, the app killed while the browser sheet was open — the answers would
 * stay on the device with nothing left that ever sends them. Mounted in the
 * shell, a failed claim is simply tried again the next time the app opens,
 * and the draft survives until one succeeds.
 *
 * The server side is idempotent (see the onboarding router), so a retry that
 * races an earlier success is harmless: it reports alreadyClaimed and the
 * draft is cleared the same way.
 *
 * A draft is pending once onboarding has finished. Onboarding runs after
 * sign-in now, so the account always exists before the answers do; what has
 * to wait is the user reaching the end of the quiz.
 */
export function useClaimDraft() {
  const { draft, hydrated, reset } = useOnboarding();
  const { data: session } = authClient.useSession();
  const qc = useQueryClient();
  const claim = useMutation(trpc.onboarding.claim.mutationOptions());
  const inFlight = React.useRef(false);

  const userId = session?.user?.id;
  const pending = hydrated && Boolean(draft.finishedAt);

  React.useEffect(() => {
    if (!userId || !pending || inFlight.current) return;
    inFlight.current = true;

    claim
      .mutateAsync({
        seedProblem: draft.seedProblem,
        wounds: draft.wounds,
        firstMaster: draft.firstMaster,
        pressure: draft.pressure,
        morningReminder: draft.morningReminder,
        eveningReminder: draft.eveningReminder,
        remindersEnabled: draft.remindersEnabled,
        timezone: draft.timezone,
      })
      .then(async () => {
        // Mark the account onboarded in the cache *before* clearing the
        // draft. The routing gates let a finished-but-unclaimed draft through
        // to the app; if the draft vanished while the cached status still said
        // "not claimed", the app shell would bounce the user back into the
        // quiz for the length of one refetch.
        qc.setQueryData(trpc.onboarding.status.queryKey(), { claimed: true });
        reset();
        // Every screen that read defaults before the claim landed — pressure,
        // Master, timezone — is refetched against the real row.
        await qc.invalidateQueries();
      })
      .catch(() => {
        // Kept on the device. The next mount of the shell tries again.
      })
      .finally(() => {
        inFlight.current = false;
      });
    // The draft is read at the moment a claim starts; re-running on every
    // draft edit would submit half-typed answers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, pending]);

  return { claiming: claim.isPending };
}
