import { RequestContext } from "@mastra/core/di";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import db from "@miyamoto/db";
import { consumeQuestion, getUsage, refundQuestion } from "@miyamoto/api/lib/usage";
import { auth } from "@miyamoto/auth";
import type { Hono } from "hono";

import { getMasterAgent, INSTRUCTIONS_KEY, memory } from "../mastra";
import { retrieveContext } from "../mastra/retrieval";
import { checkReply, compileInstructions, correctionFor, type ReplyCheck } from "../mastra/template";

/**
 * The chat endpoint.
 *
 * Streaming does not fit tRPC well, so this stays a plain Hono route while
 * everything around it — who may ask, which Master answers, what they hand
 * over — lives in the chat router.
 *
 * Order matters here: authenticate, then spend the question, then answer.
 * Checking the counter after generating would let anyone with a rewritten
 * client take unlimited answers and only fail on the bookkeeping.
 *
 * Every reply is generated in full and checked before a word reaches the
 * device (D-012). A token stream and a validated reply do not compose: once
 * a sentence has been streamed it has been read, and an invented duel cannot
 * be taken back by rejecting it afterwards. So the reply is buffered,
 * validated, retried once with a correction if it fails, and only then
 * released. The cost is latency — the whole letter arrives after it is
 * written rather than as it is — and the "is writing…" state on the device
 * already covers that wait. Recorded as a decision, not an accident.
 *
 * An accepted reply also hands over its charge: one thing to do today,
 * written as a Charge row due on the user's local date (D-003, D-017) and
 * sent to the device as its own part, so it renders as the card the design
 * draws under the letter rather than as the letter's last paragraph.
 */

type MessagePart = { type: string; text?: string };

/**
 * How a charge is written into the Master's memory, after the letter.
 *
 * One constant, used by the writer and the history reader both, because a
 * format defined twice is a format that drifts — and when it drifts here the
 * charge silently stops reappearing under old letters.
 */
const HANDED_PREFIX = "Charge handed over: ";

function latestUserText(messages: { content?: unknown; parts?: MessagePart[] }[]): string {
  const latest = messages[messages.length - 1];
  if (!latest) return "";
  if (typeof latest.content === "string") return latest.content;
  return (latest.parts ?? [])
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join(" ");
}

/**
 * Writes the accepted exchange into Mastra's history.
 *
 * Attempts are generated with memory read-only, so a rejected draft never
 * becomes something the Master "said" earlier in the thread and draws on
 * next time. Only the question and the reply that passed are saved — with
 * its charge, so a Master asked tomorrow knows what he handed over today.
 */
export async function persistExchange(args: {
  mastraThreadId: string;
  userId: string;
  title: string | null;
  question: string;
  answer: string;
  charge: string | null;
}) {
  const existing = await memory.getThreadById({ threadId: args.mastraThreadId });
  if (!existing) {
    const now = new Date();
    await memory.saveThread({
      thread: {
        id: args.mastraThreadId,
        resourceId: args.userId,
        title: args.title ?? undefined,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  const remembered = args.charge ? `${args.answer}\n\n${HANDED_PREFIX}${args.charge}` : args.answer;

  const at = Date.now();
  await memory.saveMessages({
    messages: [
      {
        id: crypto.randomUUID(),
        role: "user",
        createdAt: new Date(at),
        threadId: args.mastraThreadId,
        resourceId: args.userId,
        content: { format: 2, parts: [{ type: "text", text: args.question }] },
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        createdAt: new Date(at + 1),
        threadId: args.mastraThreadId,
        resourceId: args.userId,
        content: { format: 2, parts: [{ type: "text", text: remembered }] },
      },
    ],
  });
}

export type HistoryCharge = {
  id: string;
  body: string;
  dueOn: string;
  points: number;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "COMPLETED";
};

export type HistoryMessage =
  | { id: string; role: "user"; parts: { type: "text"; text: string }[] }
  | {
      id: string;
      role: "assistant";
      parts: ({ type: "text"; text: string } | { type: "data-charge"; data: HistoryCharge })[];
    };

function splitHanded(text: string): { letter: string; handed: string | null } {
  const at = text.lastIndexOf(HANDED_PREFIX);
  if (at === -1) return { letter: text, handed: null };
  return {
    letter: text.slice(0, at).trimEnd(),
    handed: text.slice(at + HANDED_PREFIX.length).trim(),
  };
}

/**
 * A thread's history, shaped as the messages the chat screen renders.
 *
 * Mastra owns the words (D-014); the Charge table owns what became of each
 * charge. The two are joined here so an old letter comes back with its card
 * in the state the user left it — accepted, done — rather than offering to
 * be accepted again.
 */
export async function loadThreadHistory(args: {
  threadId: string;
  mastraThreadId: string;
  userId: string;
}): Promise<HistoryMessage[]> {
  const existing = await memory.getThreadById({ threadId: args.mastraThreadId });
  if (!existing) return [];

  const [{ messages }, charges] = await Promise.all([
    memory.recall({ threadId: args.mastraThreadId, resourceId: args.userId, perPage: false }),
    db.charge.findMany({
      where: { threadId: args.threadId, userId: args.userId },
      select: { id: true, body: true, dueOn: true, points: true, status: true },
    }),
  ]);

  return [...messages]
    .filter((m) => m.role === "user" || m.role === "assistant")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((m): HistoryMessage => {
      const text = m.content.parts
        .flatMap((p) => (p.type === "text" && "text" in p ? [String(p.text)] : []))
        .join("");

      if (m.role === "user") {
        return { id: m.id, role: "user", parts: [{ type: "text", text }] };
      }

      const { letter, handed } = splitHanded(text);
      const charge = handed ? charges.find((c) => c.body === handed) : undefined;
      return {
        id: m.id,
        role: "assistant",
        parts: [
          { type: "text", text: letter },
          ...(charge ? [{ type: "data-charge" as const, data: charge }] : []),
        ],
      };
    });
}

export function registerAiRoute(app: Hono) {
  /**
   * What was already said on a thread (T11b).
   *
   * Same ownership rule as asking: a thread that is not the caller's is
   * NOT_FOUND, never "forbidden", so its existence is not confirmed either.
   */
  app.get("/ai/history", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) {
      return c.json({ error: "UNAUTHORIZED" }, 401);
    }

    const threadId = c.req.query("threadId");
    if (!threadId) {
      return c.json({ error: "THREAD_REQUIRED" }, 400);
    }

    const thread = await db.thread.findFirst({
      where: { id: threadId, userId: session.user.id },
      select: { id: true, mastraThreadId: true },
    });
    if (!thread) {
      return c.json({ error: "NOT_FOUND" }, 404);
    }

    const messages = await loadThreadHistory({
      threadId: thread.id,
      mastraThreadId: thread.mastraThreadId,
      userId: session.user.id,
    });
    return c.json({ messages });
  });

  app.post("/ai", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) {
      return c.json({ error: "UNAUTHORIZED" }, 401);
    }
    const userId = session.user.id;

    const body = await c.req.json();
    const threadId: string | undefined = body.threadId;
    const messages = body.messages ?? [];

    if (!threadId) {
      return c.json({ error: "THREAD_REQUIRED" }, 400);
    }

    const thread = await db.thread.findFirst({
      where: { id: threadId, userId },
      include: { master: true },
    });
    if (!thread) {
      return c.json({ error: "NOT_FOUND" }, 404);
    }

    const question = latestUserText(messages).trim();
    if (!question) {
      return c.json({ error: "EMPTY_QUESTION" }, 400);
    }

    // Spend the question before answering, not after.
    const usage = await getUsage(userId);
    if (!usage.canAsk) {
      return c.json({ error: "OUT_OF_QUESTIONS", usage }, 402);
    }
    const spent = await consumeQuestion(userId);

    // Identity, corpus and quotations all come from the database; the
    // prompt is compiled here rather than baked into the agent.
    const context = await retrieveContext(thread.master.slug, question);
    if (!context) {
      // Unknown or withdrawn Master. Refusing beats falling back to a
      // generic voice with no corpus behind it — and the question was never
      // answered, so it is not charged.
      await refundQuestion(userId, spent.localDate);
      return c.json({ error: "MASTER_UNAVAILABLE" }, 409);
    }

    const agent = getMasterAgent(thread.master.slug);
    const instructions = compileInstructions(context.master, context.corpus, context.quotations);

    const attempt = async (correction?: string): Promise<ReplyCheck> => {
      const requestContext = new RequestContext();
      requestContext.setRaw(
        INSTRUCTIONS_KEY,
        correction ? `${instructions}\n\n${correction}` : instructions,
      );
      const result = await agent.generate(question, {
        // Read the thread so a switched-in Master sees everything before;
        // write nothing, so a rejected draft never enters the history.
        memory: {
          thread: thread.mastraThreadId,
          resource: userId,
          options: { readOnly: true },
        },
        requestContext,
      });
      return checkReply(result.text, context.corpus, { isRetry: Boolean(correction) });
    };

    let check: ReplyCheck;
    try {
      check = await attempt();
      if (!check.ok) {
        console.warn(`[ai] ${thread.master.slug} draft rejected (${check.reason}); retrying once`);
        check = await attempt(correctionFor(check.reason));
      }
    } catch (e) {
      console.error("[ai] generation failed", e);
      await refundQuestion(userId, spent.localDate);
      return c.json(
        {
          error: "MODEL_UNAVAILABLE",
          message: "No Master could be reached. Ask again — this one did not count.",
        },
        503,
      );
    }

    if (!check.ok) {
      // Twice in a row the Master either invented something or could not say
      // where it came from. Delivering it anyway is the failure D-007 exists
      // to prevent; the user is told plainly and keeps their question.
      console.warn(`[ai] ${thread.master.slug} rejected twice (${check.reason}); refunded`);
      await refundQuestion(userId, spent.localDate);
      return c.json(
        {
          error: "UNSUPPORTED_REPLY",
          message: "No answer came back that could be stood behind. Ask again — this one did not count.",
        },
        502,
      );
    }

    const { text: answer, charge } = check;

    const handed = charge
      ? await db.charge.create({
          data: {
            userId,
            threadId: thread.id,
            masterId: thread.masterId,
            body: charge,
            // The local date the question was spent against: a Charge is
            // for today, and today is the user's, not the server's (D-017).
            dueOn: spent.localDate,
          },
          select: { id: true, body: true, dueOn: true, points: true, status: true },
        })
      : null;

    try {
      await persistExchange({
        mastraThreadId: thread.mastraThreadId,
        userId,
        title: thread.title,
        question,
        answer,
        charge,
      });
    } catch (e) {
      // The answer exists and was paid for; losing it from history is worse
      // than delivering it with a gap. Logged, not surfaced.
      console.error("[ai] could not save the exchange to memory", e);
    }

    await db.thread.update({
      where: { id: thread.id },
      data: {
        lastMessageAt: new Date(),
        title: thread.title ?? question.slice(0, 80),
      },
    });

    // Released sentence by sentence so the letter still arrives as lines on
    // the device. No artificial delay: the wait already happened.
    const pieces = answer.match(/[^.!?]+[.!?]+["”’)]*\s*|[^.!?]+$/g) ?? [answer];
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const id = crypto.randomUUID();
        writer.write({ type: "text-start", id });
        for (const delta of pieces) {
          writer.write({ type: "text-delta", id, delta });
        }
        writer.write({ type: "text-end", id });
        if (handed) {
          writer.write({ type: "data-charge", data: handed });
        }
      },
    });

    return createUIMessageStreamResponse({ stream });
  });
}
