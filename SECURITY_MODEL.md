# Apex JS — Security Model (auth + permissions) · proposal

> Status: **design, awaiting sign-off on the API shape.** Nothing here is built yet.
> The goal: a small, HTML-first auth model that secures **pages, REST routes, and MCP tools
> with one policy** — so the AI-native surface can never do more than the logged-in user can.

## Why this matters for Apex specifically

Apex is unusual: a single `defineApexRoute` / `defineResource` becomes **both** a REST endpoint
**and** an MCP tool. That's the superpower — and the risk. Today those surfaces are **open**:
anyone who can reach `/api/*` or `/mcp` can call every route and read/write every resource.
Before real apps ship, we need auth + permissions that cover all four surfaces at once:

| Surface | Today | Risk |
|---|---|---|
| Pages / loaders (SSR) | no user context | can't gate data or UI per user |
| REST `/api/*` | open | anyone calls any route |
| **MCP `/mcp`** | open | **any AI client can call every tool + touch all data** |
| Client / UI | shows everything | no backend-driven gating |

The guiding rule: **one policy, enforced on the server, applied to every surface.** The AI gets
exactly the caller's permissions — never more.

## The model (proposed API)

### 1. A session provider — `defineAuth`
One place resolves "who is this request?" (cookie, JWT, header, or an adapter like Lucia /
Better-Auth / Auth.js). Lives at `server/auth.ts`:

```ts
import { defineAuth } from '@apex-stack/core'

export default defineAuth({
  async getSession(request) {
    // return your user/session, or null if anonymous
    return await sessionFromCookie(request)
  },
})
```

The resolved value is injected as `ctx.session` / `ctx.user` into **every** loader, route handler,
and MCP tool call — one source of truth.

### 2. Guard a route (REST + MCP together)
```ts
export default defineApexRoute({
  method: 'POST',
  description: 'Delete a project',
  input: { id: z.number() },
  mcp: true,
  auth: true,                                   // must be signed in
  can: ({ user }) => user.role === 'admin',     // fine-grained (optional)
  handler: ({ input, user }) => deleteProject(input.id),
})
```
- Unauthenticated REST → **401**; unauthorized → **403**.
- **MCP**: an unauthorized route is **omitted from `tools/list`** for that caller and refused on
  `tools/call`. `tools/list` is **per-user**.

### 3. Resource policies + row scoping — `defineResource`
```ts
export default defineResource('invoices', {
  db, table: schema.invoices,
  insert: { amount: z.number(), clientId: z.number() },
  access: {                       // per-operation: 'public' | 'authed' | fn
    list:   'authed',
    get:    'authed',
    create: ({ user }) => user.can('invoices.write'),
    update: ({ user }) => user.can('invoices.write'),
    delete: ({ user }) => user.role === 'admin',
  },
  scope: ({ user }, qb) => qb.where(eq(table.ownerId, user.id)),  // row-level: only your rows
})
```
`scope` runs on **every** read/write (REST and MCP), so an AI listing `invoices` sees only the
caller's rows — mirroring how the GlobalView production MCP already scopes data per user.

### 4. Backend → UI gating (HTML-first, safe by construction)
The server already knows the user, so **the loader returns only permitted data and the SSR only
emits permitted HTML** — the UI is gated by construction, not by hiding things client-side.
For interactivity, expose non-secret flags to the template:

```ts
// available in the page: `user` + `can`
<button x-show="can.deleteProjects" @click="...">Delete</button>
```
`can` is seeded into the hydration island (booleans only — never secrets), so islands show/hide
correctly after hydration. **Client gating is UX; the server policy is the security.**

### 5. MCP authentication
`/mcp` authenticates the caller (bearer token / session), then:
- `tools/list` returns only the tools that caller may use.
- `tools/call` runs the handler **as that user**, through the same `auth`/`can`/`scope`.
- A route must be `mcp: true` **and** pass its guard to be callable. Default-deny for writes.

This is the whole promise: **"the assistant can do exactly what the user can do — nothing more."**

## Cross-cutting hardening (defaults)
- **CSRF** protection for cookie-based state-changing requests (origin check + token).
- **Secure cookies** by default (`HttpOnly`, `Secure`, `SameSite=Lax`), signed sessions.
- **Rate limiting** hook on `/api` + `/mcp`.
- **Never serialize secrets** into the SSR state island — only display-safe values + `can` flags.
- Security headers helper (CSP, etc.) for the shell.

## Phased plan
- **Phase 1 — foundation:** `defineAuth` + request context (`ctx.user`) threaded into loaders /
  routes / MCP; `auth` + `can` on `defineApexRoute`; 401/403; per-user MCP `tools/list`. *(Unit-testable server-side — no live browser needed.)*
- **Phase 2 — data + UI:** `access` + `scope` on `defineResource`; `user`/`can` in templates + hydration seeding.
- **Phase 3 — batteries:** signed-cookie session helper, `apex make auth`, login/logout + CSRF,
  and adapters (Lucia / Better-Auth / Auth.js) + OAuth.

## Open decisions for you
1. **Session source** for the built-in helper: signed **cookie** (simple, SSR-friendly — recommended) vs JWT vs adapter-only.
2. **MCP caller auth**: bearer token issued per user (recommended for AI clients) vs reuse the session cookie.
3. **Adapter-first or batteries-first?** Ship the guard/policy layer now and let people bring their
   own auth (Lucia/Better-Auth), or also ship a built-in session helper in Phase 1?

Once you pick 1–3 (or say "use your recommendation"), I'll build **Phase 1** and prove it with
tests: an authed route returns 401 anon / 200 authed / 403 wrong-role, and `tools/list` hides the
guarded tool from an unauthorized MCP caller.
