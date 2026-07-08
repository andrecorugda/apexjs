---
"@apex-stack/data": minor
---

Phase D (D1) — model behaviors ("traits"). `defineModel` gains `use: [...]` for
composable behaviors that fold their fields, insert-shape tweaks, lifecycle hooks,
row-level `scope`, and per-op `access` into the model — enforced identically over REST
and MCP. Deterministic + fail-closed composition (`composeBehaviors`): fields merge
(collision → throws), scopes AND-combine, access is most-restrictive-wins, hooks run in
behavior order. Built-ins: `timestamps()` (server-stamped `created_at`/`updated_at`,
omitted from the create payload), `owned(col)` (Phase C's `access`+`scope` packaged —
gates authed + isolates rows + stamps owner unspoofably), and `observable(hooks)`
(lifecycle hooks that fire around create/update/delete). Hook seam added to
`defineResource` (`before/after` create/update/delete).
