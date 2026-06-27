---
name: drizzle-kit push blocked in this env
description: Why `pnpm --filter @workspace/db run push` hangs and how to apply schema changes instead.
---

`drizzle-kit push` hangs/fails in this environment because it shows an interactive TTY confirmation prompt that cannot be answered from the agent shell.

**Rule:** apply DB schema changes by running the equivalent DDL directly with `psql "$DATABASE_URL"` (or the database skill's executeSql). Define the table to match the Drizzle schema in `lib/db/src/schema/`, then create/alter it manually and verify columns.

**Why:** the non-interactive push path is blocked, so relying on it stalls the task.

**How to apply:** keep the Drizzle schema file as the source of truth (so codegen/types stay correct), but realize the actual table via SQL. Verify with `\d <table>` or an information_schema query afterward.
