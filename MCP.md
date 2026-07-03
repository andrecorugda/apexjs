# Apex JS — AI-Native APIs (MCP from routes)

> Write a typed API route once. Get a REST endpoint **and** a live MCP tool. No extra library.

This is Apex's signature feature. Because every route carries a strict, machine-readable
schema, exposing it to AI clients (Claude, etc.) as an [MCP](https://modelcontextprotocol.io)
tool is automatic.

## One definition, two surfaces

```ts
// server/api/add.ts
import { defineApexRoute } from '@apex-stack/core'
import { z } from 'zod'

export default defineApexRoute({
  method: 'POST',
  description: 'Add two numbers and return their sum', // → MCP tool description
  input: { a: z.number(), b: z.number() },             // → REST validation + MCP inputSchema
  mcp: true,                                           // opt in to MCP exposure
  handler: ({ input }) => ({ sum: input.a + input.b }),
})
```

You now have:

- **`POST /api/add`** — validated REST endpoint (400 on bad input, with Zod issues).
- **MCP tool `add`** — served at **`/mcp`** (Streamable HTTP), with its `inputSchema`
  derived from the Zod contract and its description taken from `description`.

The framework carries the MCP transport (`@modelcontextprotocol/sdk`) — **the user installs
nothing extra.** Only `mcp: true` routes are exposed; everything else stays REST-only.

## Proven end-to-end

`playground/spike` defines `add` (POST) and `greet` (GET). Verified:

| Check | Result |
| --- | --- |
| `POST /api/add {a,b}` → `{sum}` | ✅ |
| `GET /api/greet?name=` → `{message}` | ✅ |
| Invalid input → `400` with Zod issues | ✅ |
| A real MCP client (`@modelcontextprotocol/sdk`) connects to `/mcp` | ✅ |
| `tools/list` returns `add` + `greet` with descriptions | ✅ |
| `add`'s `inputSchema` = `{a: number, b: number}` (from Zod) | ✅ |
| `tools/call add {a:2,b:3}` → `{sum:5}` | ✅ |

Reproduce: run `apex dev` in `playground/spike`, then `pnpm check:mcp` (or `node mcp-check.mjs <port>`).

## Design notes

- **The schema is the enabler.** `defineApexRoute.input` is a Zod raw shape used for REST
  validation *and* the MCP `inputSchema`. No duplication, no drift.
- **Opt-in + safe.** MCP exposure is per-route (`mcp: true`). Auth/permission scoping is the
  next layer (route-level guards), mirroring role-scoped MCP servers.
- **Stateless MCP.** The `/mcp` endpoint runs the SDK's Web-standard Streamable HTTP transport
  in stateless JSON mode — a fresh server per request, no session bookkeeping.
- **"Any API the Apex way."** Auto-MCP works for routes that carry a schema; free-form handlers
  without one aren't auto-exposed (by design).

## Deferred

- Extract the MCP server into an official `apexjs-mcp` package (keep core lean).
- `outputSchema` → MCP structured content.
- Route-level auth/permission scopes for tools.
- GET query coercion helpers (use `z.coerce.*` today).
