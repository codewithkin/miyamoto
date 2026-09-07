# Miyamoto — working agreement

## Rule: modular todos, one commit each

**This applies to every feature, without exception.**

Before writing any code for a feature:

1. **Split the feature into self-contained todos.** Each todo must stand on its own — it compiles, it type-checks, and it leaves the app in a working state. A todo that only makes sense alongside the next one is not split correctly; either merge them or find the real seam.
2. **One commit per todo.** Never batch two todos into one commit. Never split one todo across two commits.
3. **Commit as you go,** not in a pile at the end. The todo isn't done until it's committed.

A good split is usually: schema → server logic → API surface → client data layer → UI → polish. Each of those lands separately and is independently revertable.

Write the todo list out before starting, and confirm it if the feature is large enough that the split is debatable.

## Rule: decide, don't ask

Don't stop work to ask which approach to take. Pick the one you'd recommend, implement it, and collect the calls you made into a short **Decisions** list at the end of the response so they can be reversed cheaply.

Never hand over a bare problem. Every issue you raise comes with the fix you propose — and where you can, the fix that makes the problem worth having found.

Reserve real questions for choices that are genuinely the user's: money, legal exposure, product scope, or anything a wrong guess makes expensive to undo.

## Stack

Turborepo + pnpm workspaces, Bun runtime.

- `apps/native` — the product. Expo + expo-router, uniwind + heroui-native.
- `apps/web` — **marketing site only.** No app features, no checkout.
- `apps/server` — Hono: Better-Auth handler, tRPC mount, AI routes.
- `packages/api` — tRPC routers. `packages/db` — Prisma/Postgres. `packages/auth` — Better-Auth. `packages/env` — t3-env schemas.
- `packages/ui` — **web-only shadcn. Not used by the native app. Ignore it.**

## Decisions

- **AI:** Mastra (`@mastra/core`), model `deepseek/deepseek-v4-pro`, auth via `DEEPSEEK_API_KEY`.
- **Payments:** RevenueCat (`react-native-purchases`). Native IAP: monthly subscription + lifetime non-consumable. Set RevenueCat `appUserID` to the Better-Auth user id.
- **Expo Go does not work** once RevenueCat lands — development builds only.
- **Auth is required before the first question.** No anonymous sessions.
- **Masters speak from a curated corpus**, not free generation. Never let the model invent biographical events for real historical figures.
- **Naming:** a *Trial* is an authored Bushido Path day. A *Charge* is what a Master hands you at the end of a chat. Do not use "trial" for the chat-generated one.
- Streaks count Path Trials only; the Bushido score counts both.
- **Day boundaries are per-user timezone and enforced server-side** — the free 3/day limit, streaks, and Day 29 all depend on it.
