---
name: read-only / admin views must re-hydrate on updatedAt
description: Avoid one-time init locking in stale data for read-only views of user-editable content.
---

When a component shows a read-only/admin view of data another user is editing, it must reflect the latest saved version, including after a background React Query refetch while the view is open.

**Rule:** do NOT gate local-state initialization behind a single `initRef` boolean for read-only mode. Track the server `updatedAt`; when it changes, re-hydrate local state and remount any imperative children (e.g. canvases) via a changing `key`. For the editable owner's own view, keep one-time init so a refetch never clobbers in-progress edits, and update the query cache on save (`setQueryData`) so a remount within the same session starts fresh.

**Why:** a one-time init ignores newer payloads from refetches, so admins saw stale passports and participants could see old content after leaving/returning in the same SPA session.

**How to apply:** branch the init effect on `readOnly` — read-only re-syncs on `updatedAt` delta; editable inits once + writes mutation result back into the cache.
