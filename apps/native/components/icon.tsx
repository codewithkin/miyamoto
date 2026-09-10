import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";

import { Touchable } from "@/components/touchable";
import { indigo, ink, radius, text as textColor } from "@/theme/tokens";

/**
 * Icons.
 *
 * Every navigation and action affordance in the app used to be a typed
 * character — "←", "›", "✕", "↑", "+", "▾". They rendered in whatever the
 * active font made of them, at text size, with text-sized hit areas. These
 * replace them with drawn icons at consistent sizes and a 44pt target.
 *
 * Ionicons, because it ships with Expo and is already the tab bar's set: one
 * visual vocabulary rather than two.
 */

export type IconName = React.ComponentProps<typeof Ionicons>["name"];

export function Icon({
  name,
  size = 20,
  color = textColor.muted,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}

/** The trailing mark on a row that opens something. */
export function Chevron({ color = textColor.faintest, size = 18 }: { color?: string; size?: number }) {
  return <Ionicons name="chevron-forward" size={size} color={color} />;
}

/**
 * A round icon button with a 44pt target — the smallest a thumb reliably
 * hits. Used for back, close and the chat composer's actions.
 */
export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  tone = "quiet",
  disabled,
  size = 40,
}: {
  name: IconName;
  onPress?: () => void;
  accessibilityLabel: string;
  /** quiet: a surface behind the icon. primary: indigo, for the one action. */
  tone?: "quiet" | "primary" | "bare";
  disabled?: boolean;
  size?: number;
}) {
  const background =
    tone === "primary" ? indigo.base : tone === "quiet" ? ink.raised : "transparent";
  const iconColor = tone === "primary" ? textColor.primary : textColor.body;

  return (
    <Touchable
      feel="chip"
      onPress={onPress}
      disabled={disabled}
      hitSlop={(44 - size) / 2 > 0 ? (44 - size) / 2 : 0}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={{
        width: size,
        height: size,
        borderRadius: radius.pill,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: background,
        borderWidth: tone === "quiet" ? 1 : 0,
        borderColor: ink.border,
      }}
    >
      <Ionicons name={name} size={Math.round(size * 0.5)} color={iconColor} />
    </Touchable>
  );
}

export function BackButton({ onPress }: { onPress: () => void }) {
  return <IconButton name="chevron-back" onPress={onPress} accessibilityLabel="Back" />;
}

export function CloseButton({
  onPress,
  accessibilityLabel = "Close",
}: {
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return <IconButton name="close" onPress={onPress} accessibilityLabel={accessibilityLabel} />;
}

/** A small icon set in a tinted circle, for list rows and feature lines. */
export function IconBadge({
  name,
  color = indigo.light,
  background = ink.raised,
  size = 32,
}: {
  name: IconName;
  color?: string;
  background?: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: background,
      }}
    >
      <Ionicons name={name} size={Math.round(size * 0.52)} color={color} />
    </View>
  );
}
