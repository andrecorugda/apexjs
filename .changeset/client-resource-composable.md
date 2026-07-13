---
"@apex-stack/kit": minor
"@apex-stack/core": minor
"create-apexjs": patch
---

Generate a typed client data-hook from a model (`apex make composable`).

- **New runtime factory** `createResourceClient<T>(name, opts?)` (exported from
  `@apex-stack/core/client`) — a reactive Alpine data object you spread into an
  `x-data`, exposing `items / current / loading / error` plus
  `fetch / find / create / update / remove`, wired to the model's `/api/<name>`
  REST resource and keeping the local list in sync.
- **New generator** `apex make composable <Model>` reads `models/<Model>.ts` and
  emits `composables/use<Plural>.ts` — a typed `usePosts()` wrapper with the item
  interface + create-payload type lifted from `defineModel` (behaviors like
  `timestamps()` / `softDeletes()` are reflected in the shape). Also exposed as an
  MCP tool kind for AI agents.

One `defineModel` now spans schema + migration + REST + MCP **and** the browser.
Additive — no change to the Stable API surface.
