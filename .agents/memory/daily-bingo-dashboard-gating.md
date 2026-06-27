---
name: daily-bingo participant dashboard gating
description: Why the participant dashboard hides the Passport and Reflection sections
---

The participant dashboard only renders the Reflection form and the Passport
card when `hasCard` is true — i.e. the participant has a bingo card that has at
least one box. With no card the dashboard shows a "No card yet" placeholder and
neither section appears.

**Why:** these features belong to the participant's active challenge journey,
which doesn't exist until a teacher/admin assigns them a card.

**How to apply:** when manually or e2e-testing the participant-facing Passport or
Reflection UI, first seed a `bingo_cards` row for the user plus `bingo_boxes`
(box_number 1..9), otherwise the sections won't mount and the test will fail at
"No card yet". The admin-side Passport editor lives in the participant-detail
dialog and has no such gating.
