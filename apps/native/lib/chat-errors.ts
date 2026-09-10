/**
 * Turns a failed /ai response into one plain sentence.
 *
 * The AI SDK's chat transport throws `new Error(await response.text())` on
 * any non-2xx response, so `error.message` is the server's raw JSON body —
 * and the chat screen printed it. A user whose reply was refused for citing
 * nothing read {"error":"UNSUPPORTED_REPLY","message":"No answer came back…"}.
 *
 * The server already writes the sentence a user should see for the failures
 * that happen after a question is spent. The rest are mapped here in the
 * app's own voice: plain, exact, naming the next move (see systems/05-tone).
 * Anything unrecognised — a network failure, a proxy page — gets one line
 * that claims nothing it cannot know.
 *
 * Pure and free of React Native imports, so it can be run on its own.
 */

export type ChatErrorView = {
  text: string;
  /** Raise the out-of-answers sheet rather than only printing a line. */
  outOfQuestions: boolean;
};

const BY_CODE: Record<string, string> = {
  OUT_OF_QUESTIONS: "Three questions is all a stranger gets.",
  MASTER_UNAVAILABLE: "That Master is not taking questions. Switch to another.",
  NOT_FOUND: "This conversation is gone. Open another from the Masters.",
  THREAD_REQUIRED: "Open a conversation from the Masters first.",
  UNAUTHORIZED: "Sign in again to ask.",
  EMPTY_QUESTION: "Write the question first.",
};

const FALLBACK = "That did not go through. Ask again.";

export function describeChatError(raw: string | null | undefined): ChatErrorView {
  const fallback: ChatErrorView = { text: FALLBACK, outOfQuestions: false };
  if (!raw) return fallback;

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return fallback;
  }
  if (!body || typeof body !== "object") return fallback;

  const { error, message } = body as { error?: unknown; message?: unknown };
  const code = typeof error === "string" ? error : "";
  const outOfQuestions = code === "OUT_OF_QUESTIONS";

  if (typeof message === "string" && message.trim()) {
    return { text: message.trim(), outOfQuestions };
  }
  return { text: BY_CODE[code] ?? FALLBACK, outOfQuestions };
}
