# Roadmap

> **New here?** Read `progress/00-START-HERE.md` first. This file is the
> ordering; that one is the state.

One todo, one commit. If a plan is wrong, change the plan first in its own
commit with a `**Note (session N):**` saying what changed and why. Never
diverge silently.

## Order

| # | Plan | Status | Blocked on |
|---|---|---|---|
| 01 | `01-master-corpus.md` | **Built to T11b** — T12 next | Nothing: the key is set as of session 4 |
| 02 | `02-notifications.md` | **Built**, not run on a device | A device |
| 03 | `03-revenuecat.md` | T00, T02 built; T01, T03 remain | RevenueCat keys, dashboard, a device |
| 04 | `04-onboarding-claim.md` | **Done** | — |
| 06 | `06-onboarding-rework.md` | **Built** (session 4), not run on a device | Google OAuth client + an HTTPS server URL; a device |
| 07 | `07-welcome-and-analytics.md` | **Built** (session 5), not run on a device | A device; the privacy policy line |
| 05 | `05-launch-readiness.md` | Not started | The owner: icon, consoles, domain, device |

## Why this order

**01 first.** The corpus is now seeded (session 2), so this is no longer
blocking everything else — but T08–T10 withdraw a Master from the data, the
API and the app, and every day that is deferred is a day D-006 is not
actually honoured.

**04 before 05** because onboarding currently collects eleven screens of
answers and never persists them. Every day that ships is a day of real users
whose quiz results are silently discarded.

**03 whenever the keys arrive.** The code paths exist and are deliberately
inert; this is unblocking, not building.

## What is explicitly out

- Rewriting `packages/ui` for the native app. It is web-only shadcn. Ignore it.
- Any app feature in `apps/web`. It is a marketing site.
- Removing Mandela from the marketing site. The owner wants that later,
  separately.
- Message bodies in the data export. Blocked by the Mastra split (D-014), and
  the export screen says so rather than omitting them quietly.
  **Note (session 3):** no longer blocked in principle — `loadThreadHistory`
  in `apps/server` now reads them — but not built. The export lives in
  `packages/api`, which cannot import Mastra, so it would move to a server
  route.
