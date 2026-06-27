---
name: daily-bingo type imports
description: Which workspace package the daily-bingo artifact imports generated API types/hooks from.
---

The `daily-bingo` artifact (`artifacts/daily-bingo`) declares ONLY `@workspace/api-client-react` as its workspace dependency. That package re-exports both the React Query hooks AND the generated TypeScript model types (e.g. `PassportPage`, `PassportInput`).

**Rule:** in daily-bingo, import generated types from `@workspace/api-client-react`, not `@workspace/api-zod`.

**Why:** importing a type from `@workspace/api-zod` compiles in the lib but fails the artifact typecheck with `TS2307: Cannot find module '@workspace/api-zod'` because the artifact has no dependency on that package. `api-zod` holds the Zod schemas used by the server; the client uses the orval-generated `api-client-react`.

**How to apply:** when wiring a new endpoint into a daily-bingo component, pull `useXxx` hooks, `getXxxQueryKey` helpers, and `type Xxx` model types all from `@workspace/api-client-react` in one import.
