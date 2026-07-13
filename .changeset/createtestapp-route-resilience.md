---
"@apex-stack/core": minor
"create-apexjs": patch
---

`createTestApp` no longer lets one unresolvable `/api` route crash every test with a cryptic error.

Previously, a single route whose import didn't resolve — e.g. a generated model route that
needs `@apex-stack/data` before it's installed — failed the whole app boot with a raw ESM
"Cannot find module", and the co-generated tests' `afterAll(() => app.close())` then threw a
second, masking `TypeError`. So an unrelated `auth`/`api` test would fail with two confusing
errors.

- **Clear, actionable error (default).** A route that fails to load now throws a message naming
  the route file, the module that couldn't resolve, and how to install it
  (`npm i @apex-stack/data @libsql/client`).
- **`createTestApp({ root, lenientRoutes: true })`** — opt in to skip unresolvable routes (with a
  warning) and boot the rest of the surface, e.g. to test `auth` without installing the data layer.
- **Hardened generated tests.** `api` / `auth` co-generated tests use `afterAll(() => app?.close())`,
  so a failed `beforeAll` surfaces its own error without a masking teardown throw.
- **Docs/AGENTS** use `Article` (not `Post`) in `apex make model` examples — the starter ships a
  `posts` demo, so `Post` collided — and note that a model route needs `@apex-stack/data` installed
  to be test-mountable.
