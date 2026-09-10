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

import { ambient, duration, easing, restraint, stagger as staggerScale } from "@/theme/motion";

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

/**
 * Motion tone.
 *
 * `restrained` is the default and what almost every screen gets: a fade and a
 * few pixels of rise, nothing from the side, delays compressed (D-031).
 * `expressive` is the original choreography, kept whole for the three places
 * the owner asked to keep it — the forging screen and the two paywalls. A new
 * screen is calm unless it opts out, never the other way round.
 */
export type MotionToneName = "restrained" | "expressive";

const MotionToneContext = React.createContext<MotionToneName>("restrained");

export function MotionTone({
  value,
  children,
}: {
  value: MotionToneName;
  children: React.ReactNode;
}) {
  return <MotionToneContext.Provider value={value}>{children}</MotionToneContext.Provider>;
}

export function useMotionTone(): MotionToneName {
  return React.useContext(MotionToneContext);
}

/** A fade with a small vertical settle. The only restrained shape. */
function settle(y: number) {
  return () =>
    FadeInUp.duration(restraint.duration)
      .easing(easing.out)
      .withInitialValues({ opacity: 0, transform: [{ translateY: y }] });
}

const calmFade = () => FadeIn.duration(restraint.duration).easing(easing.out);
const calmRise = settle(restraint.rise);
const calmDrop = settle(-restraint.drop);

/**
 * Every preset name still exists, so no screen had to change to become calm —
 * but each now resolves to one of three shapes. Lateral presets deliberately
 * lose their direction: nothing enters from the left or the right.
 */
const ENTER_RESTRAINED: Record<EnterPreset, () => any> = {
  rise: calmRise,
  drop: calmDrop,
  pop: calmFade,
  bounce: calmFade,
  fade: calmFade,
  slideLeft: calmRise,
  slideRight: calmRise,
  slideUp: calmRise,
  slideDown: calmDrop,
  zoom: calmFade,
  zoomSpin: calmFade,
  zoomUp: calmRise,
  blade: calmFade,
  flip: calmRise,
  streak: calmFade,
  roll: calmRise,
  swing: calmRise,
  pinwheel: calmFade,
};

const calmExit = () => FadeOut.duration(restraint.exit).easing(easing.in);

const EXIT_RESTRAINED: Record<ExitPreset, () => any> = {
  fade: calmExit,
  riseOut: calmExit,
  dropOut: calmExit,
  shrink: calmExit,
  slideLeft: calmExit,
  slideRight: calmExit,
  slideUp: calmExit,
  slideDown: calmExit,
};

/** The original choreography. Expressive tone only. */
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

export function entering(preset: EnterPreset, delay = 0, tone: MotionToneName = "restrained") {
  const calm = tone === "restrained";
  const anim = (calm ? ENTER_RESTRAINED : ENTER)[preset]() as Builder;
  // Screens were written with delays tuned for the expressive tone. Scaling
  // them here, once, compresses every screen without touching any of them.
  const d = calm ? Math.round(delay * restraint.delayScale) : delay;
  return d > 0 ? anim.delay(d) : anim;
}

export function exiting(preset: ExitPreset, delay = 0, tone: MotionToneName = "restrained") {
  const anim = (tone === "restrained" ? EXIT_RESTRAINED : EXIT)[preset]() as Builder;
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
  const tone = useMotionTone();
  return (
    <Animated.View
      entering={entering(preset, delay, tone)}
      exiting={exiting(exitPreset, 0, tone)}
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
  const calm = useMotionTone() === "restrained";
  const peakScale = calm ? restraint.flameScale : ambient.flameFlicker.scale;
  const peakRotate = calm ? restraint.flameRotate : ambient.flameFlicker.rotate;
  React.useEffect(() => {
    if (!enabled) return;
    // Under restraint the flame breathes over twice the time rather than
    // flickering — alive, not agitated.
    const half = (calm ? ambient.flameFlicker.duration * 2 : ambient.flameFlicker.duration) / 2;
    s.value = withRepeat(
      withSequence(
        withTiming(peakScale, { duration: half, easing: easing.inOut }),
        withTiming(1, { duration: half, easing: easing.inOut }),
      ),
      -1,
      false,
    );
    r.value = withRepeat(
      withSequence(
        withTiming(peakRotate, { duration: half, easing: easing.inOut }),
        withTiming(0, { duration: half, easing: easing.inOut }),
      ),
      -1,
      false,
    );
  }, [enabled, s, r, calm, peakScale, peakRotate]);
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
  const calm = useMotionTone() === "restrained";
  React.useEffect(() => {
    v.value = calm
      ? withDelay(
          Math.round(delay * restraint.delayScale),
          withTiming(1, { duration: restraint.duration, easing: easing.out }),
        )
      : withDelay(delay, withTiming(1, { duration: duration.base, easing: easing.overshoot }));
  }, [delay, v, calm]);
  return useAnimatedStyle(() => ({
    opacity: v.value,
    // No scale at all under restraint — the mark fades in where it will stay.
    transform: [{ scale: calm ? 1 : 0.94 + v.value * 0.06 }],
  }));
}

export { Animated };
