import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, type ImageSourcePropType, View } from "react-native";

import { Text } from "@/components/ui";
import { font, gold, indigo, ink, text as textColor } from "@/theme/tokens";

/**
 * A Master's face.
 *
 * Square crops are cut once by designs/crop-portraits.py, so this only ever
 * masks a square to a circle — no runtime positioning, which is what let a
 * centred crop show Sun Tzu's robe instead of his face.
 *
 * A Master with no portrait (a future one, or Mandela, withdrawn — D-006)
 * gets their initial in a circle rather than a broken image.
 */

const PORTRAITS: Record<string, ImageSourcePropType> = {
  musashi: require("@/assets/images/portraits/avatar-musashi.png"),
  seneca: require("@/assets/images/portraits/avatar-seneca.png"),
  curie: require("@/assets/images/portraits/avatar-curie.png"),
  "sun-tzu": require("@/assets/images/portraits/avatar-sun-tzu.png"),
};

export type MasterAvatarProps = {
  slug: string;
  /** Used for the initial fallback and the accessibility label. */
  name: string;
  size?: number;
  /**
   * Not yet earned. The face stays visible — you should see who is coming —
   * but dimmed, with a lock badge, so it cannot be mistaken for available.
   */
  locked?: boolean;
  /** Pro-only rather than day-locked: the badge is gold. */
  pro?: boolean;
  /** The Master currently speaking or chosen: an indigo ring. */
  active?: boolean;
};

export function MasterAvatar({
  slug,
  name,
  size = 48,
  locked = false,
  pro = false,
  active = false,
}: MasterAvatarProps) {
  const source = PORTRAITS[slug];
  const ring = active ? 2.5 : 1;
  const badge = Math.max(16, Math.round(size * 0.36));

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={locked ? `${name}, not yet unlocked` : name}
      style={{ width: size, height: size }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: "hidden",
          borderWidth: ring,
          borderColor: active ? indigo.bright : ink.border,
          backgroundColor: ink.raised,
          alignItems: "center",
          justifyContent: "center",
          opacity: locked ? 0.45 : 1,
        }}
      >
        {source ? (
          <Image source={source} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        ) : (
          <Text
            style={{
              fontFamily: font.mincho,
              fontSize: Math.round(size * 0.42),
              color: textColor.secondary,
            }}
          >
            {name.charAt(0)}
          </Text>
        )}
      </View>

      {locked ? (
        <View
          style={{
            position: "absolute",
            right: -2,
            bottom: -2,
            width: badge,
            height: badge,
            borderRadius: badge / 2,
            backgroundColor: pro ? gold.tintAlt : ink.high,
            borderWidth: 1.5,
            borderColor: ink.base,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="lock-closed"
            size={Math.round(badge * 0.55)}
            color={pro ? gold.base : textColor.muted}
          />
        </View>
      ) : null}
    </View>
  );
}
