import React from "react";
import { View } from "react-native";

import { Enter } from "@/components/motion";
import { Screen, Text } from "@/components/ui";
import { space } from "@/theme/tokens";

/**
 * PLACEHOLDER — not yet implemented.
 *
 * This route exists so the tab shell is navigable while Adversity is built. It
 * is deliberately obvious rather than a convincing empty state, so it
 * cannot be mistaken for finished work.
 */
export default function AdversityScreen() {
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", gap: space.base }}>
        <Enter preset="rise">
          <Text variant="display">Adversity</Text>
        </Enter>
        <Enter preset="fade" delay={160}>
          <Text variant="lead">Not built yet.</Text>
        </Enter>
      </View>
    </Screen>
  );
}
