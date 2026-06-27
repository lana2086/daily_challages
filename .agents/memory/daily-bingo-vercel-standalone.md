---
name: daily-bingo standalone Vite/Vercel build
description: How the daily-bingo frontend was decoupled from the pnpm monorepo into a standalone Vite app for Vercel, and the npm-install quirk that bites inside this repo.
---

The daily-bingo artifact can be deployed as a standalone standard Vite + React app (Vercel) independent of the pnpm monorepo. Its only cross-package coupling was `@workspace/api-client-react` (Orval-generated hooks/types + custom-fetch), which was COPIED (not moved) into `artifacts/daily-bingo/src/api/` so the lib still exists for the backend's codegen.

**Why:** User explicitly required a standard Vite app with no `catalog:`/`workspace:*`/`@replit` deps that `npm install` + `npm run build` without pnpm workspaces.

**How to apply / gotchas:**
- Running `npm install` inside an artifact folder while the repo's pnpm `node_modules` exists at root leaks parent lifecycle scripts (e.g. `run-s build:src` from a pnpm-linked dep) and fails with `run-s: not found`. Use `npm install --ignore-scripts` locally; a clean Vercel checkout of just the folder installs normally. Published UI libs + esbuild/tailwind/lightningcss native binaries (optional platform deps) don't need those scripts.
- The frontend calls the API via relative `/api` (baseUrl baked into generated client). For Vercel: `vercel.json` SPA fallback MUST exclude `/api` (`"source": "/((?!api/).*)"`) or it swallows API calls. An optional `VITE_API_BASE_URL` → `setBaseUrl()` hook in main.tsx lets the static frontend target a separately-hosted backend (no-op when unset).
- The backend (api-server) + libs are still pnpm/monorepo; only the frontend was made standalone.
