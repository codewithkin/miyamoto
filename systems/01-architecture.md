# Architecture

Turborepo + pnpm workspaces, Bun runtime.

## Apps

| App | What | Notes |
|---|---|---|
| `apps/native` | The product | Expo + expo-router, uniwind + heroui-native. Dev builds only (D-022). |
| `apps/web` | Marketing site **only** | No app features, no sign-in, no checkout. Five pages. |
| `apps/server` | Hono | Better-Auth handler, tRPC mount, the `/ai` streaming route |

## Packages

| Package | What |
|---|---|
| `packages/api` | tRPC routers: chat, path, library, support, account |
| `packages/db` | Prisma schema + client + seed |
| `packages/auth` | Better-Auth. Google/Apple only; passwords disabled |
| `packages/env` | t3-env schemas, one per surface |
| `packages/config` | Shared tsconfig |
| `packages/ui` | **Web-only shadcn. The native app does not use it. Ignore it.** |

## The request paths

**Chat** is the one that does not go through tRPC:

```
app → POST /ai (Hono)
        ├── authenticate                     no session, no answer
        ├── spend the question               BEFORE generating (D-018)
        ├── retrieveContext()                master + corpus + quotations
        ├── compileInstructions()            the whole prompt, per request
        └── Mastra agent → OpenRouter → stream back
```

Streaming does not fit tRPC well, so everything *around* the answer — who
may ask, which Master, what they handed over — lives in the chat router
while the answer itself streams from Hono.

**Everything else** is tRPC over `/trpc`, typed end to end from
`packages/api` into both clients.

## What must not drift

- `apps/web` never grows app features. If it needs a session, something has
  gone wrong.
- `packages/ui` is not for the native app. The native design system is
  `apps/native/theme` + `apps/native/components`.
- Prisma stays off the tRPC context (D-016).
