import { env } from "@miyamoto/env/server";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../prisma/generated/client";

export function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();
export default prisma;

// Re-export the generated surface so consumers can *name* these types.
// Without this, any package that infers a type touching PrismaClient fails
// declaration emit with TS2883 — the generated path is not reachable from
// outside this package.
export * from "../prisma/generated/client";

/** The client type callers should accept, rather than importing generated paths. */
export type Db = ReturnType<typeof createPrismaClient>;
