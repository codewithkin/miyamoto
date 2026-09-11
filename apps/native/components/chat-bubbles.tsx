import React from "react";
import { View, type ViewStyle } from "react-native";
import {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { MasterAvatar } from "@/components/master-avatar";
import { Animated, Enter } from "@/components/motion";
import { Text } from "@/components/ui";
import { indigo, ink, radius, size, space, text as textColor } from "@/theme/tokens";

/**
 * The chat, drawn as messages (plan 13).
 *
 * The person writes on the right, in a solid indigo bubble and their own
 * DM Sans. The Master writes on the left, in a raised ink bubble and Zen Old
 * Mincho, with their face at the foot of the group. That's the same
 * difference of voice as before (D-012), now with the shape and side every
 * messaging app has taught people to read. A charge is its own bubble under
 * the letter: it's a different thing from the letter, something to do
 * rather than something to read, and it gets its own shape.
 */

const BUBBLE_RADIUS = radius.cardLg;
/** The corner on the speaker's side, drawn tight like a tail. */
const TAIL = space.xs;
const AVATAR = 28;

export function UserBubble({ text, children }: { text: string; children?: React.ReactNode }) {
  return (
    <Enter preset="slideRight" style={{ alignItems: "flex-end", gap: space.xs }}>
      <View
        style={{
          maxWidth: "82%",
          backgroundColor: indigo.base,
          borderRadius: BUBBLE_RADIUS,
          borderBottomRightRadius: TAIL,
          paddingHorizontal: space.xl,
          paddingVertical: space.base,
        }}
      >
        <Text variant="body" color={textColor.primary} style={{ fontSize: size.bodyLg }}>
          {text}
        </Text>
      </View>
      {children}
    </Enter>
  );
}

/** The frame every Master bubble shares. */
export function masterBubbleStyle(extra?: ViewStyle): ViewStyle {
  return {
    backgroundColor: ink.raised,
    borderWidth: 1,
    borderColor: ink.border,
    borderRadius: BUBBLE_RADIUS,
    borderBottomLeftRadius: TAIL,
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
    ...extra,
  };
}

/**
 * One turn from a Master: the letter, then anything under it (the charge),
 * with the face beside the last bubble, as a group chat draws it.
 */
export function MasterGroup({
  slug,
  name,
  children,
}: {
  slug: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <Enter preset="rise" style={{ flexDirection: "row", alignItems: "flex-end", gap: space.sm }}>
      <MasterAvatar slug={slug} name={name} size={AVATAR} />
      <View style={{ flex: 1, maxWidth: "88%", gap: space.xs, alignItems: "flex-start" }}>
        {children}
      </View>
    </Enter>
  );
}

/**
 * Word by word, at a pace that reads as writing, never longer than a few
 * seconds overall however long the letter is.
 */
function useReveal(text: string, active: boolean, onDone?: () => void) {
  const words = React.useMemo(() => text.split(/(\s+)/), [text]);
  const [shown, setShown] = React.useState(active ? 0 : words.length);
  const done = shown >= words.length;
  const onDoneRef = React.useRef(onDone);
  onDoneRef.current = onDone;

  React.useEffect(() => {
    if (!active) {
      setShown(words.length);
      return;
    }
    // ~45 words a second, capped at five seconds for the whole letter.
    const tickMs = 40;
    const ticks = Math.max(1, Math.min(words.length / (45 * (tickMs / 1000)), 5000 / tickMs));
    const step = Math.max(1, Math.ceil(words.length / ticks));
    const timer = setInterval(() => {
      setShown((n) => {
        const next = Math.min(words.length, n + step);
        if (next >= words.length) clearInterval(timer);
        return next;
      });
    }, tickMs);
    return () => clearInterval(timer);
  }, [active, words.length]);

  React.useEffect(() => {
    if (done) onDoneRef.current?.();
  }, [done]);

  return { visible: done ? text : words.slice(0, shown).join(""), done };
}

/**
 * A Master's letter. `reveal` writes out a letter that has just arrived; one
 * from history appears whole. The server checks every letter before sending
 * any of it (D-012), so the text is final: this is how it's shown, not a
 * token stream.
 */
export function LetterBubble({
  text,
  reveal = false,
  onRevealed,
}: {
  text: string;
  reveal?: boolean;
  onRevealed?: () => void;
}) {
  const { visible, done } = useReveal(text, reveal, onRevealed);
  return (
    <View style={masterBubbleStyle()} accessible accessibilityLabel={text}>
      <Text variant="voice">
        {visible}
        {/* The pen, while writing. A plain nested span: nested text has no
            view of its own, so it can't carry an animated style. */}
        {!done ? <Text variant="voice" color={indigo.light}> ▍</Text> : null}
      </Text>
    </View>
  );
}

function Dot({ delay }: { delay: number }) {
  const v = useSharedValue(0);
  React.useEffect(() => {
    v.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 320 }),
          withTiming(0, { duration: 320 }),
          withTiming(0, { duration: 260 }),
        ),
        -1,
      ),
    );
  }, [delay, v]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + 0.65 * v.value,
    transform: [{ translateY: -4 * v.value }],
  }));
  return (
    <Animated.View
      style={[
        { width: 8, height: 8, borderRadius: 4, backgroundColor: indigo.light },
        style,
      ]}
    />
  );
}

/**
 * The wait before a letter: the Master's bubble with three dots, the way
 * every messaging app says "they're typing".
 *
 * The line under it grows with the wait, and only says true things. A
 * letter takes a while because it's written in full and then every story in
 * it is checked against the record before any of it is sent (D-012). After
 * half a minute it says they can leave, but only if a notification will
 * actually reach them (`canLeave`).
 */
export function TypingBubble({
  slug,
  name,
  since,
  canLeave,
}: {
  slug: string;
  name: string;
  since: number;
  canLeave: boolean;
}) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const waited = now - since;

  const line =
    waited > 30_000 && canLeave
      ? "You can leave. You'll get a notification when the letter arrives."
      : waited > 12_000
        ? "Every story in a letter is checked against the record before it's sent."
        : `${name} is writing…`;

  return (
    <View style={{ gap: space.xs }}>
      <MasterGroup slug={slug} name={name}>
        <View
          style={masterBubbleStyle({
            flexDirection: "row",
            gap: space.xs,
            paddingVertical: space.lg + 2,
          })}
          accessibilityLabel={`${name} is writing`}
        >
          <Dot delay={0} />
          <Dot delay={150} />
          <Dot delay={300} />
        </View>
      </MasterGroup>
      <Enter key={line} preset="fade" style={{ paddingLeft: AVATAR + space.sm }}>
        <Text variant="caption">{line}</Text>
      </Enter>
    </View>
  );
}
