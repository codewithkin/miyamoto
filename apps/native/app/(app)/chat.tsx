import { useChat } from "@ai-sdk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

import { MasterAvatar } from "@/components/master-avatar";
import { Blade, BladeTick } from "@/components/blade";
import { Animated, Enter, usePulse } from "@/components/motion";
import { AttachSheet, OutOfAnswersSheet, SwitchMasterSheet } from "@/components/overlays";
import { Touchable } from "@/components/touchable";
import { Button, Screen, Text } from "@/components/ui";
import { Icon } from "@/components/icon";
import { describeChatError } from "@/lib/chat-errors";
import { serverFetch, streamingServerFetch } from "@/lib/server-fetch";
import { track } from "@/lib/telemetry";
import { trpc } from "@/utils/trpc";
import {
  green,
  indigo,
  ink,
  radius,
  size,
  space,
  text as textColor,
} from "@/theme/tokens";

/** What the /ai route sends after an accepted letter, as a data-charge part. */
type HandedCharge = {
  id: string;
  body: string;
  dueOn: string;
  points: number;
  /** Present on charges returned with a thread's history. */
  status?: "PENDING" | "ACCEPTED" | "DECLINED" | "COMPLETED";
};

function chargeOf(parts: { type: string }[] | undefined): HandedCharge | null {
  const part = (parts ?? []).find((p) => p.type === "data-charge") as
    | { type: string; data?: HandedCharge }
    | undefined;
  return part?.data ?? null;
}

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

  const qc = useQueryClient();
  const usage = useQuery(trpc.chat.usage.queryOptions());
  const threads = useQuery(trpc.chat.threads.queryOptions());

  const activeThread = React.useMemo(
    () => threads.data?.find((t) => t.id === threadId) ?? threads.data?.[0] ?? null,
    [threads.data, threadId],
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: `${env.EXPO_PUBLIC_SERVER_URL}/ai`,
      // Carries the session and streams the letter (D-047). Without it the
      // transport used plain fetch, sent no cookie, and every send was 401.
      fetch: streamingServerFetch,
      body: () => ({ threadId: activeThread?.id }),
    }),
    // The counter moves on every send — spent, or refunded when the server
    // could not deliver — and the thread's title and charges may have moved
    // with it. All of it is re-read from the server rather than guessed.
    onFinish: () => void qc.invalidateQueries(),
    onError: () => void qc.invalidateQueries({ queryKey: trpc.chat.usage.queryKey() }),
  });

  // Open the thread on what was already said (T11b). Mastra holds every
  // accepted exchange; without this each visit started on a blank screen,
  // and a Master switched in mid-thread appeared to have been handed nothing.
  // Loaded once per thread. A history that cannot be reached leaves the
  // screen as it always was, empty, rather than showing an error for a page
  // the user did not ask for.
  const historyFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    const id = activeThread?.id;
    if (!id || historyFor.current === id) return;
    historyFor.current = id;
    let cancelled = false;

    (async () => {
      try {
        const res = await serverFetch(
          `${env.EXPO_PUBLIC_SERVER_URL}/ai/history?threadId=${encodeURIComponent(id)}`,
        );
        if (!res.ok) return;
        const body = (await res.json()) as { messages: typeof messages };
        if (!cancelled) setMessages(body.messages);
      } catch {
        // Unreachable history is an empty screen, which is what it was before.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeThread?.id, setMessages]);

  // What a failed send says, in a sentence rather than the server's JSON.
  const errorView = error ? describeChatError(error.message) : null;
  React.useEffect(() => {
    if (errorView?.outOfQuestions) setShowOutOf(true);
  }, [errorView?.outOfQuestions]);

  const busy = status === "submitted" || status === "streaming";
  const typing = usePulse(busy);
  const outOfAnswers = usage.data ? !usage.data.canAsk : false;
  const canSend = Boolean(input.trim()) && !busy && !outOfAnswers && Boolean(activeThread);

  React.useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, busy]);

  // The onboarding claim opens the first thread titled with the problem the
  // user brought. Until anything has been sent on it — the AI route moves
  // lastMessageAt on the first send, so the two timestamps are still equal —
  // offer that problem back in the composer.
  //
  // Offered, never sent. Sending spends one of three free questions, and
  // spending it is the user's decision rather than something a screen does on
  // arrival (D-018). Seeded once per thread, so clearing the field sticks.
  const seededFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    const t = activeThread;
    if (!t || seededFor.current === t.id) return;
    seededFor.current = t.id;
    const untouched = String(t.lastMessageAt) === String(t.createdAt);
    if (untouched && t.title && messages.length === 0) {
      setInput((current) => current || t.title!);
    }
  }, [activeThread, messages.length]);

  // Raise the sheet the moment the counter empties, rather than leaving the
  // composer silently disabled.
  React.useEffect(() => {
    if (outOfAnswers) setShowOutOf(true);
  }, [outOfAnswers]);

  function send() {
    const value = input.trim();
    if (!value || !canSend) return;
    sendMessage({ text: value });
    // Counted when sent, not when answered: this measures people reaching
    // for a Master. Never the text — only who it went to and whether it
    // opened the thread.
    track("Chat.messageSent", {
      master: activeThread?.master.slug ?? "unknown",
      firstInThread: messages.length === 0,
    });
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
          <MasterAvatar
            slug={activeThread?.master.slug ?? "musashi"}
            name={activeThread?.master.name ?? "Musashi"}
            size={40}
            active
          />
          <View style={{ flex: 1 }}>
            <Text variant="title" style={{ fontSize: size.lead }}>
              {activeThread?.master.name ?? "Musashi"}
            </Text>
            <Text variant="caption">
              {activeThread?.master.title ?? "The Strategist"}
            </Text>
          </View>
          <Touchable feel="chip" hitSlop={10} onPress={() => setShowSwitch(true)}
            accessibilityLabel="Switch Master"
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Text variant="eyebrow" color={indigo.light}>
              Switch
            </Text>
            <Icon name="chevron-down" size={14} color={indigo.light} />
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
          {/* A fresh thread opens on the Master, not on one line of body text.
              No pronoun: "He won't comfort you" was wrong for Curie. */}
          {messages.length === 0 && activeThread ? (
            <Enter
              preset="rise"
              delay={120}
              style={{
                alignItems: "center",
                gap: space.base,
                paddingTop: space.screen,
                paddingBottom: space.xl,
              }}
            >
              <MasterAvatar
                slug={activeThread.master.slug}
                name={activeThread.master.name}
                size={88}
                active
              />
              <View style={{ alignItems: "center", gap: space.xxs }}>
                <Text variant="display" style={{ textAlign: "center" }}>
                  {activeThread.master.name}
                </Text>
                {activeThread.master.title ? (
                  <Text variant="eyebrow" color={indigo.light}>
                    {activeThread.master.title}
                  </Text>
                ) : null}
              </View>
              <Text
                variant="lead"
                color={textColor.muted}
                style={{ textAlign: "center", paddingHorizontal: space.xl }}
              >
                Bring the worst part of your week. No comfort — what to do about it, and one
                thing to do today.
              </Text>
            </Enter>
          ) : null}

          {messages.map((message) => {
            const isUser = message.role === "user";
            const body = (message.parts ?? [])
              .filter((p) => p.type === "text")
              .map((p) => ("text" in p ? p.text : ""))
              .join("");
            const charge = isUser ? null : chargeOf(message.parts);

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
                  <View style={{ maxWidth: "94%", gap: space.base }}>
                    <Text variant="voice">{body}</Text>
                    {charge ? <ChargeCard charge={charge} /> : null}
                  </View>
                )}
              </Enter>
            );
          })}

          {busy ? (
            <Animated.View style={[{ flexDirection: "row", alignItems: "center", gap: space.sm }, typing]}>
              <MasterAvatar
                slug={activeThread?.master.slug ?? "musashi"}
                name={activeThread?.master.name ?? "Musashi"}
                size={24}
              />
              <Text variant="caption">
                {activeThread?.master.name ?? "Musashi"} is writing…
              </Text>
            </Animated.View>
          ) : null}

          {error ? (
            <Enter preset="slideLeft">
              <Text variant="caption" color="#E0483B">
                {errorView?.text}
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
                accessibilityLabel="Attach evidence"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: radius.pill,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: ink.high,
                }}
              >
                <Icon name="add" size={24} color={textColor.body} />
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
                accessibilityLabel="Send"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: radius.pill,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: canSend ? indigo.base : ink.high,
                }}
              >
                <Icon name="arrow-up" size={22} color={canSend ? textColor.primary : textColor.faintest} />
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

/**
 * The charge a Master hands over at the end of a letter (D-003).
 *
 * Screen 14 draws this card under the reply, labelled "Your trial". It says
 * "Your charge" here: a Trial is an authored Path day and a Charge is what a
 * Master hands you in chat, and the two must never share a name, because
 * they do not share a streak. Registered as an exception to the design.
 *
 * The design shows only the card as it arrives — Accept or Later. What
 * happens after is not drawn, so it is kept to the least that makes a charge
 * completable from where it was given: accepted, then done, which is the
 * only path by which chat moves the Bushido score.
 */
function ChargeCard({ charge }: { charge: HandedCharge }) {
  const qc = useQueryClient();
  // A charge returned with history arrives in the state the user left it, so
  // an old letter does not offer to be accepted a second time.
  const [state, setState] = React.useState<"PENDING" | "ACCEPTED" | "LATER" | "COMPLETED">(
    charge.status === "COMPLETED" ? "COMPLETED" : charge.status === "ACCEPTED" ? "ACCEPTED" : "PENDING",
  );
  const respond = useMutation(
    trpc.chat.respondToCharge.mutationOptions({ onSuccess: () => void qc.invalidateQueries() }),
  );

  function answer(status: "ACCEPTED" | "COMPLETED") {
    respond.mutate(
      { chargeId: charge.id, status },
      { onSuccess: () => setState(status) },
    );
  }

  return (
    <View
      style={{
        padding: space.xl,
        borderRadius: radius.card,
        backgroundColor: ink.surface,
        borderWidth: 1,
        borderColor: state === "COMPLETED" ? green.base : indigo.base,
        gap: space.base,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <Blade state={state === "COMPLETED" ? "complete" : "active"} length={12} />
        <Text variant="eyebrow" style={{ flex: 1 }}>
          Your charge
        </Text>
        <Text variant="caption">Today</Text>
      </View>

      <Text variant="voice" style={{ fontSize: size.lead }}>
        {charge.body}
      </Text>

      {state === "PENDING" ? (
        <View style={{ flexDirection: "row", gap: space.md }}>
          <View style={{ flex: 1 }}>
            <Button
              label={respond.isPending ? "Accepting…" : "Accept"}
              disabled={respond.isPending}
              onPress={() => answer("ACCEPTED")}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Later" variant="secondary" onPress={() => setState("LATER")} />
          </View>
        </View>
      ) : null}

      {state === "LATER" ? (
        <Text variant="caption">Left for later. It is still due today.</Text>
      ) : null}

      {state === "ACCEPTED" ? (
        <Button
          label={respond.isPending ? "Marking…" : "Mark done"}
          variant="confirm"
          disabled={respond.isPending}
          onPress={() => answer("COMPLETED")}
        />
      ) : null}

      {state === "COMPLETED" ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          <BladeTick done />
          <Text variant="label" color={green.fg}>
            Done. +{charge.points} Bushido
          </Text>
        </View>
      ) : null}
    </View>
  );
}
