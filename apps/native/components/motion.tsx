import React, { Children, isValidElement } from "react";
import type { ViewProps } from "react-native";
import Animated, {
  BounceIn,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  FadeOutDown,
  FadeOutUp,
  FlipInXUp,
  LightSpeedInRight,
  PinwheelIn,
  RollInLeft,
  RotateInDownLeft,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
  SlideInUp,
  SlideOutDown,
  SlideOutLeft,
  SlideOutRight,
  SlideOutUp,
  StretchInY,
  ZoomIn,
  ZoomInEasyDown,
  ZoomInRotate,
  ZoomOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { ambient, duration, easing, stagger as staggerScale } from "@/theme/motion";

/**
 * Named entry/exit choreography.
 *
 * Screens declare intent — `rise`, `pop`, `blade` — rather than raw timing,
 * so a single screen can give every element its own arrival without any of
 * them hardcoding durations. Presets are built on Reanimated's layout
 * animations so exits are handled by the layout system and survive unmount.
 */
export type EnterPreset =
  /** The design's own riseIn: fade up a short distance. The default. */
  | "rise"
  /** Fade down from above — headers, eyebrows. */
  | "drop"
  /** Scale up with overshoot — confirmations, earned badges, blade marks. */
  | "pop"
  /** Hard bounce — the streak flame, celebratory counters. */
  | "bounce"
  /** Straight fade, no travel — backgrounds, scrims. */
  | "fade"
  /** Full-width slides, for screen-level content. */
  | "slideLeft"
  | "slideRight"
  | "slideUp"
  | "slideDown"
  /** Quiet zoom — cards and portraits. */
  | "zoom"
  /** Zoom in with a rotation kick — the forging screen, unlocks. */
  | "zoomSpin"
  /** Zoom up from below, softer than pop. */
  | "zoomUp"
  /** Vertical stretch — progress bars, the blade rail. */
  | "blade"
  /** Flips up around X — cards turning face-up. */
  | "flip"
  /** Fast horizontal streak — notifications, incoming messages. */
  | "streak"
  /** Rolls in from the left — list rows with personality. */
  | "roll"
  /** Rotates in from the lower left — heavier, ceremonial. */
  | "swing"
  /** Radial unfurl — the one-time offer, the Code reveal. */
  | "pinwheel";

export type ExitPreset =
  | "fade"
  | "riseOut"
  | "dropOut"
  | "shrink"
  | "slideLeft"
  | "slideRight"
  | "slideUp"
  | "slideDown";

type Builder = { delay: (ms: number) => any };

const ENTER: Record<EnterPreset, () => any> = {
  rise: () => FadeInDown.duration(duration.base).easing(easing.out),
  drop: () => FadeInUp.duration(duration.base).easing(easing.out),
  pop: () => ZoomIn.springify().damping(12).stiffness(220).mass(0.9),
  bounce: () => BounceIn.duration(duration.slow),
  fade: () => FadeIn.duration(duration.slow).easing(easing.out),
  slideLeft: () => SlideInLeft.duration(duration.screen).easing(easing.out),
  slideRight: () => SlideInRight.duration(duration.screen).easing(easing.out),
  slideUp: () => SlideInUp.duration(duration.screen).easing(easing.out),
  slideDown: () => SlideInDown.duration(duration.screen).easing(easing.out),
  zoom: () => ZoomIn.duration(duration.slow).easing(easing.out),
  zoomSpin: () => ZoomInRotate.duration(duration.ritual).easing(easing.out),
  zoomUp: () => ZoomInEasyDown.duration(duration.slow).easing(easing.out),
  blade: () => StretchInY.duration(duration.base).easing(easing.overshoot),
  flip: () => FlipInXUp.duration(duration.slow),
  streak: () => LightSpeedInRight.duration(duration.base),
  roll: () => RollInLeft.duration(duration.slow),
  swing: () => RotateInDownLeft.duration(duration.slow),
  pinwheel: () => PinwheelIn.duration(duration.ritual),
};

const EXIT: Record<ExitPreset, () => any> = {
  fade: () => FadeOut.duration(duration.fast).easing(easing.in),
  riseOut: () => FadeOutUp.duration(duration.base).easing(easing.in),
  dropOut: () => FadeOutDown.duration(duration.base).easing(easing.in),
  shrink: () => ZoomOut.duration(duration.fast).easing(easing.in),
  slideLeft: () => SlideOutLeft.duration(duration.base).easing(easing.in),
  slideRight: () => SlideOutRight.duration(duration.base).easing(easing.in),
  slideUp: () => SlideOutUp.duration(duration.base).easing(easing.in),
  slideDown: () => SlideOutDown.duration(duration.base).easing(easing.in),
};

export function entering(preset: EnterPreset, delay = 0) {
  const anim = ENTER[preset]() as Builder;
  return delay > 0 ? anim.delay(delay) : anim;
}

export function exiting(preset: ExitPreset, delay = 0) {
  const anim = EXIT[preset]() as Builder;
  return delay > 0 ? anim.delay(delay) : anim;
}

export type EnterProps = ViewProps & {
  preset?: EnterPreset;
  exitPreset?: ExitPreset;
  /** Milliseconds before this element begins arriving. */
  delay?: number;
  children?: React.ReactNode;
};

/**
 * Wraps one element in an entry animation.
 *
 * <Enter preset="pop" delay={240}>…</Enter>
 */
export function Enter({
  preset = "rise",
  exitPreset = "fade",
  delay = 0,
  children,
  ...rest
}: EnterProps) {
  return (
    <Animated.View
      entering={entering(preset, delay)}
      exiting={exiting(exitPreset)}
      {...rest}
    >
      {children}
    </Animated.View>
  );
}

export type StaggerProps = ViewProps & {
  /** Applied to any child that doesn't name its own preset. */
  preset?: EnterPreset;
  /** Delay before the first child arrives. */
  initialDelay?: number;
  /** Gap between consecutive children. */
  step?: number;
  children?: React.ReactNode;
};

/**
 * Walks its children and gives each one an increasing delay, so a column
 * lands top-to-bottom in reading order.
 *
 * A child that is already an <Enter> keeps its own preset and only receives
 * the computed delay — which lets one column mix arrivals:
 *
 *   <Stagger step={80}>
 *     <Enter preset="drop"><Eyebrow /></Enter>
 *     <Enter preset="rise"><Heading /></Enter>
 *     <Enter preset="pop"><Button /></Enter>
 *   </Stagger>
 */
export function Stagger({
  preset = "rise",
  initialDelay = 0,
  step = staggerScale.base,
  children,
  ...rest
}: StaggerProps) {
  let index = 0;
  const wrapped = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    const delay = initialDelay + index * step;
    index += 1;

    if (child.type === Enter) {
      const childProps = child.props as EnterProps;
      // An explicit delay on the child wins; otherwise take the ladder's.
      return React.cloneElement(child, {
        delay: childProps.delay ?? delay,
      } as Partial<EnterProps>);
    }

    return (
      <Enter preset={preset} delay={delay}>
        {child}
      </Enter>
    );
  });

  return <Animated.View {...rest}>{wrapped}</Animated.View>;
}

/** Opacity loop from the design's softPulse keyframe. Live dots, "typing…". */
export function usePulse(enabled = true) {
  const v = useSharedValue<number>(ambient.softPulse.to);
  React.useEffect(() => {
    if (!enabled) {
      v.value = 1;
      return;
    }
    v.value = withRepeat(
      withSequence(
        withTiming(ambient.softPulse.from, {
          duration: ambient.softPulse.duration / 2,
          easing: easing.inOut,
        }),
        withTiming(ambient.softPulse.to, {
          duration: ambient.softPulse.duration / 2,
          easing: easing.inOut,
        }),
      ),
      -1,
      false,
    );
  }, [enabled, v]);
  return useAnimatedStyle(() => ({ opacity: v.value }));
}

/** Scale + rotate loop from flameFlicker. The streak flame. */
export function useFlicker(enabled = true) {
  const s = useSharedValue<number>(1);
  const r = useSharedValue<number>(0);
  React.useEffect(() => {
    if (!enabled) return;
    const half = ambient.flameFlicker.duration / 2;
    s.value = withRepeat(
      withSequence(
        withTiming(ambient.flameFlicker.scale, { duration: half, easing: easing.inOut }),
        withTiming(1, { duration: half, easing: easing.inOut }),
      ),
      -1,
      false,
    );
    r.value = withRepeat(
      withSequence(
        withTiming(ambient.flameFlicker.rotate, { duration: half, easing: easing.inOut }),
        withTiming(0, { duration: half, easing: easing.inOut }),
      ),
      -1,
      false,
    );
  }, [enabled, s, r]);
  return useAnimatedStyle(() => ({
    transform: [{ scale: s.value }, { rotate: `${r.value}deg` }],
  }));
}

/** Horizontal sweep from the sheen keyframe. Runs across earned/premium rows. */
export function useSheen(enabled = true, width = 120) {
  const x = useSharedValue<number>(ambient.sheen.from * width);
  React.useEffect(() => {
    if (!enabled) return;
    x.value = withRepeat(
      withSequence(
        withTiming(ambient.sheen.to * width, {
          duration: ambient.sheen.duration,
          easing: easing.inOut,
        }),
        withTiming(ambient.sheen.from * width, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [enabled, width, x]);
  return useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
}

/** Delayed one-shot scale, for elements that should land after a beat. */
export function useLandIn(delay = 0) {
  const v = useSharedValue<number>(0);
  React.useEffect(() => {
    v.value = withDelay(delay, withTiming(1, { duration: duration.base, easing: easing.overshoot }));
  }, [delay, v]);
  return useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [{ scale: 0.94 + v.value * 0.06 }],
  }));
}

export { Animated };
