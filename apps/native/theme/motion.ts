import { Easing } from "react-native-reanimated";

/**
 * Motion tokens.
 *
 * The standalone design file could not express real motion — it carries only
 * six CSS keyframes (softPulse, driftGlow, sheen, flameFlicker, riseIn,
 * breathe). Everything here is the native expansion of that vocabulary:
 * the same feel, but with the entry/exit choreography the onboarding needs.
 *
 * The rule the timings encode: a screen never arrives all at once. Elements
 * land in reading order, each with its own delay and its own kind of arrival,
 * so the eye is led down the screen rather than shown a finished page.
 */

export const duration = {
  /** Blade marks, checkmarks, toggles. */
  instant: 120,
  fast: 180,
  /** The default for most element entries. */
  base: 280,
  /** Headings and hero type. */
  slow: 420,
  /** Full-screen transitions. */
  screen: 520,
  /** Deliberate, ceremonial moments — the forging screen, unlocks. */
  ritual: 900,
} as const;

/** Delay ladder. Elements step down the screen on these beats. */
export const stagger = {
  tight: 40,
  base: 70,
  loose: 110,
  dramatic: 170,
} as const;

export const easing = {
  /** Decelerate — the default for things arriving. */
  out: Easing.bezier(0.16, 1, 0.3, 1),
  /** Accelerate — the default for things leaving. */
  in: Easing.bezier(0.7, 0, 0.84, 0),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  /** Slight overshoot, for pops and confirmations. */
  overshoot: Easing.bezier(0.34, 1.56, 0.64, 1),
  linear: Easing.linear,
} as const;

/** Spring configs, for anything that should feel physical rather than timed. */
export const spring = {
  /** General purpose — cards, rows, chips. */
  gentle: { damping: 18, stiffness: 160, mass: 1 },
  /** Snappier, for taps and toggles. */
  snappy: { damping: 20, stiffness: 300, mass: 0.8 },
  /** Loose and bouncy — pop-ins, the streak flame, earned badges. */
  bouncy: { damping: 12, stiffness: 220, mass: 0.9 },
  /** Heavy and slow, for large panels. */
  weighty: { damping: 24, stiffness: 120, mass: 1.4 },
} as const;

/** Travel distances for slide entries, in px. */
export const travel = {
  /** The design's own riseIn distance. */
  rise: 14,
  sm: 24,
  md: 48,
  lg: 96,
  /** Off-screen, for full-width slides. */
  screen: 428,
} as const;

/** Looping ambient animations carried over from the design's keyframes. */
export const ambient = {
  softPulse: { from: 0.35, to: 1, duration: 2200 },
  breathe: { duration: 2600, spread: 6 },
  sheen: { duration: 1800, from: -1.2, to: 3.2 },
  flameFlicker: { duration: 900, scale: 1.12, rotate: -4 },
  driftGlow: { duration: 6000 },
} as const;

/**
 * Restraint — the default tone since session 4.
 *
 * The owner's verdict on the original choreography: over the top for an app
 * that is meant to be serious. Under the restrained tone every entry is a
 * fade with at most a few pixels of vertical travel, nothing moves in from
 * the side, and every delay a screen asks for is compressed.
 *
 * Measured against what it replaced:
 *   duration   280–900ms  ->  220ms
 *   travel     25px, full-width slides  ->  6px, never horizontal
 *   delays     as written  ->  40% of as written
 *   overshoot, bounce, spin, flip  ->  none
 *
 * The original presets survive behind the expressive tone, which only the
 * forging screen and the paywalls opt into (D-031).
 */
export const restraint = {
  duration: 220,
  exit: 140,
  /** Pixels an element rises into place. */
  rise: 6,
  /** Pixels a header settles down into place. */
  drop: 4,
  /** Multiplier on every delay a screen passes in. */
  delayScale: 0.4,
  /** A calmer streak flame: a breath rather than a flicker. */
  flameScale: 1.04,
  flameRotate: 0,
} as const;

export const motion = {
  restraint,
  duration,
  stagger,
  easing,
  spring,
  travel,
  ambient,
} as const;
