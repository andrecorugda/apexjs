---
"@apex-stack/data": minor
---

Phase C2 — resource/model authorization + row-level scope. `defineResource` and
`defineModel` gain `access` (per-op `'public' | 'authed' | predicate`, mapped onto the
route auth/can gate) and `scope(ctx)` (a row filter injected as a WHERE on
list/get/update/delete and stamped onto create). Declaring either gates the whole
resource — unlisted ops default to `'authed'` (fail-closed), so you can't half-secure a
resource. `scope` isolates rows per caller across all five ops (id-guessing can't cross
scopes), create stamps ownership unspoofably, and update can't reassign a scoped
column. Enforced identically over REST and MCP.
