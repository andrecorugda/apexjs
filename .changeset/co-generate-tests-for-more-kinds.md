---
"@apex-stack/core": minor
---

`apex make` now co-generates a test for every logic-bearing kind.

Previously only `api` / `service` / `model` scaffolded a matching `tests/*.test.ts`.
Now `store`, `middleware`, `composable`, and `auth` do too (respecting `--no-test`):

- **store** — instantiates the factory, asserts initial state + an action mutates.
- **middleware** — calls it with a request ctx, asserts it runs and doesn't redirect by default.
- **composable** — mocks `fetch`, asserts `fetch()` loads `items` and `create()` appends.
- **auth** — boots `createTestApp`, asserts the login → logout round-trip (and 401 on empty creds).

Closes the inconsistency where `apex make composable` (a sibling of `model`/`api`/`service`)
shipped without a test. Kinds with nothing meaningful to assert (`page`, `component`, `layout`,
`client`, `migration`) still don't emit one — a `page` route test needs page rendering that the
test kit doesn't expose yet.
