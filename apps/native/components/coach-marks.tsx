import * as SecureStore from "expo-secure-store";
import React from "react";
import { Modal, View } from "react-native";

import { BladeRail } from "@/components/blade";
import { Touchable } from "@/components/touchable";
import { Enter } from "@/components/motion";
import { Button, Text } from "@/components/ui";
import { alpha, ink, radius, size, space, text as textColor } from "@/theme/tokens";

/**
 * 14 · First-run coach marks.
 *
 * Three cards, and the Master delivers them in his own voice rather than
 * the app explaining itself in product copy. Shown once — the flag is
 * written as soon as the tour is finished or skipped, so a crash mid-tour
 * does not trap someone in it forever.
 *
 * The speaker is whoever onboarding put in charge of this user, passed in
 * from the Path. It was hard-coded as Musashi on all three cards. Today that
 * is the same answer — only Day-1 Masters can be first (D-005) and Musashi is
 * the only one — but the tour is the first thing the app says after sign-in,
 * and it should be the Master the quiz promised, not a name typed beside it.
 */

const SEEN_KEY = "miyamoto.coachmarks.seen";

const MARKS = [
  "One trial a day. Miss it and I'll know — that's the whole idea.",
  "Bring me the real problem, not the tidy version. Three questions a day until you step inside.",
  "Thirty days, four acts. On the twenty-ninth you write your own code, and I stop being necessary.",
];

export function CoachMarks({ from }: { from?: string | null }) {
  const speaker = from ?? "Musashi";
  const [step, setStep] = React.useState(0);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const seen = await SecureStore.getItemAsync(SEEN_KEY);
        if (!cancelled && !seen) setVisible(true);
      } catch {
        // If storage is unreadable, showing the tour once more is a far
        // smaller failure than never showing it at all.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const finish = React.useCallback(() => {
    setVisible(false);
    void SecureStore.setItemAsync(SEEN_KEY, "1").catch(() => {});
  }, []);

  const body = MARKS[step];
  if (!body) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={finish}>
      <View
        style={{
          flex: 1,
          backgroundColor: alpha.scrimHard,
          justifyContent: "flex-end",
          padding: space.xl,
          paddingBottom: space.screen * 2,
        }}
      >
        <Enter key={step} preset="slideUp">
          <View
            style={{
              backgroundColor: ink.surface,
              borderRadius: radius.panel,
              borderWidth: 1,
              borderColor: ink.border,
              padding: space.section,
              gap: space.xl,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text variant="eyebrow" style={{ flex: 1 }}>
                {speaker} · {step + 1} of {MARKS.length}
              </Text>
              <Touchable feel="row" onPress={finish} hitSlop={10}>
                <Text variant="caption" color={textColor.muted}>
                  Skip tour
                </Text>
              </Touchable>
            </View>

            <Text variant="voice" style={{ fontSize: size.subtitle }}>
              {body}
            </Text>

            <BladeRail count={MARKS.length} progress={step} activeIndex={step} step={60} />

            <Button
              label={step === MARKS.length - 1 ? "Got it" : "Next"}
              onPress={() => (step === MARKS.length - 1 ? finish() : setStep((s) => s + 1))}
            />
          </View>
        </Enter>
      </View>
    </Modal>
  );
}
