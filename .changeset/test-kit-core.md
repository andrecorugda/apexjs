---
"@apex-stack/core": minor
---

Test kit. New `@apex-stack/core/testing` boots an app's API + MCP surface in-process for
tests: `createTestApp({ root })` (or `{ entries, auth }`) returns REST helpers
(`get/post/patch/put/delete` → `{ status, body, headers }`) and `mcp.listTools`/
`mcp.call`. Authenticate a call with `{ user }` (injects a session, skipping login) or
drive the real login flow — a cookie jar persists `Set-Cookie`; auth gating, `scope`,
and CSRF stay live. New `apex test` command (thin Vitest wrapper; args pass through).
`apex make service|api|model` now emits a matching test alongside the code (opt out with
`--no-test`), and the default scaffold ships a sample harness test.
