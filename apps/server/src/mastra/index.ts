import { Agent } from "@mastra/core/agent";
import { Mastra } from "@mastra/core/mastra";
import { Memory } from "@mastra/memory";
import { PostgresStore } from "@mastra/pg";
import { env } from "@miyamoto/env/server";

import { MASTER_MODELS, modelFor } from "./masters";

/**
 * Mastra owns the conversation store.
 *
 * It writes to the SAME Postgres database as Prisma but into its own
 * `mastra` schema, so its tables can never collide with a Prisma migration.
 * Thread *metadata* — owner, current Master, title — stays in Prisma's
 * `thread` table, keyed to the Mastra thread by id.
 *
 * That split is what makes cross-device sync free: both halves are rows in
 * one database, so a thread opened on a phone is already on the tablet.
 */
export const mastraStore = new PostgresStore({
  id: "miyamoto-store",
  connectionString: env.DATABASE_URL,
  schemaName: "mastra",
});

export const memory = new Memory({
  storage: mastraStore,
});

/**
 * The whole system prompt is compiled per request and handed over through
 * the request context, because it depends on the Master's row and on which
 * corpus entries this particular question retrieved. Nothing about a
 * Master's identity is baked into the agent.
 */
export const INSTRUCTIONS_KEY = "compiledInstructions";

function createMasterAgent(slug: string) {
  return new Agent({
    id: slug,
    name: slug,
    model: modelFor(slug),
    memory,
    instructions: ({ requestContext }) => {
      const compiled = requestContext?.get?.(INSTRUCTIONS_KEY) as string | undefined;

      // A missing prompt means the route failed to compile one. Refusing
      // is the only safe answer: an agent with no corpus and no law is
      // exactly the configuration that invents history.
      return (
        compiled ??
        "Reply only with: I cannot answer that right now. Do not roleplay, do not improvise, do not claim anything about your life."
      );
    },
  });
}

export const masterAgents = Object.fromEntries(
  MASTER_MODELS.map((m) => [m.slug, createMasterAgent(m.slug)]),
);

export const mastra = new Mastra({
  agents: masterAgents,
  storage: mastraStore,
});

/** Throws if the slug is not one of the Masters. */
export function getMasterAgent(slug: string) {
  const agent = masterAgents[slug];
  if (!agent) throw new Error(`Unknown master: ${slug}`);
  return agent;
}
