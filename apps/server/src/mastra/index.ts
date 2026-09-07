import { Agent } from "@mastra/core/agent";
import { Mastra } from "@mastra/core/mastra";
import { Memory } from "@mastra/memory";
import { PostgresStore } from "@mastra/pg";
import { env } from "@miyamoto/env/server";

import { buildInstructions, MASTER_AGENTS, type MasterAgentSpec } from "./masters";

/**
 * Mastra owns the conversation store.
 *
 * It writes to the SAME Postgres database as Prisma but into its own
 * `mastra` schema, so its eight tables (mastra_threads, mastra_messages and
 * the rest) can never collide with a Prisma migration. Thread *metadata* —
 * owner, current Master, title — stays in Prisma's `thread` table, keyed to
 * the Mastra thread by id.
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
 * Moments are retrieved per request and handed to the agent through the
 * runtime context, so the same agent answers differently depending on what
 * the user's problem actually matched — without a second agent per topic.
 */
export type MasterRuntimeContext = {
  moments: { title: string; body: string; lesson: string }[];
};

function createMasterAgent(spec: MasterAgentSpec) {
  return new Agent({
    id: spec.slug,
    name: spec.name,
    model: spec.model,
    memory,
    instructions: ({ requestContext }) => {
      const moments =
        (requestContext?.get?.("moments") as MasterRuntimeContext["moments"] | undefined) ?? [];
      return buildInstructions(spec, moments);
    },
  });
}

export const masterAgents = Object.fromEntries(
  MASTER_AGENTS.map((spec) => [spec.slug, createMasterAgent(spec)]),
);

export const mastra = new Mastra({
  agents: masterAgents,
  storage: mastraStore,
});

/** Throws if the slug is not one of the five. */
export function getMasterAgent(slug: string) {
  const agent = masterAgents[slug];
  if (!agent) throw new Error(`Unknown master: ${slug}`);
  return agent;
}
