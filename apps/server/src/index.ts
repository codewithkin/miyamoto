import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@miyamoto/api/context";
import { appRouter } from "@miyamoto/api/routers/index";
import { auth } from "@miyamoto/auth";
import { env } from "@miyamoto/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { ensureReviewerAccount } from "./reviewer";
import { registerAiRoute } from "./routes/ai";
import { registerRevenueCatWebhook } from "./routes/revenuecat";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  }),
);

registerAiRoute(app);
registerRevenueCatWebhook(app);

app.get("/", (c) => {
  return c.text("OK");
});

// Every start: the Play reviewer account, if its variables are set (plan 14).
// Not awaited, so a slow database never delays the server answering.
void ensureReviewerAccount();

export default app;
