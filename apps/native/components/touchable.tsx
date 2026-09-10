import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, type PressableProps, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { duration, easing, spring } from "@/theme/motion";

/**
 * The pressable is itself the animated element.
 *
 * It used to wrap an inner Animated.View that carried the style. That left the
 * Pressable sizing to its content, so a caller's `flex: 1` resolved against a
 * parent with no width and the whole control collapsed to nothing — which is
 * how the 4/4 reminder chips rendered with no visible label. With one element,
 * layout props go where layout happens.
 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * The app's press interaction.
 *
 * Entry animations tell you a screen arrived; these tell you the screen
 * heard you. Every tappable surface uses one, so pressure feels consistent
 * whether you are marking a trial complete or opening a story.
 *
 * Haptics are matched to consequence rather than fired uniformly: a
 * confirmation is a heavier tap than opening a row, and a refusal is the
 * warning pattern, so the hand learns the difference before the eye does.
 */

export type PressFeel =
  /** Rows, cards, list items. Subtle. */
  | "row"
  /** Primary buttons. A firmer squeeze. */
  | "button"
  /** Confirming a trial. Heaviest, with success haptics. */
  | "confirm"
  /** Backing out or a refused action. */
  | "danger"
  /** Chips and toggles. Quick and springy. */
  | "chip"
  /** No feedback — for surfaces that are only pressable to dismiss. */
  | "none";

const FEEL: Record<
  Exclude<PressFeel, "none">,
  { scale: number; opacity: number; haptic: () => void }
> = {
  row: {
    scale: 0.985,
    opacity: 0.9,
    haptic: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  },
  button: {
    scale: 0.96,
    opacity: 0.92,
    haptic: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  },
  confirm: {
    scale: 0.94,
    opacity: 1,
    haptic: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  },
  danger: {
    scale: 0.96,
    opacity: 0.9,
    haptic: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  },
  chip: {
    scale: 0.92,
    opacity: 1,
    haptic: () => void Haptics.selectionAsync(),
  },
};

export type TouchableProps = Omit<PressableProps, "style"> & {
  feel?: PressFeel;
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
};

export function Touchable({
  feel = "row",
  style,
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  children,
  ...rest
}: TouchableProps) {
  const scale = useSharedValue<number>(1);
  const opacity = useSharedValue<number>(1);
  const spec = feel === "none" ? null : FEEL[feel];

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      style={[style, animated, disabled ? { opacity: 0.45 } : null]}
      onPressIn={(e) => {
        if (spec && !disabled) {
          scale.value = withSpring(spec.scale, spring.snappy);
          opacity.value = withTiming(spec.opacity, { duration: duration.instant });
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, spring.snappy);
        opacity.value = withTiming(1, { duration: duration.fast, easing: easing.out });
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (spec && !disabled) spec.haptic();
        onPress?.(e);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
