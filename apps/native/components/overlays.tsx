import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";

import { Blade, BladeTick } from "@/components/blade";
import { Enter, Stagger } from "@/components/motion";
import { Sheet } from "@/components/sheet";
import { Button, Text } from "@/components/ui";
import { trpc } from "@/utils/trpc";
import { gold, indigo, ink, radius, size, space, text as textColor } from "@/theme/tokens";

/**
 * 21 · Switch Master.
 *
 * "The thread stays. Only the hand writing it changes." Locked Masters are
 * listed but refused, and the server refuses them again — the sheet is a
 * courtesy, not the gate.
 */
export function SwitchMasterSheet({
  visible,
  onClose,
  threadId,
  currentSlug,
}: {
  visible: boolean;
  onClose: () => void;
  threadId?: string;
  currentSlug?: string;
}) {
  const qc = useQueryClient();
  const router = useRouter();
  const masters = useQuery(trpc.library.masters.queryOptions());

  const switchTo = useMutation(
    trpc.chat.switchMaster.mutationOptions({
      onSuccess: () => {
        void qc.invalidateQueries();
        onClose();
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
          return (
            <Enter key={m.id} preset="slideLeft">
              <Pressable
                disabled={!m.available || speaking || switchTo.isPending}
                onPress={() =>
                  threadId && switchTo.mutate({ threadId, masterSlug: m.slug })
                }
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: space.base,
                  padding: space.xl,
                  borderRadius: radius.card,
                  backgroundColor: speaking ? indigo.tint : ink.surface,
                  borderWidth: 1,
                  borderColor: speaking ? indigo.base : ink.border,
                  opacity: m.available ? (pressed ? 0.85 : 1) : 0.5,
                })}
              >
                <Blade
                  state={speaking ? "active" : m.available ? "complete" : m.lockReason === "PRO" ? "locked" : "empty"}
                  length={14}
                />
                <View style={{ flex: 1 }}>
                  <Text variant="label" style={{ fontSize: size.body }}>
                    {m.name}
                  </Text>
                  <Text variant="caption">{m.domains.join(" · ")}</Text>
                </View>
                <Text
                  variant="eyebrow"
                  color={speaking ? indigo.light : m.lockReason === "PRO" ? gold.base : textColor.faintest}
                >
                  {speaking
                    ? "Speaking"
                    : m.available
                      ? "›"
                      : m.lockReason === "PRO"
                        ? "Pro"
                        : `Day ${m.unlockDay}`}
                </Text>
              </Pressable>
            </Enter>
          );
        })}
      </Stagger>

      {switchTo.error ? (
        <Text variant="caption" color="#E0483B">
          {switchTo.error.message === "PRO_REQUIRED"
            ? "That one is behind Pro."
            : "You haven't earned that Master yet."}
        </Text>
      ) : null}

      <Button
        label="See Pro"
        variant="secondary"
        onPress={() => {
          onClose();
          router.push("/paywall");
        }}
      />
    </Sheet>
  );
}

/**
 * 22 · Attach evidence.
 *
 * Media capture is not wired — expo-image-picker is not installed — so the
 * options are listed and inert rather than silently doing nothing.
 */
export function AttachSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const options = [
    "Photo from library",
    "Take a photo",
    "Record a voice note",
    "From your failure log",
  ];

  return (
    <Sheet visible={visible} onClose={onClose} title="Show him the evidence">
      <Stagger initialDelay={120} step={70} style={{ gap: space.md }}>
        {options.map((o) => (
          <Enter key={o} preset="slideLeft">
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space.base,
                padding: space.xl,
                borderRadius: radius.card,
                backgroundColor: ink.surface,
                borderWidth: 1,
                borderColor: ink.border,
                opacity: 0.55,
              }}
            >
              <Blade state="empty" length={12} />
              <Text variant="label" style={{ flex: 1, fontSize: size.body }}>
                {o}
              </Text>
            </View>
          </Enter>
        ))}
      </Stagger>
      <Text variant="caption">Attachments arrive once media capture is wired.</Text>
    </Sheet>
  );
}

/**
 * 23 · Out of answers.
 *
 * The counter has run out. Three ways forward, in the order the design
 * ranks them: Pro, an ad for one more, or tomorrow.
 */
export function OutOfAnswersSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const grant = useMutation(
    trpc.chat.grantBonus.mutationOptions({
      onSuccess: () => {
        void qc.invalidateQueries();
        onClose();
      },
    }),
  );

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Three questions is all a stranger gets."
      subtitle="Step inside and the Masters answer without counting — all five, every story, no ads."
    >
      <Enter preset="pop" delay={140}>
        <Button
          label="See Pro · $9.99/mo or $149 once"
          onPress={() => {
            onClose();
            router.push("/paywall");
          }}
        />
      </Enter>
      <Enter preset="fade" delay={280}>
        <Button
          label={grant.isPending ? "Granting…" : "Watch an ad for +1"}
          variant="secondary"
          disabled={grant.isPending}
          onPress={() => grant.mutate()}
        />
      </Enter>
      <Enter preset="fade" delay={400}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          <BladeTick />
          <Text variant="caption">Or wait until tomorrow.</Text>
        </View>
      </Enter>
    </Sheet>
  );
}
