---
name: react-sketch-canvas loadPaths quirk
description: How loadPaths interacts with onChange and how to load saved strokes without false-positive edits.
---

`react-sketch-canvas` (`ReactSketchCanvasRef`) fires the `onChange` callback once after a programmatic `loadPaths(paths)` call, in addition to firing on real user strokes / undo / redo / clear.

**Rule:** when restoring saved strokes, set a `justLoadedRef = true` immediately before `loadPaths(...)`, and in the `onChange` handler skip exactly one call when that ref is set (then reset it). Otherwise the restore is mistaken for a user edit and triggers a redundant save.

**Why:** without the guard, loading persisted handwriting immediately re-saves identical data and can cause feedback loops with debounced autosave.

**How to apply:** `onChange` covers strokes/undo/redo/clear, so it's the right single place to persist drawings. Use `strokeColor #2f220c`, `canvasColor #ffffff` for the passport look. To force a reload of latest strokes (e.g. admin read-only re-sync), remount the canvas subtree via a changing React `key` so the load-once effect runs again.
