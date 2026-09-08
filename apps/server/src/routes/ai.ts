import { RequestContext } from "@mastra/core/di";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import db from "@miyamoto/db";
import { consumeQuestion, getUsage } from "@miyamoto/api/lib/usage";
import { auth } from "@miyamoto/auth";
import type { Hono } from "hono";

import { getMasterAgent, INSTRUCTIONS_KEY } from "../mastra";
import { retrieveContext } from "../mastra/retrieval";
import { compileInstructions } from "../mastra/template";

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
 */

export function registerAiRoute(app: Hono) {
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

    // Spend the question before answering, not after.
    const usage = await getUsage(userId);
    if (!usage.canAsk) {
      return c.json({ error: "OUT_OF_QUESTIONS", usage }, 402);
    }
    await consumeQuestion(userId);

    const latest = messages[messages.length - 1];
    const latestText: string =
      typeof latest?.content === "string"
        ? latest.content
        : (latest?.parts ?? [])
            .filter((p: { type: string }) => p.type === "text")
            .map((p: { text: string }) => p.text)
            .join(" ");

    // Identity, corpus and quotations all come from the database; the
    // prompt is compiled here rather than baked into the agent.
    const context = await retrieveContext(thread.master.slug, latestText ?? "");
    if (!context) {
      // Unknown or withdrawn Master. Refusing beats falling back to a
      // generic voice with no corpus behind it.
      return c.json({ error: "MASTER_UNAVAILABLE" }, 409);
    }

    const agent = getMasterAgent(thread.master.slug);

    // Mastra owns the history: passing the thread id means a Master who has
    // just been switched in reads everything that came before, which is the
    // whole promise of switching without losing the thread.
    const requestContext = new RequestContext();
    requestContext.setRaw(
      INSTRUCTIONS_KEY,
      compileInstructions(context.master, context.corpus, context.quotations),
    );

    const result = await agent.stream(latestText ?? "", {
      memory: {
        thread: thread.mastraThreadId,
        resource: userId,
      },
      requestContext,
    });

    await db.thread.update({
      where: { id: thread.id },
      data: {
        lastMessageAt: new Date(),
        title: thread.title ?? latestText?.slice(0, 80),
      },
    });

    // Mastra emits its own chunk type; bridge it onto the AI SDK UI stream
    // the app's useChat consumes.
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const id = crypto.randomUUID();
        writer.write({ type: "text-start", id });
        for await (const delta of result.textStream) {
          writer.write({ type: "text-delta", id, delta });
        }
        writer.write({ type: "text-end", id });
      },
    });

    return createUIMessageStreamResponse({ stream });
  });
}
