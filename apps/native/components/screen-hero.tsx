import React from "react";
import { View } from "react-native";

import { Enter } from "@/components/motion";
import { Text } from "@/components/ui";
import { space, text as textColor } from "@/theme/tokens";

/**
 * The opening of a screen: an eyebrow, a headline, an optional line of
 * context, and an optional visual anchor — a face, an icon, a number —
 * that gives the eye somewhere to land before it reads anything (D-043,
 * `plans/08-visual-craft.md`).
 *
 * Extracted from what made welcome (`app/(auth)/welcome.tsx`) read as
 * considered rather than functional: a strong opening, one clear line of
 * context under it, and something to look at rather than only text. Most
 * app-shell screens had the headline and stopped there. This is that shape
 * as one component, so the next screen reaches for it instead of
 * re-deriving the pattern — or drifting from it.
 */
export function ScreenHero({
  eyebrow,
  eyebrowColor = textColor.secondary,
  title,
  lead,
  visual,
  delay = 0,
}: {
  eyebrow?: string;
  eyebrowColor?: string;
  title: string;
  lead?: string;
  /** A face, an icon badge, a stat — sits to the right of the title. */
  visual?: React.ReactNode;
  delay?: number;
}) {
  return (
    <Enter preset="drop" delay={delay}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space.base }}>
        <View style={{ flex: 1, gap: space.xxs }}>
          {eyebrow ? (
            <Text variant="eyebrow" color={eyebrowColor}>
              {eyebrow}
            </Text>
          ) : null}
          <Text variant="display">{title}</Text>
          {lead ? (
            <Text
              variant="lead"
              color={textColor.muted}
              style={{ marginTop: space.xs, fontSize: 15 }}
            >
              {lead}
            </Text>
          ) : null}
        </View>
        {visual ? <View style={{ paddingTop: 2 }}>{visual}</View> : null}
      </View>
    </Enter>
  );
}
