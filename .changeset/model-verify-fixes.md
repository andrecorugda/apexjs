---
'@apex-stack/data': patch
'@apex-stack/core': patch
---

Fixes from the model-scaffolding verification pass.

- **Blocker:** a `timestamp` field crashed MCP `tools/list` for the whole app
  (`z.coerce.date()` output can't convert to JSON Schema). Timestamps are now ISO
  strings end-to-end (SQLite `TEXT`, Postgres `TIMESTAMP` with string I/O). Plus the
  MCP layer now degrades ANY unrepresentable tool input schema to a loose one for
  that one tool instead of taking down the entire tool list — so a hand-written
  route using `z.date()` can't break MCP either.
- API responses serialize explicitly: a `null` handler result (e.g. get-by-id not
  found) is now a parseable `200 null` JSON body, not h3's `204 No Content`.
- Handler errors surface the real message (with a "run `apex migrate`" hint when a
  table is missing) instead of an opaque 500 with an empty stack.
- Resource MCP tool descriptions reworded to read cleanly for plural model names
  ("Create todos", not "Create a todos").
