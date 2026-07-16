---
"@apex-stack/data": minor
---

Resource list endpoints (REST + MCP `_list`) now support pagination, filtering, and
sorting via query params: `?page` & `?perPage` return a `{ data, total, page, perPage,
lastPage }` envelope (perPage capped at 100), `?sort=-col,other` sorts (leading `-` =
desc), and `?<col>=value` filters by any of the model's columns. Backward-compatible —
with no `page`/`perPage`, list still returns a plain array. The params are also exposed
on the `_list` MCP tool, so an AI client can page and filter too.
