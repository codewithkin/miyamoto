/**
 * Design tokens extracted from designs/Miyamoto-standalone.html.
 *
 * The design is ink-dark only — there is no light theme, and screens are
 * authored against a 428x908 frame. Values here are the literal ones used
 * across the 23 artboards, grouped into roles so screens never hardcode hex.
 */

/** Backgrounds, darkest to lightest. */
export const ink = {
  /** Page behind the frame. */
  void: "#08080A",
  /** Default screen background. */
  base: "#101012",
  /** Cards resting on the screen. */
  surface: "#18181D",
  surfaceDim: "#16161B",
  /** Raised cards, list rows. */
  raised: "#1C1C22",
  raisedAlt: "#1F1F26",
  /** Pressed states, inset wells, input fields. */
  high: "#24242C",
  highAlt: "#272730",
  /** Hairlines and card borders. */
  border: "#2E2E38",
  borderDim: "#2A2A34",
} as const;

/** Foreground text, brightest to dimmest. */
export const text = {
  /** Headings and primary copy. */
  primary: "#F5F4FE",
  /** Body copy on dark surfaces. */
  body: "#F1F0FA",
  bodyDim: "#EDEBF5",
  /** Secondary copy with an indigo cast. */
  secondary: "#D8D6F2",
  secondaryDim: "#B9B6D6",
  /** Muted labels, timestamps, helper text. */
  muted: "#A6A4B8",
  mutedDim: "#9C9AAB",
  /** Lowest-contrast supporting text. */
  faint: "#9A98AD",
  faintest: "#918FA4",
} as const;

/** Indigo — progress, the Path, primary actions. */
export const indigo = {
  /** Primary button fill, progress bars. */
  base: "#4B49B8",
  /** Glows, focus rings, active accents. */
  bright: "#6C69E0",
  brightAlt: "#6A67DC",
  /** Links, active labels, master accents. */
  light: "#A9A6F5",
  lighter: "#B3B0FF",
  lightest: "#C9C2F5",
  /** Pressed / deep fills. */
  deep: "#3E3C9E",
  /** Tinted backgrounds. */
  tint: "#242030",
  tintAlt: "#2A2635",
  tintDeep: "#231F2C",
  tintDeepest: "#14121F",
  surface: "#322D45",
} as const;

/** Green — confirming a trial, completion, success. */
export const green = {
  base: "#1F7A4F",
  /** Text/icon on a green tint. */
  fg: "#F2FFF7",
  /** Tinted background behind confirmations. */
  tint: "#1A231C",
} as const;

/** Red — backing out, destructive, live indicators. */
export const red = {
  base: "#E0483B",
  /** Google brand red, sign-in button only. */
  google: "#EA4335",
  tint: "#5C2E28",
} as const;

/** Gold — rare, earned, premium. Used sparingly. */
export const gold = {
  base: "#E0BE63",
  deep: "#C9A227",
  tint: "#241F13",
  tintAlt: "#38301C",
  tintDeep: "#332B18",
  tintDeepest: "#2A2415",
} as const;

/** Paper — the Master's written voice on a light ground. */
export const paper = {
  base: "#F4F2ED",
} as const;

/** Translucent overlays, layered over ink. */
export const alpha = {
  white035: "rgba(255,255,255,0.035)",
  white08: "rgba(255,255,255,0.08)",
  white10: "rgba(255,255,255,0.1)",
  white12: "rgba(255,255,255,0.12)",
  white14: "rgba(255,255,255,0.14)",
  white16: "rgba(255,255,255,0.16)",
  white25: "rgba(255,255,255,0.25)",
  white35: "rgba(255,255,255,0.35)",
  /** Scrims behind sheets and modals. */
  scrim: "rgba(4,5,9,0.72)",
  scrimSoft: "rgba(0,0,0,0.35)",
  scrimHard: "rgba(0,0,0,0.62)",
  /** Chips floating on imagery. */
  chip: "rgba(30,32,48,0.9)",
  chipSoft: "rgba(30,32,48,0.8)",
  chipInk: "rgba(20,20,26,0.8)",
  /** Indigo glows. */
  indigo16: "rgba(108,105,224,0.16)",
  indigo42: "rgba(108,105,224,0.42)",
  indigo45: "rgba(108,105,224,0.45)",
  indigo50: "rgba(108,105,224,0.5)",
  indigo00: "rgba(108,105,224,0)",
  /** Gold glow for earned states. */
  gold18: "rgba(201,162,39,0.18)",
  gold00: "rgba(201,162,39,0)",
} as const;

/**
 * Four families, each with a job:
 * - mincho: a Master's voice and display headings
 * - sans: all UI copy
 * - condensed: eyebrow labels, numerals, section markers
 * - hand: the user's own Bushido Code
 */
export const font = {
  mincho: "ZenOldMincho_600SemiBold",
  minchoRegular: "ZenOldMincho_400Regular",
  sans: "DMSans_400Regular",
  sansMedium: "DMSans_500Medium",
  sansBold: "DMSans_700Bold",
  condensed: "BarlowCondensed_600SemiBold",
  condensedMedium: "BarlowCondensed_500Medium",
  hand: "Caveat_400Regular",
  mono: "ui-monospace",
} as const;

/** Type scale, in px, as used across the artboards. */
export const size = {
  micro: 9,
  eyebrow: 11,
  caption: 12,
  label: 13,
  small: 14,
  body: 15,
  bodyLg: 16,
  lead: 17,
  subtitle: 19,
  title: 22,
  titleLg: 26,
  display: 28,
  displayLg: 32,
  hero: 34,
  heroLg: 46,
} as const;

export const weight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  heavy: "800",
} as const;

export const tracking = {
  /** Wide eyebrow labels: TODAY'S TRIAL, ONE TIME · 60% OFF. */
  eyebrow: 0.2,
  wide: 0.16,
  label: 0.08,
  mono: 0.06,
  /** Negative tracking on large display type. */
  tight: -0.01,
  tighter: -0.02,
  tightest: -0.03,
} as const;

export const leading = {
  display: 1.1,
  heading: 1.25,
  body: 1.55,
  relaxed: 1.6,
} as const;

/**
 * Radii. `blade` is the 2px cut used by every blade mark and progress
 * segment — it is the most-used radius in the design and the reason the
 * UI reads as edged rather than soft.
 */
export const radius = {
  blade: 2,
  xs: 4,
  sm: 6,
  md: 12,
  lg: 14,
  card: 18,
  cardLg: 20,
  sheet: 22,
  panel: 26,
  pill: 999,
  circle: "50%",
} as const;

/** 4px base, matching the padding rhythm in the artboards. */
export const space = {
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 10,
  base: 12,
  lg: 14,
  xl: 16,
  xxl: 18,
  section: 22,
  screen: 26,
} as const;

/** Screen frame the design was authored against. */
export const frame = {
  width: 428,
  height: 908,
} as const;

export const tokens = {
  ink,
  text,
  indigo,
  green,
  red,
  gold,
  paper,
  alpha,
  font,
  size,
  weight,
  tracking,
  leading,
  radius,
  space,
  frame,
} as const;

export type Tokens = typeof tokens;
