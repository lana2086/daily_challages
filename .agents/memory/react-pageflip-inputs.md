---
name: react-pageflip swallows input events
description: Why form fields inside an HTMLFlipBook page can't be focused/typed into
---

`react-pageflip` (HTMLFlipBook) attaches mouse/touch/pointer listeners on each
page to drive the flip gesture. Those handlers intercept `mousedown` /
`pointerdown` / `touchstart` on any `<input>` / `<textarea>` inside a page,
stealing focus before the field can be focused — so the field looks editable
(not `disabled`/`readOnly`, no overlay) yet typing does nothing.

**Why:** the bug is event capture by the flipbook, not the input's own props.
Checking `disabled`/`readOnly`/z-index/overlays is a dead end.

**How to apply:** on editable fields inside a flipbook page, add
`onMouseDown`/`onTouchStart`/`onPointerDown` handlers that call
`e.stopPropagation()` so the events never reach the flipbook. Only attach them
in editable mode — in read-only mode leave them off so users can still start a
swipe-to-flip gesture from anywhere on the page.
