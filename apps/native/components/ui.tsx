import React from "react";
import {
  Pressable,
  type PressableProps,
  ScrollView,
  Text as RNText,
  type TextProps as RNTextProps,
  View,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ink, indigo, radius, size, space, text as textColor, font, tracking, leading, weight } from "@/theme/tokens";

/**
 * The primitives every screen is built from.
 *
 * Screens never reach for a raw hex or a raw font name — they pick a
 * semantic variant here, so the ink-dark language stays consistent and a
 * token change lands everywhere at once.
 */

export type TextVariant =
  /** Wide, uppercase, condensed. "TODAY'S TRIAL". */
  | "eyebrow"
  /** Small supporting copy and timestamps. */
  | "caption"
  /** Row labels and buttons. */
  | "label"
  /** Default body copy. */
  | "body"
  /** Slightly larger body, for lead paragraphs. */
  | "lead"
  /** Section headings. */
  | "title"
  /** Screen headings, Zen Old Mincho. */
  | "display"
  /** The largest hero type on a screen. */
  | "hero"
  /** A Master speaking. Always Zen Old Mincho. */
  | "voice"
  /** The user's own Bushido Code, in their hand. */
  | "hand"
  /** Numerals and counters. */
  | "numeral";

const VARIANT: Record<TextVariant, RNTextProps["style"]> = {
  eyebrow: {
    fontFamily: font.condensed,
    fontSize: size.eyebrow,
    letterSpacing: size.eyebrow * tracking.eyebrow,
    textTransform: "uppercase",
    color: textColor.muted,
  },
  caption: {
    fontFamily: font.sans,
    fontSize: size.caption,
    color: textColor.faint,
    lineHeight: size.caption * leading.body,
  },
  label: {
    fontFamily: font.sansBold,
    fontSize: size.label,
    color: textColor.body,
  },
  body: {
    fontFamily: font.sans,
    fontSize: size.body,
    color: textColor.faint,
    lineHeight: size.body * leading.body,
  },
  lead: {
    fontFamily: font.sans,
    fontSize: size.bodyLg,
    color: textColor.faint,
    lineHeight: size.bodyLg * leading.body,
  },
  title: {
    fontFamily: font.sansBold,
    fontSize: size.subtitle,
    color: textColor.primary,
    lineHeight: size.subtitle * leading.heading,
  },
  display: {
    fontFamily: font.mincho,
    fontSize: size.display,
    color: textColor.primary,
    lineHeight: size.display * leading.display,
    letterSpacing: size.display * tracking.tightest,
  },
  hero: {
    fontFamily: font.mincho,
    fontSize: size.hero,
    color: textColor.primary,
    lineHeight: size.hero * leading.display,
    letterSpacing: size.hero * tracking.tightest,
  },
  voice: {
    fontFamily: font.minchoRegular,
    fontSize: size.lead,
    color: textColor.body,
    lineHeight: size.lead * leading.relaxed,
  },
  hand: {
    fontFamily: font.hand,
    fontSize: size.title,
    color: textColor.secondary,
    lineHeight: size.title * leading.heading,
  },
  numeral: {
    fontFamily: font.condensed,
    fontSize: size.titleLg,
    color: textColor.primary,
    letterSpacing: size.titleLg * tracking.tight,
  },
};

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: string;
};

export function Text({ variant = "body", color, style, ...rest }: TextProps) {
  return <RNText style={[VARIANT[variant], color ? { color } : null, style]} {...rest} />;
}

export type ScreenProps = ViewProps & {
  /** Wraps content in a ScrollView. Off by default — most screens are fixed. */
  scroll?: boolean;
  /** Horizontal padding. The design uses 16 almost everywhere. */
  pad?: number;
  children?: React.ReactNode;
};

export function Screen({ scroll = false, pad = space.xl, style, children, ...rest }: ScreenProps) {
  const body = (
    <View style={[{ flex: 1, paddingHorizontal: pad }, style]} {...rest}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: ink.base }}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

export type ButtonVariant =
  /** Indigo fill. The one forward action on a screen. */
  | "primary"
  /** Outlined. Secondary choices. */
  | "secondary"
  /** No chrome. "I already have one", "Skip". */
  | "ghost"
  /** Green fill. Confirming a trial — and only that. */
  | "confirm"
  /** Red text. Backing out. */
  | "danger";

const BUTTON: Record<ButtonVariant, { container: ViewStyle; color: string }> = {
  primary: {
    container: { backgroundColor: indigo.base, minHeight: 56 },
    color: textColor.primary,
  },
  secondary: {
    container: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: ink.border,
      minHeight: 52,
    },
    color: textColor.body,
  },
  ghost: {
    container: { backgroundColor: "transparent", minHeight: 44 },
    color: textColor.muted,
  },
  confirm: {
    container: { backgroundColor: "#1F7A4F", minHeight: 56 },
    color: "#F2FFF7",
  },
  danger: {
    container: { backgroundColor: "transparent", minHeight: 44 },
    color: "#E0483B",
  },
};

export type ButtonProps = Omit<PressableProps, "children"> & {
  label: string;
  variant?: ButtonVariant;
  /** Rendered to the left of the label. */
  icon?: React.ReactNode;
  full?: boolean;
};

export function Button({
  label,
  variant = "primary",
  icon,
  full = true,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const spec = BUTTON[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={(state) => [
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: space.sm,
          borderRadius: radius.pill,
          paddingHorizontal: space.section,
          alignSelf: full ? "stretch" : "flex-start",
          opacity: disabled ? 0.45 : state.pressed ? 0.82 : 1,
        },
        spec.container,
        typeof style === "function" ? style(state) : style,
      ]}
      {...rest}
    >
      {icon}
      <Text
        style={{
          fontFamily: font.sansBold,
          fontSize: variant === "ghost" ? size.body : size.bodyLg,
          color: spec.color,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export type CardProps = ViewProps & {
  /** Raised cards sit above the screen; flat ones sit on it. */
  raised?: boolean;
  bordered?: boolean;
  children?: React.ReactNode;
};

export function Card({ raised = false, bordered = true, style, children, ...rest }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: raised ? ink.raised : ink.surface,
          borderRadius: radius.card,
          padding: space.xl,
          borderWidth: bordered ? 1 : 0,
          borderColor: ink.border,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

/** Vertical rhythm helper, so screens don't litter marginTop everywhere. */
export function Gap({ size: h = space.base }: { size?: number }) {
  return <View style={{ height: h }} />;
}

export { weight };
