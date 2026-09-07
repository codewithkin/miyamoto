import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, TextInput, View } from "react-native";

import { Blade } from "@/components/blade";
import { Enter, Stagger } from "@/components/motion";
import { Screen, Text } from "@/components/ui";
import { trpc } from "@/utils/trpc";
import { gold, indigo, ink, radius, size, space, text as textColor } from "@/theme/tokens";

/**
 * 16 · The Adversity Library.
 *
 * Locked stories are shown, not hidden — seeing the wound you have not
 * earned access to is the mechanic, so a Pro row renders with its title and
 * a gold blade rather than being filtered out.
 */
export default function AdversityScreen() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  const categories = useQuery(trpc.library.categories.queryOptions());
  const mostSearched = useQuery(trpc.library.mostSearched.queryOptions());

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories.data ?? [];
    return (categories.data ?? [])
      .map((c) => ({ ...c, stories: c.stories.filter((s) => s.title.toLowerCase().includes(q)) }))
      .filter((c) => c.stories.length > 0);
  }, [categories.data, query]);

  return (
    <Screen scroll>
      <View style={{ gap: space.section, paddingVertical: space.xl }}>
        <Enter preset="drop">
          <Text variant="display">Adversity</Text>
        </Enter>

        <Enter preset="rise" delay={140}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="breakup, fired, anxiety, lazy…"
            placeholderTextColor={textColor.faintest}
            style={{
              borderRadius: radius.pill,
              backgroundColor: ink.high,
              borderWidth: 1,
              borderColor: ink.border,
              paddingHorizontal: space.xl,
              paddingVertical: space.base,
              color: textColor.body,
              fontSize: size.body,
            }}
          />
        </Enter>

        {!query && mostSearched.data?.length ? (
          <Enter preset="rise" delay={300}>
            <View style={{ gap: space.base }}>
              <Text variant="eyebrow">Most searched</Text>
              <Stagger initialDelay={380} step={80} style={{ gap: space.md }}>
                {mostSearched.data.map((s) => (
                  <Enter key={s.id} preset="roll">
                    <StoryRow
                      title={s.title}
                      meta={`${s.master.name} · ${s.readSeconds}s`}
                      locked={s.locked}
                      onPress={() => router.push(`/story/${s.slug}`)}
                    />
                  </Enter>
                ))}
              </Stagger>
            </View>
          </Enter>
        ) : null}

        {filtered.map((c, ci) => (
          <Enter key={c.id} preset="rise" delay={520 + ci * 120}>
            <View style={{ gap: space.base }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text variant="eyebrow" style={{ flex: 1 }}>
                  {c.name}
                </Text>
                <Text variant="caption">{c.stories.length} stories</Text>
              </View>

              <Stagger initialDelay={580 + ci * 120} step={70} style={{ gap: space.md }}>
                {c.stories.map((s) => (
                  <Enter key={s.id} preset="slideLeft">
                    <StoryRow
                      title={s.title}
                      meta={`${s.master.name} · ${s.readSeconds}s`}
                      locked={s.locked}
                      onPress={() => router.push(`/story/${s.slug}`)}
                    />
                  </Enter>
                ))}
              </Stagger>
            </View>
          </Enter>
        ))}
      </View>
    </Screen>
  );
}

function StoryRow({
  title,
  meta,
  locked,
  onPress,
}: {
  title: string;
  meta: string;
  locked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: space.base,
        padding: space.xl,
        borderRadius: radius.card,
        backgroundColor: ink.surface,
        borderWidth: 1,
        borderColor: locked ? gold.tintAlt : ink.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Blade state={locked ? "locked" : "complete"} length={14} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label" style={{ fontSize: size.body }}>
          {title}
        </Text>
        <Text variant="caption">{meta}</Text>
      </View>
      <Text variant="eyebrow" color={locked ? gold.base : indigo.light}>
        {locked ? "Pro" : "›"}
      </Text>
    </Pressable>
  );
}
