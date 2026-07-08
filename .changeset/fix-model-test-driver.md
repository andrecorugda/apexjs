---
"@apex-stack/core": patch
---

`apex make model`'s generated test now uses in-memory SQLite (`createDb({ driver:
'sqlite', url: ':memory:' })` — the `@libsql/client` driver the command already tells
you to install) instead of `pglite`, so the test runs with no extra dependency. Uses a
portable `COUNT(*)` query too.
