import { useChat } from "@ai-sdk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import { env } from "@miyamoto/env/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from "react-native";

import { MasterAvatar } from "@/components/master-avatar";
import { Blade, BladeTick } from "@/components/blade";
import {
  LetterBubble,
  MasterGroup,
  TypingBubble,
  UserBubble,
  masterBubbleStyle,
} from "@/components/chat-bubbles";
import { Enter } from "@/components/motion";
import { AttachSheet, OutOfAnswersSheet, SwitchMasterSheet } from "@/components/overlays";
import { Touchable } from "@/components/touchable";
import { Button, Screen, Text } from "@/components/ui";
import { Icon } from "@/components/icon";
import { describeChatError } from "@/lib/chat-errors";
import { answeredIn, mergeHistory } from "@/lib/chat-history";
import { serverFetch, streamingServerFetch } from "@/lib/server-fetch";
import { track } from "@/lib/telemetry";
import { trpc } from "@/utils/trpc";
import {
  green,
  indigo,
  ink,
  radius,
  red,
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
  const router = useRouter();
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

  const { messages, sendMessage, status, error, setMessages, regenerate, clearError } = useChat({
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
  // A history that cannot be reached leaves the screen as it is, rather than
  // showing an error for a page the user did not ask for.
  //
  // History is merged, never simply applied (lib/chat-history). It used to
  // replace the messages whenever it arrived, and it can arrive seconds after
  // the person has already sent: the empty history of a new thread then
  // wiped out their first message. History that lands while a question is in
  // flight waits until the chat is idle, so it never lands mid-stream.
  const statusRef = React.useRef(status);
  statusRef.current = status;
  const messagesRef = React.useRef(messages);
  messagesRef.current = messages;
  const activeIdRef = React.useRef<string | undefined>(undefined);
  activeIdRef.current = activeThread?.id;
  /** The thread the messages on screen belong to. */
  const messagesFor = React.useRef<string | null>(null);
  /**
   * Ids that came from saved history. A Master's message not among them
   * arrived on this visit, and writes itself out; history appears whole.
   */
  const fromHistory = React.useRef(new Set<string>());
  const [revealed, setRevealed] = React.useState<ReadonlySet<string>>(() => new Set());
  const pendingHistory = React.useRef<{ threadId: string; messages: typeof messages } | null>(null);

  const applyHistory = React.useCallback(
    (threadId: string, history: typeof messages) => {
      if (statusRef.current === "submitted" || statusRef.current === "streaming") {
        pendingHistory.current = { threadId, messages: history };
        return;
      }
      const sameThread = messagesFor.current === threadId;
      messagesFor.current = threadId;
      for (const m of history) fromHistory.current.add(m.id);
      setMessages((current) => (sameThread ? mergeHistory(history, current) : history));
      // The send failed on the phone, but the server answered and saved it
      // anyway (the connection dropped while the app was away). The letter
      // is here now, so the error isn't true any more.
      const lastLocal = messagesRef.current[messagesRef.current.length - 1];
      if (statusRef.current === "error" && answeredIn(history, lastLocal)) clearError();
    },
    [setMessages, clearError],
  );

  const loadHistory = React.useCallback(
    async (threadId: string) => {
      try {
        const res = await serverFetch(
          `${env.EXPO_PUBLIC_SERVER_URL}/ai/history?threadId=${encodeURIComponent(threadId)}`,
        );
        if (!res.ok) return;
        const body = (await res.json()) as { messages: typeof messages };
        // The person may have opened another thread while this was loading.
        if (activeIdRef.current === threadId) applyHistory(threadId, body.messages);
        return body.messages;
      } catch {
        // Unreachable history leaves the screen as it is.
      }
      return null;
    },
    [applyHistory],
  );

  /**
   * Retry after a failed send, without paying twice. If the server answered
   * anyway, the history brings the letter in and nothing is resent.
   */
  async function retry() {
    const id = activeThread?.id;
    const question = messagesRef.current[messagesRef.current.length - 1];
    const history = id ? await loadHistory(id) : null;
    if (history && answeredIn(history, question)) return;
    clearError();
    void regenerate();
  }

  const historyFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    const id = activeThread?.id;
    if (!id || historyFor.current === id) return;
    historyFor.current = id;
    // A different thread: clear the last one's messages now, rather than
    // showing them under this thread's Master until its history arrives.
    if (messagesFor.current && messagesFor.current !== id) {
      messagesFor.current = id;
      setMessages([]);
    }
    void loadHistory(id);
  }, [activeThread?.id, loadHistory, setMessages]);

  // History that arrived mid-send, applied once the letter is in.
  React.useEffect(() => {
    if (status === "submitted" || status === "streaming") return;
    const pending = pendingHistory.current;
    if (!pending) return;
    pendingHistory.current = null;
    if (activeIdRef.current === pending.threadId) applyHistory(pending.threadId, pending.messages);
  }, [status, applyHistory]);

  // Back from the background with the letter still owed: the phone may have
  // lost the connection while the server finished and saved it. Reload, and
  // the merge brings it in.
  React.useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      const id = activeIdRef.current;
      const last = messagesRef.current[messagesRef.current.length - 1];
      const waiting = statusRef.current === "submitted" || statusRef.current === "streaming";
      if (id && last?.role === "user" && !waiting) void loadHistory(id);
    });
    return () => subscription.remove();
  }, [loadHistory]);

  // What a failed send says, in a sentence rather than the server's JSON.
  const errorView = error ? describeChatError(error.message) : null;
  React.useEffect(() => {
    if (errorView?.outOfQuestions) setShowOutOf(true);
  }, [errorView?.outOfQuestions]);

  const busy = status === "submitted" || status === "streaming";
  const outOfAnswers = usage.data ? !usage.data.canAsk : false;
  const canSend = Boolean(input.trim()) && !busy && !outOfAnswers && Boolean(activeThread);
  const lastMessage = messages[messages.length - 1];
  // Dots until the letter's first words are here; the letter takes over then.
  const waitingForLetter = busy && lastMessage?.role === "user";

  // When the wait began, for the typing bubble's growing line.
  const [waitingSince, setWaitingSince] = React.useState<number | null>(null);
  React.useEffect(() => {
    setWaitingSince((since) => (waitingForLetter ? (since ?? Date.now()) : null));
  }, [waitingForLetter]);

  // Follow the conversation down as it grows (a sent message, the dots, a
  // letter writing itself out), but only while the person is at the bottom.
  // Someone who scrolled up to reread isn't pulled away from it.
  const atBottom = React.useRef(true);

  // A message handed over by the screen that opened this one: onboarding's
  // one question arrives here as `?prefill=` (D-048). It goes in the
  // composer, unsent, for the same reason as the seed below. It's read once
  // and the param cleared, so text they've deleted doesn't come back on the
  // next render. It also beats the thread-title seed, which is cut to 120
  // characters, so a long problem arrives whole.
  const { prefill } = useLocalSearchParams<{ prefill?: string }>();
  React.useEffect(() => {
    if (!prefill) return;
    setInput(prefill);
    router.setParams({ prefill: undefined });
  }, [prefill, router]);

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
    if (activeThread) messagesFor.current = activeThread.id;
    atBottom.current = true;
    sendMessage({ text: value });
    // "2 of 3 left" moves on the tap rather than after the letter (D-049).
    // Only the count: whether they can still ask is the server's call, and
    // predicting it would raise the out-of-answers sheet over the letter
    // the last question paid for. onFinish and onError re-read the truth.
    qc.setQueryData(trpc.chat.usage.queryKey(), (old) =>
      old && !old.isPro && old.remaining !== null
        ? { ...old, remaining: Math.max(0, old.remaining - 1) }
        : old,
    );
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
          contentContainerStyle={{ padding: space.xl, gap: space.base }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={100}
          onScroll={(e) => {
            const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
            atBottom.current =
              contentSize.height - (contentOffset.y + layoutMeasurement.height) < 80;
          }}
          onContentSizeChange={() => {
            if (atBottom.current) scrollRef.current?.scrollToEnd({ animated: true });
          }}
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

          {messages.map((message, index) => {
            const isUser = message.role === "user";
            const body = (message.parts ?? [])
              .filter((p) => p.type === "text")
              .map((p) => ("text" in p ? p.text : ""))
              .join("");
            const isLast = index === messages.length - 1;

            if (isUser) {
              return (
                <UserBubble key={message.id} text={body}>
                  {/* A failed send is marked on the message that failed. */}
                  {isLast && error ? (
                    <SendFailed
                      text={errorView?.text ?? ""}
                      onRetry={errorView?.retryable ? () => void retry() : undefined}
                    />
                  ) : null}
                </UserBubble>
              );
            }

            const charge = chargeOf(message.parts);
            const fresh = !fromHistory.current.has(message.id) && !revealed.has(message.id);
            // The Master who wrote it isn't recorded per message, so the
            // thread's current Master speaks for all of them.
            return (
              <MasterGroup
                key={message.id}
                slug={activeThread?.master.slug ?? "musashi"}
                name={activeThread?.master.name ?? "Musashi"}
              >
                <LetterBubble
                  text={body}
                  reveal={fresh}
                  onRevealed={() =>
                    setRevealed((prev) => (prev.has(message.id) ? prev : new Set(prev).add(message.id)))
                  }
                />
                {charge && !fresh ? <ChargeCard charge={charge} /> : null}
              </MasterGroup>
            );
          })}

          {waitingForLetter && activeThread ? (
            <TypingBubble
              slug={activeThread.master.slug}
              name={activeThread.master.name}
              since={waitingSince ?? Date.now()}
              canLeave={false}
            />
          ) : null}

          {/* An error with no message of theirs to hang it on. */}
          {error && lastMessage?.role !== "user" ? (
            <SendFailed text={errorView?.text ?? ""} />
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
                  backgroundColor: canSend || status === "submitted" ? indigo.base : ink.high,
                }}
                dimWhenDisabled={false}
              >
                {/* While the question is on its way, the button that sent it
                    says so. The Master's "is writing" line takes over once
                    the letter starts to arrive. */}
                {status === "submitted" ? (
                  <ActivityIndicator size="small" color={textColor.primary} />
                ) : (
                  <Icon
                    name="arrow-up"
                    size={22}
                    color={canSend ? textColor.primary : textColor.faintest}
                  />
                )}
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
        onRefused={() => setShowSwitch(true)}
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
/** Under a message that didn't go through: what happened, and Retry where it can help. */
function SendFailed({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <Enter
      preset="fade"
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: space.sm,
        maxWidth: "86%",
        alignSelf: "flex-end",
      }}
    >
      <Icon name="alert-circle" size={15} color={red.base} />
      <Text variant="caption" color={textColor.muted} style={{ flexShrink: 1 }}>
        {text}
      </Text>
      {onRetry ? (
        <Touchable
          feel="chip"
          hitSlop={8}
          onPress={onRetry}
          accessibilityLabel="Retry"
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingHorizontal: space.md,
            paddingVertical: space.xxs,
            borderRadius: radius.pill,
            backgroundColor: ink.high,
            borderWidth: 1,
            borderColor: ink.border,
          }}
        >
          <Icon name="refresh" size={13} color={indigo.light} />
          <Text variant="caption" color={indigo.light}>
            Retry
          </Text>
        </Touchable>
      ) : null}
    </Enter>
  );
}

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

  // The card moves on the tap (D-049) and moves back if the server refuses.
  function answer(status: "ACCEPTED" | "COMPLETED") {
    const before = state;
    setState(status);
    respond.mutate({ chargeId: charge.id, status }, { onError: () => setState(before) });
  }

  // Its own bubble under the letter (plan 13): something to do, not
  // something to read, so it gets its own shape. Indigo while open, green
  // once done (D-045).
  return (
    <Enter
      preset="rise"
      style={masterBubbleStyle({
        alignSelf: "stretch",
        backgroundColor: state === "COMPLETED" ? green.tint : indigo.tint,
        borderWidth: 1.5,
        borderColor: state === "COMPLETED" ? green.base : indigo.base,
        gap: space.base,
      })}
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
              label="Accept"
              loading={respond.isPending}
              loadingLabel="Accepting…"
              onPress={() => answer("ACCEPTED")}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="Later"
              variant="secondary"
              disabled={respond.isPending}
              onPress={() => setState("LATER")}
            />
          </View>
        </View>
      ) : null}

      {state === "LATER" ? (
        <Text variant="caption">Left for later. It is still due today.</Text>
      ) : null}

      {respond.isError ? (
        <Text variant="caption" color="#E0483B">
          That didn&apos;t save. Try again.
        </Text>
      ) : null}

      {state === "ACCEPTED" ? (
        <Button
          label="Mark done"
          variant="confirm"
          loading={respond.isPending}
          loadingLabel="Marking…"
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
    </Enter>
  );
}
