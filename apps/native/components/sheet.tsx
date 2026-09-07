import React from "react";
import { Modal, Pressable, View } from "react-native";

import { Enter } from "@/components/motion";
import { Text } from "@/components/ui";
import { alpha, ink, radius, space, text as textColor } from "@/theme/tokens";

/**
 * The app's own bottom sheet.
 *
 * Every overlay in the design is a custom sheet, never a system dialog —
 * an OS alert in the middle of a Master's letter breaks the voice harder
 * than any typography choice could fix.
 */
export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: alpha.scrim, justifyContent: "flex-end" }}
      >
        {/* Stop taps inside the sheet from dismissing it. */}
        <Pressable onPress={() => {}}>
          <Enter preset="slideUp">
            <View
              style={{
                backgroundColor: ink.base,
                borderTopLeftRadius: radius.panel,
                borderTopRightRadius: radius.panel,
                borderTopWidth: 1,
                borderColor: ink.border,
                padding: space.section,
                paddingBottom: space.screen * 1.6,
                gap: space.xl,
              }}
            >
              <View style={{ alignItems: "center" }}>
                <View
                  style={{
                    width: 44,
                    height: 4,
                    borderRadius: radius.blade,
                    backgroundColor: ink.border,
                  }}
                />
              </View>

              <View style={{ gap: space.xxs }}>
                <Text variant="title">{title}</Text>
                {subtitle ? <Text variant="caption">{subtitle}</Text> : null}
              </View>

              {children}

              <Pressable onPress={onClose} hitSlop={8} style={{ alignItems: "center" }}>
                <Text variant="label" color={textColor.muted}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          </Enter>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
