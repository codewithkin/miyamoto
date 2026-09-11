import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { TextInput, View } from "react-native";

import { BladeTick } from "@/components/blade";
import { Enter, Stagger } from "@/components/motion";
import { Touchable } from "@/components/touchable";
import { Button, Screen, Text } from "@/components/ui";
import { Chevron, Icon } from "@/components/icon";
import { MasterAvatar } from "@/components/master-avatar";
import { MASTERS } from "@/content/onboarding-options";
import { authClient } from "@/lib/auth-client";
import { firstName } from "@/lib/names";
import { useOnboarding } from "@/lib/onboarding-store";
import { track } from "@/lib/telemetry";
import { trpc } from "@/utils/trpc";
import { ink, indigo, radius, size, space, text as textColor } from "@/theme/tokens";

/**
 * The whole of onboarding: one question, then the real chat (D-048).
 *
 * Sign-in, then "what's sitting on your chest?", then a real conversation
 * with a real Master, the problem already in the composer. Pressing the
 * button claims the account with defaults the person can change later
 * (Firm pressure, reminders off, this phone's timezone) and opens the thread
 * the claim creates. The quiz that used to follow (wounds, Master, pressure,
 * the forge, the first week, reminders, the offer) is gone at the owner's
 * decision. Everything it set has a default or a place in Settings.
 *
 * Every row goes to the one Master a new account has: the first free Master
 * available on Day 1. The rows used to show Seneca and Curie against some
 * problems, which was true only while the next screen was an authored
 * sample. In a real chat, Seneca arrives on Day 7 and Curie on Day 21, so
 * those faces would promise an answer the chat can't give (D-046).
 *
 * The question is addressed by first name. Sign-in has just handed us the
 * Google name, and being named is what makes it read as a Master speaking
 * rather than a form asking. Without a usable name (see lib/names) it asks
 * plainly.
 */

const SAMPLES = [
  { slug: "passed-over", label: "I got passed over at work" },
  { slug: "betrayed", label: "Someone I trusted lied" },
  { slug: "procrastinating", label: "I keep putting off one thing" },
  { slug: "scared-conversation", label: "I'm scared of a conversation" },
] as const;

/** The Master a brand-new account can talk to: free, and there on Day 1. */
const FIRST_MASTER = MASTERS.find((m) => m.unlockDay === null && !m.proOnly) ?? MASTERS[0];

export default function ProblemScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { draft, set, reset } = useOnboarding();
  const { data: session } = authClient.useSession();
  const name = firstName(session?.user?.name);
  const [typed, setTyped] = React.useState("");
  const [failed, setFailed] = React.useState(false);
  const claim = useMutation(trpc.onboarding.claim.mutationOptions());

  const selected = SAMPLES.find((s) => s.slug === draft.seedProblemSlug) ?? null;
  const wroteOwn = typed.trim().length > 0;
  const problem = wroteOwn ? typed.trim() : (selected?.label ?? null);
  const busy = claim.isPending;

  function choose(slug: string, label: string) {
    set({ seedProblemSlug: slug, seedProblem: label });
    setTyped("");
    setFailed(false);
  }

  /**
   * Claims the account, then opens the chat. The claim creates the first
   * thread with this Master, titled with the problem, which is what the chat
   * opens on.
   *
   * The order matters. Navigating first and then marking the account claimed
   * in the same tick means the app shell's gate sees "claimed" when it
   * mounts, so it doesn't bounce back into onboarding. The onboarding
   * layout, now unfocused, doesn't redirect either. If it did, it would go to
   * the chat anyway, and the chat's own thread-title seed puts the problem
   * in the composer.
   */
  async function begin(text: string | null) {
    if (busy) return;
    setFailed(false);
    try {
      await claim.mutateAsync({
        seedProblem: text,
        wounds: [],
        firstMaster: FIRST_MASTER.slug,
        pressure: draft.pressure,
        morningReminder: draft.morningReminder,
        eveningReminder: draft.eveningReminder,
        remindersEnabled: false,
        timezone: draft.timezone,
      });
    } catch {
      setFailed(true);
      return;
    }

    track("Onboarding.completed", {
      outcome: text === null ? "skipped" : wroteOwn ? "typed" : "picked",
      master: FIRST_MASTER.slug,
    });
    router.replace(
      text ? { pathname: "/(app)/chat", params: { prefill: text } } : "/(app)/chat",
    );
    qc.setQueryData(trpc.onboarding.status.queryKey(), { claimed: true });
    reset();
    // Threads, usage, the Path: everything read before the account existed.
    void qc.invalidateQueries();
  }

  return (
    <Screen scroll>
      {/* Who answers, and the way out. */}
      <Enter preset="drop">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: space.base,
            paddingTop: space.base,
            paddingBottom: space.xl,
          }}
        >
          <MasterAvatar slug={FIRST_MASTER.slug} name={FIRST_MASTER.name} size={44} active />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="eyebrow" color={indigo.light}>
              {FIRST_MASTER.name} answers first
            </Text>
            <Text variant="caption">{FIRST_MASTER.title}</Text>
          </View>
          <Touchable
            feel="row"
            hitSlop={12}
            disabled={busy}
            onPress={() => void begin(null)}
            accessibilityLabel="Skip to the chat"
          >
            <Text variant="label" color={textColor.muted}>
              Skip
            </Text>
          </Touchable>
        </View>
      </Enter>

      <View style={{ flex: 1, gap: space.section }}>
        <View style={{ gap: space.md }}>
          <Enter preset="rise" delay={120}>
            <Text variant="display">
              {name
                ? `${name} — what’s sitting on your chest right now?`
                : "What’s sitting on your chest right now?"}
            </Text>
          </Enter>
          <Enter preset="rise" delay={280}>
            <Text variant="lead">
              Pick one, or say it your way. It goes to {FIRST_MASTER.name}, and you send it when
              you&apos;re ready.
            </Text>
          </Enter>
        </View>

        {/* Each row rolls in on its own beat. */}
        <Stagger initialDelay={420} step={90} style={{ gap: space.md }}>
          {SAMPLES.map((sample) => {
            const isSelected = !wroteOwn && draft.seedProblemSlug === sample.slug;
            return (
              <Enter key={sample.slug} preset="roll">
                <Touchable
                  feel="row"
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected, disabled: busy }}
                  disabled={busy}
                  onPress={() => choose(sample.slug, sample.label)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space.base,
                    paddingVertical: space.xl,
                    paddingHorizontal: space.xl,
                    borderRadius: radius.card,
                    backgroundColor: isSelected ? indigo.tint : ink.surface,
                    borderWidth: isSelected ? 1.5 : 1,
                    borderColor: isSelected ? indigo.base : ink.border,
                  }}
                >
                  <Text variant="label" style={{ flex: 1, fontSize: size.bodyLg }}>
                    {sample.label}
                  </Text>
                  {isSelected ? <BladeTick done /> : <Chevron />}
                </Touchable>
              </Enter>
            );
          })}
        </Stagger>

        <Enter preset="fade" delay={880} style={{ gap: space.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <Icon name="create-outline" size={16} color={textColor.muted} />
            <Text variant="caption">Or type it in your own words — the Masters prefer that.</Text>
          </View>
          <TextInput
            value={typed}
            editable={!busy}
            onChangeText={(v) => {
              setTyped(v);
              setFailed(false);
              if (v.trim()) set({ seedProblemSlug: null, seedProblem: v });
            }}
            placeholder="In your own words…"
            placeholderTextColor={textColor.faintest}
            multiline
            maxLength={2000}
            style={{
              minHeight: 72,
              borderRadius: radius.card,
              backgroundColor: wroteOwn ? indigo.tint : ink.high,
              borderWidth: wroteOwn ? 1.5 : 1,
              borderColor: wroteOwn ? indigo.base : ink.border,
              padding: space.xl,
              color: textColor.body,
              fontSize: size.body,
            }}
          />
        </Enter>
      </View>

      <View style={{ paddingVertical: space.xxl, gap: space.md }}>
        {failed ? (
          <Enter preset="slideLeft">
            <View
              style={{
                borderLeftWidth: 3,
                borderLeftColor: "#E0483B",
                paddingLeft: space.base,
              }}
            >
              <Text variant="caption" color={textColor.body}>
                Couldn&apos;t reach {FIRST_MASTER.name}. Check your connection and try again.
              </Text>
            </View>
          </Enter>
        ) : null}
        <Enter preset="pop" delay={1000}>
          <Button
            label={busy ? "Opening your chat…" : `Ask ${FIRST_MASTER.name}`}
            icon={<MasterAvatar slug={FIRST_MASTER.slug} name={FIRST_MASTER.name} size={26} />}
            disabled={!problem || busy}
            onPress={() => void begin(problem)}
          />
        </Enter>
      </View>
    </Screen>
  );
}
