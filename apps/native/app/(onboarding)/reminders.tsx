import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { Blade } from "@/components/blade";
import { Enter, Stagger } from "@/components/motion";
import { Button, Screen, Text } from "@/components/ui";
import { MASTERS } from "@/content/onboarding-options";
import { requestReminderPermission } from "@/lib/notifications";
import { useOnboarding } from "@/lib/onboarding-store";
import { indigo, ink, radius, size, space, text as textColor } from "@/theme/tokens";

/**
 * 10 · Before the permission prompt.
 *
 * Primes the OS dialog by showing exactly what will be sent, in the shape
 * it will arrive in. The two preview notifications slide down from the top
 * edge like real ones, which is the whole argument this screen makes.
 *
 * "Wake me" raises the real OS prompt, here and only here, after the
 * previews have made the case. The draft records whether permission was
 * actually granted — not whether the button was tapped — because the server
 * schedules nothing for a user whose phone will not deliver it. A refusal is
 * remembered and never re-asked; see lib/notifications.
 */
export default function RemindersScreen() {
  const router = useRouter();
  const { draft, set } = useOnboarding();

  const master = MASTERS.find((m) => m.slug === draft.firstMaster);
  const eveningMaster = MASTERS.find((m) => m.slug !== draft.firstMaster && !m.proOnly);

  const previews = [
    {
      who: master?.name ?? "Musashi",
      time: draft.morningReminder,
      body: "Day 1. Name the person you're avoiding. Before breakfast.",
    },
    {
      who: eveningMaster?.name ?? "Seneca",
      time: draft.eveningReminder,
      body: "Did you do it? One word is enough.",
    },
  ];

  const [asking, setAsking] = React.useState(false);

  async function accept() {
    if (asking) return;
    setAsking(true);
    try {
      const outcome = await requestReminderPermission();
      set({ remindersEnabled: outcome === "granted" });
    } finally {
      setAsking(false);
      // Onward either way. Refusing notifications is not a reason to stop
      // someone reaching their thirty days.
      router.push("/(onboarding)/offer");
    }
  }

  function decline() {
    set({ remindersEnabled: false });
    router.push("/(onboarding)/offer");
  }

  return (
    <Screen>
      <View style={{ flex: 1, gap: space.section, paddingTop: space.screen }}>
        <View style={{ gap: space.md }}>
          <Enter preset="rise">
            <Text variant="display">
              A Master will wake you at {draft.morningReminder}.
            </Text>
          </Enter>
          <Enter preset="rise" delay={200}>
            <Text variant="lead">
              Two notifications a day, both about your trial. Nothing else, ever.
            </Text>
          </Enter>
        </View>

        {/* Previews drop in from the top edge, the way the real ones will. */}
        <Stagger initialDelay={480} step={260} style={{ gap: space.base }}>
          {previews.map((p) => (
            <Enter key={p.who} preset="slideDown">
              <View
                style={{
                  padding: space.xl,
                  borderRadius: radius.card,
                  backgroundColor: ink.raised,
                  borderWidth: 1,
                  borderColor: ink.border,
                  gap: space.sm,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                  <Blade state="complete" length={12} />
                  <Text variant="label" style={{ flex: 1 }}>
                    {p.who}
                  </Text>
                  <Text variant="caption">{p.time}</Text>
                </View>
                <Text variant="body" color={textColor.body} style={{ fontSize: size.body }}>
                  {p.body}
                </Text>
              </View>
            </Enter>
          ))}
        </Stagger>

        <Stagger initialDelay={1060} step={140} style={{ gap: space.md }}>
          {[
            "Streak reminders only on the day you'd break it",
            "No marketing, no “we miss you”",
          ].map((line) => (
            <Enter key={line} preset="slideLeft">
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.base }}>
                <Blade state="empty" length={10} />
                <Text variant="caption" style={{ flex: 1 }}>
                  {line}
                </Text>
              </View>
            </Enter>
          ))}
        </Stagger>
      </View>

      <View style={{ paddingVertical: space.xxl, gap: space.base }}>
        <Enter preset="pop" delay={1300}>
          <Button
            label={asking ? "Asking your phone…" : `Wake me at ${draft.morningReminder}`}
            disabled={asking}
            onPress={() => void accept()}
          />
        </Enter>
        <Enter preset="fade" delay={1440}>
          <Button label="I'll remember myself" variant="ghost" onPress={decline} />
        </Enter>
      </View>
    </Screen>
  );
}
