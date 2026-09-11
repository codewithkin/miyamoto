import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";

import { MasterAvatar } from "@/components/master-avatar";
import { Enter, Stagger } from "@/components/motion";
import { Sheet } from "@/components/sheet";
import { Touchable } from "@/components/touchable";
import { Button, Text } from "@/components/ui";
import { Chevron, Icon, IconBadge } from "@/components/icon";
import { MoreQuestions, useBuyPro } from "@/components/more-questions";
import { trpc } from "@/utils/trpc";
import { gold, indigo, ink, radius, red, size, space, text as textColor } from "@/theme/tokens";
import { MASTER_COUNT } from "@/content/onboarding-options";

/**
 * 21 · Switch Master.
 *
 * "The thread stays. Only the hand writing it changes." Locked Masters are
 * listed, and pressing one goes to the paywall: another Master is Pro,
 * straight, with no ad route (plan 13). The server refuses a locked switch
 * again, so the sheet is a courtesy, not the gate.
 */
export function SwitchMasterSheet({
  visible,
  onClose,
  threadId,
  currentSlug,
  onRefused,
}: {
  visible: boolean;
  onClose: () => void;
  threadId?: string;
  currentSlug?: string;
  /** The server refused a switch the sheet had already shown. Reopen it on the reason. */
  onRefused?: () => void;
}) {
  const qc = useQueryClient();
  const router = useRouter();
  const { buying, buyPro } = useBuyPro(onClose);
  const masters = useQuery(trpc.library.masters.queryOptions());

  // The chat's header changes and the sheet closes on the tap (D-049). If
  // the server refuses, the thread goes back to its Master and the sheet
  // reopens with the reason under the list.
  const threadsKey = trpc.chat.threads.queryKey();
  const switchTo = useMutation(
    trpc.chat.switchMaster.mutationOptions({
      onMutate: async ({ threadId: id, masterSlug }) => {
        await qc.cancelQueries({ queryKey: threadsKey });
        const previous = qc.getQueryData(threadsKey);
        const next = masters.data?.find((m) => m.slug === masterSlug);
        if (next) {
          qc.setQueryData(threadsKey, (old) =>
            old?.map((t) =>
              t.id === id
                ? {
                    ...t,
                    masterId: next.id,
                    master: {
                      slug: next.slug,
                      name: next.name,
                      title: next.title,
                      accentColor: next.accentColor,
                    },
                  }
                : t,
            ),
          );
        }
        onClose();
        return { previous };
      },
      onError: (_error, _input, context) => {
        if (context?.previous) qc.setQueryData(threadsKey, context.previous);
        onRefused?.();
      },
      onSettled: () => {
        void qc.invalidateQueries();
      },
    }),
  );

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Change your second"
      subtitle="The thread stays. Only the hand writing it changes."
    >
      <Stagger initialDelay={120} step={80} style={{ gap: space.md }}>
        {(masters.data ?? []).map((m) => {
          const speaking = m.slug === currentSlug;
          // The row that was pressed shows the switch under way; the rest
          // wait, dimmed, until it lands.
          const switching = switchTo.isPending && switchTo.variables?.masterSlug === m.slug;
          return (
            <Enter key={m.id} preset="slideLeft">
              <Touchable
                feel="row"
                disabled={speaking || switchTo.isPending}
                dimWhenDisabled={!switching && !speaking}
                onPress={() => {
                  // A locked Master is Pro, straight: no ad route to another
                  // Master (plan 13). The paywall says what Pro includes.
                  if (!m.available) {
                    onClose();
                    router.push("/paywall");
                    return;
                  }
                  if (threadId) switchTo.mutate({ threadId, masterSlug: m.slug });
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: space.base,
                  padding: space.xl,
                  borderRadius: radius.card,
                  backgroundColor: speaking ? indigo.tint : ink.surface,
                  borderWidth: 1,
                  borderColor: speaking ? indigo.base : ink.border,
                }}
              >
                <MasterAvatar
                  slug={m.slug}
                  name={m.name}
                  size={44}
                  active={speaking}
                  locked={!m.available}
                  pro={m.lockReason === "PRO"}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    variant="label"
                    color={m.available ? undefined : textColor.muted}
                    style={{ fontSize: size.body }}
                  >
                    {m.name}
                  </Text>
                  <Text variant="caption">{m.domains.join(" · ")}</Text>
                </View>
                <Text
                  variant="eyebrow"
                  color={
                    speaking
                      ? indigo.light
                      : m.lockReason === "PRO"
                        ? gold.base
                        : textColor.faintest
                  }
                >
                  {speaking
                    ? "Speaking"
                    : m.available
                      ? ""
                      : m.lockReason === "PRO"
                        ? "Pro"
                        : `Day ${m.unlockDay}`}
                </Text>
                {switching ? (
                  <ActivityIndicator size="small" color={indigo.light} />
                ) : m.available && !speaking ? (
                  <Chevron />
                ) : null}
              </Touchable>
            </Enter>
          );
        })}
      </Stagger>

      {switchTo.error ? (
        <Enter preset="slideLeft">
          <Text variant="caption" color={red.base}>
            {switchTo.error.message === "PRO_REQUIRED"
              ? "That one is behind Pro."
              : "You haven't earned that Master yet."}
          </Text>
        </Enter>
      ) : null}

      <Button
        label="Every Master, now · Pro"
        variant="pro"
        icon={<Icon name="diamond" size={20} color={ink.base} />}
        loading={buying}
        loadingLabel="Opening the store…"
        disabled={switchTo.isPending}
        onPress={buyPro}
      />
    </Sheet>
  );
}

/**
 * 22 · Attach evidence.
 *
 * Permission is requested at the moment of use rather than up front, so the
 * OS prompt arrives with the reason already on screen. Voice notes and the
 * failure log are marked "Soon" rather than being silently dead.
 */
export function AttachSheet({
  visible,
  onClose,
  onPicked,
}: {
  visible: boolean;
  onClose: () => void;
  onPicked?: (uri: string) => void;
}) {
  const [error, setError] = React.useState<string | null>(null);

  async function pick(from: "library" | "camera") {
    setError(null);
    try {
      const permission =
        from === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setError("Miyamoto needs that permission to attach the evidence.");
        return;
      }

      const result =
        from === "camera"
          ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              quality: 0.7,
            });

      if (result.canceled || !result.assets[0]) return;
      onPicked?.(result.assets[0].uri);
      onClose();
    } catch {
      setError("That didn't open. Try the other one.");
    }
  }

  const options = [
    { label: "Photo from library", icon: "images-outline", run: () => void pick("library"), ready: true },
    { label: "Take a photo", icon: "camera-outline", run: () => void pick("camera"), ready: true },
    { label: "Record a voice note", icon: "mic-outline", run: () => {}, ready: false },
    { label: "From your failure log", icon: "document-text-outline", run: () => {}, ready: false },
  ] as const;

  return (
    <Sheet visible={visible} onClose={onClose} title="Show him the evidence">
      <Stagger initialDelay={120} step={70} style={{ gap: space.md }}>
        {options.map((o) => (
          <Enter key={o.label} preset="slideLeft">
            <Touchable
              feel={o.ready ? "row" : "none"}
              disabled={!o.ready}
              onPress={o.run}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space.base,
                padding: space.xl,
                borderRadius: radius.card,
                backgroundColor: ink.surface,
                borderWidth: 1,
                borderColor: ink.border,
              }}
            >
              <IconBadge
                name={o.icon}
                color={o.ready ? indigo.light : textColor.faintest}
                size={36}
              />
              <Text
                variant="label"
                color={o.ready ? undefined : textColor.faintest}
                style={{ flex: 1, fontSize: size.body }}
              >
                {o.label}
              </Text>
              {!o.ready ? <Text variant="eyebrow">Soon</Text> : null}
            </Touchable>
          </Enter>
        ))}
      </Stagger>

      {error ? (
        <Enter preset="slideLeft">
          <Text variant="caption" color={red.base}>
            {error}
          </Text>
        </Enter>
      ) : null}
    </Sheet>
  );
}

/**
 * 23 · More questions.
 *
 * Three ways forward: an ad for three more, Pro for no counting, or
 * tomorrow. The ad leads because it's free and the owner wants people to
 * take it (plan 13); Pro follows in gold. Both come from MoreQuestions,
 * the same pair the chat and the You tab show.
 *
 * The extra questions are granted by the server and only after the reward
 * was actually earned. Closing the ad early counts for nothing, and says so.
 */
export function OutOfAnswersSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const usage = useQuery(trpc.chat.usage.queryOptions());
  const hours = usage.data ? Math.max(1, Math.ceil(usage.data.msUntilReset / 3_600_000)) : null;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Three questions is all a stranger gets."
      subtitle={`Watch an ad for three more today. Or step inside, and the Masters answer without counting: all ${MASTER_COUNT}, every story, no ads.`}
    >
      <Enter preset="pop" delay={140}>
        <MoreQuestions onGranted={onClose} onBought={onClose} />
      </Enter>

      <Enter preset="fade" delay={300}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          <Icon name="moon-outline" size={16} color={textColor.faintest} />
          <Text variant="caption">
            {hours ? `Or wait: three new questions in ${hours}h.` : "Or wait until tomorrow."}
          </Text>
        </View>
      </Enter>
    </Sheet>
  );
}
