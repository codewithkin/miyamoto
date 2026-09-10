import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, type ViewProps } from "react-native";

import { Animated, useLandIn, usePulse } from "@/components/motion";
import { alpha, gold, green, indigo, ink, radius, space } from "@/theme/tokens";

/**
 * Blade marks.
 *
 * The app has no dots, spinners or progress rings — every progress status is
 * a cut. A mark is a 2px-radius bar, and its state is carried by fill and
 * length rather than by a different shape, so a rail of them reads as one
 * continuous edge.
 *
 * Selection is the exception: see BladeTick, which is a real tick (D-037).
 */

export type BladeState =
  /** Not yet reached. */
  | "empty"
  /** In progress — pulses. */
  | "active"
  /** Done. */
  | "complete"
  /** Earned but not yet unlocked (a Master waiting on Day 14). */
  | "locked"
  /** A day that was missed. Breaks the rail. */
  | "broken";

const FILL: Record<BladeState, string> = {
  empty: alpha.white16,
  active: indigo.bright,
  complete: indigo.base,
  locked: gold.deep,
  broken: "#5C2E28",
};

export type BladeProps = ViewProps & {
  state?: BladeState;
  /** Bar length along its long axis. */
  length?: number;
  thickness?: number;
  vertical?: boolean;
  /** Entry delay, so a rail can deal itself out one mark at a time. */
  delay?: number;
  animated?: boolean;
};

export function Blade({
  state = "empty",
  length = 18,
  thickness = 4,
  vertical = false,
  delay = 0,
  animated = true,
  style,
  ...rest
}: BladeProps) {
  const land = useLandIn(delay);
  const pulse = usePulse(state === "active");

  const box = {
    width: vertical ? thickness : length,
    height: vertical ? length : thickness,
    borderRadius: radius.blade,
    backgroundColor: FILL[state],
  };

  if (!animated) return <View style={[box, style]} {...rest} />;

  return (
    <Animated.View
      style={[box, land, state === "active" ? pulse : null, style]}
      {...rest}
    />
  );
}

export type BladeRailProps = ViewProps & {
  /** How many marks in the rail. */
  count: number;
  /** How many are complete. */
  progress: number;
  /** Marks the currently active one, which pulses. */
  activeIndex?: number;
  /** Indexes that were missed. */
  brokenIndexes?: number[];
  vertical?: boolean;
  thickness?: number;
  gap?: number;
  /** Milliseconds between each mark landing. */
  step?: number;
  /** Delay before the first mark lands. */
  delay?: number;
};

/**
 * A row of marks. Used for the onboarding step indicator, the 30-day Path,
 * and the four Acts.
 */
export function BladeRail({
  count,
  progress,
  activeIndex,
  brokenIndexes = [],
  vertical = false,
  thickness = 4,
  gap = space.xxs,
  step = 40,
  delay = 0,
  style,
  ...rest
}: BladeRailProps) {
  const broken = React.useMemo(() => new Set(brokenIndexes), [brokenIndexes]);

  return (
    <View
      style={[
        {
          flexDirection: vertical ? "column" : "row",
          gap,
          alignItems: "stretch",
        },
        style,
      ]}
      {...rest}
    >
      {Array.from({ length: count }, (_, i) => {
        let state: BladeState = "empty";
        if (broken.has(i)) state = "broken";
        else if (i === activeIndex) state = "active";
        else if (i < progress) state = "complete";

        return (
          <View key={i} style={{ flex: 1 }}>
            <Blade
              state={state}
              vertical={vertical}
              thickness={thickness}
              length={vertical ? undefined : ("100%" as unknown as number)}
              delay={delay + i * step}
              style={vertical ? undefined : { width: "100%" }}
            />
          </View>
        );
      })}
    </View>
  );
}

export type BladeTickProps = {
  /** Selected / complete. Green, because green only ever means "yes, this". */
  done?: boolean;
  size?: number;
  delay?: number;
};

/**
 * The mark for "this is chosen" and "this is done".
 *
 * It used to be an angled cut in a green square, in keeping with the blade
 * vocabulary. The owner's reading of it was a green box with a slash — not
 * recognisable as selected at a glance, which is the only job it has. So this
 * is the one place the blade rule gives way (D-037): a filled green circle
 * with a checkmark when chosen, an empty ring when not. Blade marks still
 * carry progress everywhere else.
 */
export function BladeTick({ done = false, size = 22, delay = 0 }: BladeTickProps) {
  const land = useLandIn(delay);

  return (
    <Animated.View
      accessibilityRole="image"
      accessibilityLabel={done ? "Selected" : "Not selected"}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: done ? green.base : "transparent",
          borderWidth: done ? 0 : 1.5,
          borderColor: ink.border,
        },
        land,
      ]}
    >
      {done ? <Ionicons name="checkmark" size={Math.round(size * 0.68)} color={green.fg} /> : null}
    </Animated.View>
  );
}
