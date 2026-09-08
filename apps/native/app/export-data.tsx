import { useQuery } from "@tanstack/react-query";
import { File, Paths } from "expo-file-system";
import { useRouter } from "expo-router";
import React from "react";
import { Share, View } from "react-native";

import { Blade } from "@/components/blade";
import { Enter, Stagger } from "@/components/motion";
import { Touchable } from "@/components/touchable";
import { Button, Screen, Text } from "@/components/ui";
import { trpc } from "@/utils/trpc";
import { ink, radius, size, space, text as textColor } from "@/theme/tokens";

/**
 * Data export.
 *
 * Portability, reachable without emailing anyone. The payload is written to
 * a file and handed to the system share sheet rather than dumped on screen
 * — it is a document, and the useful thing to do with it is send it
 * somewhere.
 */
export default function ExportDataScreen() {
  const router = useRouter();
  const [status, setStatus] = React.useState<"idle" | "working" | "done" | "failed">("idle");

  // Fetched on demand rather than on mount: no reason to assemble
  // everything the user owns unless they actually asked for it.
  const exported = useQuery({
    ...trpc.account.exportData.queryOptions(),
    enabled: false,
  });

  async function run() {
    setStatus("working");
    try {
      const { data } = await exported.refetch();
      if (!data) throw new Error("no data");

      const json = JSON.stringify(data, null, 2);
      // expo-file-system 57 uses File/Paths rather than the old
      // cacheDirectory + writeAsStringAsync pair.
      const file = new File(Paths.cache, "miyamoto-export.json");
      if (file.exists) file.delete();
      file.create();
      file.write(json);

      await Share.share({
        url: file.uri,
        message: "Your Miyamoto data export",
        title: "miyamoto-export.json",
      });
      setStatus("done");
    } catch {
      setStatus("failed");
    }
  }

  const INCLUDED = [
    "Your account, profile and time zone",
    "Onboarding answers and the wounds you claimed",
    "Path progress, streak and every completed trial",
    "Charges, threads and your Bushido Code",
  ];

  return (
    <Screen scroll>
      <Enter preset="drop">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: space.base,
            paddingVertical: space.lg,
          }}
        >
          <Touchable feel="row" onPress={() => router.back()} hitSlop={12}>
            <Text variant="title" color={textColor.muted}>
              ←
            </Text>
          </Touchable>
          <Text variant="eyebrow">Your data</Text>
        </View>
      </Enter>

      <View style={{ gap: space.section, paddingBottom: space.screen }}>
        <View style={{ gap: space.md }}>
          <Enter preset="rise" delay={100}>
            <Text variant="display">Export my data</Text>
          </Enter>
          <Enter preset="rise" delay={240}>
            <Text variant="lead">
              Everything we hold about you, as one JSON file you can keep or send on.
            </Text>
          </Enter>
        </View>

        <Enter preset="rise" delay={380}>
          <View style={{ gap: space.base }}>
            <Text variant="eyebrow">What&apos;s included</Text>
            <Stagger initialDelay={460} step={80} style={{ gap: space.md }}>
              {INCLUDED.map((i) => (
                <Enter key={i} preset="slideLeft">
                  <View style={{ flexDirection: "row", gap: space.base, alignItems: "flex-start" }}>
                    <View style={{ paddingTop: 7 }}>
                      <Blade state="complete" length={12} />
                    </View>
                    <Text variant="label" style={{ flex: 1, fontSize: size.body }}>
                      {i}
                    </Text>
                  </View>
                </Enter>
              ))}
            </Stagger>
          </View>
        </Enter>

        {/* Say what is missing, rather than letting it be discovered. */}
        <Enter preset="rise" delay={820}>
          <View
            style={{
              padding: space.xl,
              borderRadius: radius.card,
              backgroundColor: ink.surface,
              borderWidth: 1,
              borderColor: ink.border,
              gap: space.sm,
            }}
          >
            <Text variant="eyebrow">Not included yet</Text>
            <Text variant="caption">
              Message contents are stored separately and aren&apos;t in this file yet — threads
              appear by title only. Purchase receipts are held by your store, not by us.
            </Text>
          </View>
        </Enter>

        <Enter preset="pop" delay={960}>
          <View style={{ gap: space.md }}>
            <Button
              label={
                status === "working"
                  ? "Assembling…"
                  : status === "done"
                    ? "Export again"
                    : "Export my data"
              }
              disabled={status === "working"}
              onPress={() => void run()}
            />
            {status === "failed" ? (
              <Text variant="caption" color="#E0483B">
                That didn&apos;t work. Try again, or email privacy@miyamoto.app and we&apos;ll send
                it by hand.
              </Text>
            ) : null}
          </View>
        </Enter>
      </View>
    </Screen>
  );
}
