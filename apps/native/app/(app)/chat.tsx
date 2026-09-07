import { useChat } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import { env } from "@miyamoto/env/native";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from "react-native";

import { Blade } from "@/components/blade";
import { Animated, Enter, usePulse } from "@/components/motion";
import { AttachSheet, OutOfAnswersSheet, SwitchMasterSheet } from "@/components/overlays";
import { Touchable } from "@/components/touchable";
import { Button, Screen, Text } from "@/components/ui";
import { trpc } from "@/utils/trpc";
import {
  indigo,
  ink,
  radius,
  size,
  space,
  text as textColor,
} from "@/theme/tokens";

/**
 * 15 · Chat with a Master.
 *
 * Streams from the server's /ai route, which authenticates, spends a
 * question against the server-side counter, retrieves the Master's matching
 * Moments and answers through Mastra. The counter shown here is read from
 * the server too — it is never computed on the device.
 *
 * A Master's words are always Zen Old Mincho; the user's are always DM Sans.
 * That difference is doing most of the work of making this feel like a
 * letter rather than a messaging app.
 */
export default function ChatScreen() {
  const [input, setInput] = React.useState("");
  const [threadId] = React.useState<string | null>(null);
  const [showSwitch, setShowSwitch] = React.useState(false);
  const [showAttach, setShowAttach] = React.useState(false);
  const [showOutOf, setShowOutOf] = React.useState(false);
  const scrollRef = React.useRef<ScrollView>(null);

  const usage = useQuery(trpc.chat.usage.queryOptions());
  const threads = useQuery(trpc.chat.threads.queryOptions());

  const activeThread = React.useMemo(
    () => threads.data?.find((t) => t.id === threadId) ?? threads.data?.[0] ?? null,
    [threads.data, threadId],
  );

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: `${env.EXPO_PUBLIC_SERVER_URL}/ai`,
      body: () => ({ threadId: activeThread?.id }),
    }),
  });

  const busy = status === "submitted" || status === "streaming";
  const typing = usePulse(busy);
  const outOfAnswers = usage.data ? !usage.data.canAsk : false;
  const canSend = Boolean(input.trim()) && !busy && !outOfAnswers && Boolean(activeThread);

  React.useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, busy]);

  // Raise the sheet the moment the counter empties, rather than leaving the
  // composer silently disabled.
  React.useEffect(() => {
    if (outOfAnswers) setShowOutOf(true);
  }, [outOfAnswers]);

  function send() {
    const value = input.trim();
    if (!value || !canSend) return;
    sendMessage({ text: value });
    setInput("");
  }

  return (
    <Screen pad={0}>
      {/* Who is writing. */}
      <Enter preset="drop">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: space.base,
            paddingHorizontal: space.xl,
            paddingVertical: space.base,
            borderBottomWidth: 1,
            borderBottomColor: ink.border,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text variant="title" style={{ fontSize: size.lead }}>
              {activeThread?.master.name ?? "Musashi"}
            </Text>
            <Text variant="caption">
              {activeThread?.master.title ?? "The Strategist"}
            </Text>
          </View>
          <Touchable feel="chip" hitSlop={10} onPress={() => setShowSwitch(true)}>
            <Text variant="eyebrow" color={indigo.light}>
              Switch ▾
            </Text>
          </Touchable>
        </View>
      </Enter>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: space.xl, gap: space.xl }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <Enter preset="rise" delay={200}>
              <Text variant="lead">
                Bring the worst part of your week. He won&apos;t comfort you.
              </Text>
            </Enter>
          ) : null}

          {messages.map((message) => {
            const isUser = message.role === "user";
            const body = (message.parts ?? [])
              .filter((p) => p.type === "text")
              .map((p) => ("text" in p ? p.text : ""))
              .join("");

            return (
              <Enter
                key={message.id}
                preset={isUser ? "slideRight" : "rise"}
                style={{ alignItems: isUser ? "flex-end" : "flex-start" }}
              >
                {isUser ? (
                  <View
                    style={{
                      maxWidth: "86%",
                      backgroundColor: indigo.tint,
                      borderRadius: radius.sheet,
                      borderBottomRightRadius: space.sm,
                      padding: space.xl,
                    }}
                  >
                    <Text variant="label" style={{ fontSize: size.bodyLg }}>
                      {body}
                    </Text>
                  </View>
                ) : (
                  // A Master's words get no bubble — a letter has no bubble.
                  <View style={{ maxWidth: "94%", gap: space.sm }}>
                    <Text variant="voice">{body}</Text>
                  </View>
                )}
              </Enter>
            );
          })}

          {busy ? (
            <Animated.View style={[{ flexDirection: "row", gap: space.sm }, typing]}>
              <Blade state="active" length={12} />
              <Text variant="caption">
                {activeThread?.master.name ?? "Musashi"} is writing…
              </Text>
            </Animated.View>
          ) : null}

          {error ? (
            <Enter preset="slideLeft">
              <Text variant="caption" color="#E0483B">
                {error.message}
              </Text>
            </Enter>
          ) : null}
        </ScrollView>

        {/* Composer. */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: ink.border,
            paddingHorizontal: space.xl,
            paddingTop: space.base,
            paddingBottom: space.xl,
            gap: space.md,
          }}
        >
          {outOfAnswers ? (
            <Enter preset="slideUp">
              <View style={{ gap: space.sm }}>
                <Text variant="caption" style={{ textAlign: "center" }}>
                  Three questions is all a stranger gets.
                </Text>
                <Button label="See Pro" onPress={() => setShowOutOf(true)} />
              </View>
            </Enter>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: space.md }}>
              <Touchable
                feel="chip"
                onPress={() => setShowAttach(true)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: radius.pill,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: ink.high,
                }}
              >
                <Text variant="title" color={textColor.muted}>
                  +
                </Text>
              </Touchable>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask anything…"
                placeholderTextColor={textColor.faintest}
                multiline
                editable={!busy}
                style={{
                  flex: 1,
                  minHeight: 48,
                  maxHeight: 120,
                  borderRadius: radius.sheet,
                  backgroundColor: ink.high,
                  borderWidth: 1,
                  borderColor: ink.border,
                  paddingHorizontal: space.xl,
                  paddingVertical: space.base,
                  color: textColor.body,
                  fontSize: size.body,
                }}
              />
              <Touchable
                feel="button"
                onPress={send}
                disabled={!canSend}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: radius.pill,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: canSend ? indigo.base : ink.high,
                }}
              >
                <Text variant="title" color={textColor.primary}>
                  ↑
                </Text>
              </Touchable>
            </View>
          )}

          {usage.data && !usage.data.isPro ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <Text variant="caption" style={{ flex: 1 }}>
                {usage.data.remaining} of {usage.data.limit} free answers left
              </Text>
              <Touchable feel="chip" hitSlop={8} onPress={() => setShowOutOf(true)}>
                <Text variant="caption" color={indigo.light}>
                  Get unlimited
                </Text>
              </Touchable>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>

      <SwitchMasterSheet
        visible={showSwitch}
        onClose={() => setShowSwitch(false)}
        threadId={activeThread?.id}
        currentSlug={activeThread?.master.slug}
      />
      <AttachSheet visible={showAttach} onClose={() => setShowAttach(false)} />
      <OutOfAnswersSheet visible={showOutOf} onClose={() => setShowOutOf(false)} />
    </Screen>
  );
}
