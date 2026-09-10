import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { TextInput, View } from "react-native";

import { Touchable } from "@/components/touchable";
import { Enter, Stagger } from "@/components/motion";
import { ScreenHero } from "@/components/screen-hero";
import { Screen, Text } from "@/components/ui";
import { Chevron, Icon, IconBadge } from "@/components/icon";
import { trpc } from "@/utils/trpc";
import { gold, indigo, ink, radius, size, space, text as textColor } from "@/theme/tokens";

/**
 * 16 · The Adversity Library.
 *
 * Locked stories are shown, not hidden — seeing the wound you have not
 * earned access to is the mechanic, so a Pro row renders with its title and
 * a gold blade rather than being filtered out.
 *
 * The header now says what this actually is (plan 08 — it opened with just
 * the word "Adversity" and nothing else), the search field carries its own
 * icon rather than reading as a bare pill, and "Most searched" leads with
 * a featured story instead of three rows identical to every other row.
 */
export default function AdversityScreen() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  const categories = useQuery(trpc.library.categories.queryOptions());
  const mostSearched = useQuery(trpc.library.mostSearched.queryOptions());

  const storyCount = React.useMemo(
    () => (categories.data ?? []).reduce((n, c) => n + c.stories.length, 0),
    [categories.data],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories.data ?? [];
    return (categories.data ?? [])
      .map((c) => ({ ...c, stories: c.stories.filter((s) => s.title.toLowerCase().includes(q)) }))
      .filter((c) => c.stories.length > 0);
  }, [categories.data, query]);

  const [featured, ...restSearched] = mostSearched.data ?? [];

  return (
    <Screen scroll>
      <View style={{ gap: space.section, paddingVertical: space.xl }}>
        <ScreenHero
          eyebrow={storyCount ? `${storyCount} stories` : "The library"}
          title="Adversity"
          lead="People who faced what you're facing, and what a Master told them to do about it."
          visual={<IconBadge name="library-outline" color={indigo.light} size={44} />}
        />

        <Enter preset="rise" delay={140}>
          <View style={{ position: "relative", justifyContent: "center" }}>
            <View style={{ position: "absolute", left: space.xl, zIndex: 1 }}>
              <Icon name="search" size={17} color={textColor.faintest} />
            </View>
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
                paddingLeft: space.xl + 24,
                paddingRight: space.xl,
                paddingVertical: space.base + 2,
                color: textColor.body,
                fontSize: size.body,
              }}
            />
          </View>
        </Enter>

        {!query && featured ? (
          <Enter preset="rise" delay={300}>
            <View style={{ gap: space.base }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                <Icon name="flame" size={15} color={gold.base} />
                <Text variant="eyebrow" color={gold.base}>
                  Most searched
                </Text>
              </View>

              {/* The featured story — a real hero row, not one more list item. */}
              <Touchable
                feel="row"
                onPress={() => router.push(`/story/${featured.slug}`)}
                style={{
                  padding: space.xl,
                  borderRadius: radius.panel,
                  backgroundColor: gold.tint,
                  borderWidth: 1.5,
                  borderColor: gold.tintAlt,
                  gap: space.sm,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.base }}>
                  <IconBadge
                    name={featured.locked ? "lock-closed" : "book"}
                    color={gold.base}
                    background={ink.base}
                    size={40}
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="title" style={{ fontSize: size.lead }}>
                      {featured.title}
                    </Text>
                    <Text variant="caption" color={textColor.secondaryDim}>
                      {featured.master.name} · {featured.readSeconds}s
                    </Text>
                  </View>
                  {featured.locked ? (
                    <Text variant="eyebrow" color={gold.base}>
                      Pro
                    </Text>
                  ) : (
                    <Chevron color={gold.base} />
                  )}
                </View>
              </Touchable>

              {restSearched.length ? (
                <Stagger initialDelay={460} step={80} style={{ gap: space.md }}>
                  {restSearched.map((s) => (
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
              ) : null}
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
    <Touchable
      feel="row"
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.base,
        padding: space.xl,
        borderRadius: radius.card,
        backgroundColor: ink.surface,
        borderWidth: 1,
        borderColor: locked ? gold.tintAlt : ink.border,
      }}
    >
      <IconBadge
        name={locked ? "lock-closed" : "book-outline"}
        color={locked ? gold.base : indigo.light}
        background={locked ? gold.tint : ink.raised}
        size={36}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label" style={{ fontSize: size.body }}>
          {title}
        </Text>
        <Text variant="caption">{meta}</Text>
      </View>
      {locked ? (
        <Text variant="eyebrow" color={gold.base}>
          Pro
        </Text>
      ) : (
        <Chevron color={indigo.light} />
      )}
    </Touchable>
  );
}
