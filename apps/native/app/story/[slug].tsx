import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { MasterAvatar } from "@/components/master-avatar";
import { Blade } from "@/components/blade";
import { Touchable } from "@/components/touchable";
import { Enter } from "@/components/motion";
import { Button, Screen, Text } from "@/components/ui";
import { BackButton } from "@/components/icon";
import { trpc } from "@/utils/trpc";
import { gold, ink, radius, size, space, text as textColor } from "@/theme/tokens";

/**
 * 17 · Story → lesson → action.
 *
 * The three parts arrive in order with real gaps between them, because the
 * lesson only lands if the story has finished first. The button at the
 * bottom carries the wound into chat rather than restating it — the thread
 * opens already knowing what it is about.
 */
export default function StoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const story = useQuery(trpc.library.story.queryOptions({ slug: slug! }));
  // Refetch the thread list before opening the chat, which opens on the
  // newest thread; see masters.tsx.
  const createThread = useMutation(
    trpc.chat.createThread.mutationOptions({
      onSuccess: async () => {
        await qc.invalidateQueries({ queryKey: trpc.chat.threads.queryKey() });
        router.push("/(app)/chat");
      },
    }),
  );

  const s = story.data;

  return (
    <Screen scroll>
      <Enter preset="drop">
        <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: space.lg }}>
          <BackButton onPress={() => router.back()} />
        </View>
      </Enter>

      {!s ? (
        <Text variant="lead">Loading…</Text>
      ) : (
        <View style={{ gap: space.section, paddingBottom: space.screen }}>
          <Enter preset="rise" delay={80}>
            <View style={{ gap: space.sm }}>
              <Text variant="eyebrow">
                {s.category.name} · {s.readSeconds}s read
              </Text>
              <Text variant="display">{s.title}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, marginTop: space.xs }}>
                <MasterAvatar slug={s.master.slug} name={s.master.name} size={32} />
                <Text variant="caption" style={{ flex: 1 }}>
                  {s.master.name} answers · {s.master.era}
                </Text>
              </View>
            </View>
          </Enter>

          {s.locked ? (
            <Enter preset="pinwheel" delay={300}>
              <View
                style={{
                  padding: space.section,
                  borderRadius: radius.card,
                  backgroundColor: gold.tint,
                  borderWidth: 1,
                  borderColor: gold.tintAlt,
                  gap: space.base,
                }}
              >
                <MasterAvatar slug={s.master.slug} name={s.master.name} size={48} locked pro />
                <Text variant="voice">
                  {s.master.name} has an answer to this one. It is behind Pro.
                </Text>
                <Button label="See Pro" onPress={() => router.push("/paywall")} />
              </View>
            </Enter>
          ) : (
            <>
              {/* The story. */}
              <Enter preset="rise" delay={340}>
                <Text variant="voice">{s.story}</Text>
              </Enter>

              {/* The lesson, after a real gap. */}
              <Enter preset="slideLeft" delay={900}>
                <View
                  style={{
                    padding: space.xl,
                    borderRadius: radius.card,
                    backgroundColor: ink.surface,
                    borderWidth: 1,
                    borderColor: ink.border,
                    gap: space.sm,
                  }}
                >
                  <Text variant="eyebrow">The lesson</Text>
                  <Text variant="label" style={{ fontSize: size.bodyLg, lineHeight: size.bodyLg * 1.5 }}>
                    {s.lesson}
                  </Text>
                </View>
              </Enter>

              {/* The action, last. */}
              <Enter preset="blade" delay={1300}>
                <View
                  style={{
                    padding: space.xl,
                    borderRadius: radius.card,
                    backgroundColor: ink.raised,
                    borderWidth: 1,
                    borderColor: ink.border,
                    gap: space.sm,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                    <Blade state="active" length={14} delay={1400} />
                    <Text variant="eyebrow">Do this today</Text>
                  </View>
                  <Text variant="label" style={{ fontSize: size.bodyLg, lineHeight: size.bodyLg * 1.5 }}>
                    {s.action}
                  </Text>
                </View>
              </Enter>

              <Enter preset="pop" delay={1600}>
                <Button
                  label={`Ask ${s.master.name} about this`}
                  loading={createThread.isPending}
                  loadingLabel="Opening…"
                  onPress={() =>
                    createThread.mutate({
                      masterSlug: s.master.slug,
                      title: s.title,
                      originStoryId: s.id,
                    })
                  }
                />
                {createThread.isError ? (
                  <Text variant="caption" color="#E0483B" style={{ marginTop: space.sm }}>
                    That conversation didn&apos;t open. Try again.
                  </Text>
                ) : null}
              </Enter>
            </>
          )}
        </View>
      )}
    </Screen>
  );
}
