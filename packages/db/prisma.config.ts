import path from "node:path";

import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

dotenv.config({
  path: "../../apps/server/.env",
});

/**
 * `prisma generate` only needs the schema — it never opens a connection.
 * Everything else (db push, migrate, studio, seed) does.
 *
 * On CI there is no apps/server/.env to read, so `env("DATABASE_URL")` threw
 * and took the whole install down during postinstall. Falling back to an
 * obviously-unusable URL lets generate run anywhere, while any command that
 * actually connects still fails immediately and says why — rather than
 * quietly pointing at something real.
 */
const datasourceUrl = process.env.DATABASE_URL
  ? env("DATABASE_URL")
  : "postgresql://DATABASE_URL-is-not-set/";

export default defineConfig({
  schema: path.join("prisma", "schema"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    url: datasourceUrl,
  },
});
