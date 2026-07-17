# Apex JS — Architecture

> Audience: **AI agents + human maintainers** extending the framework itself.
> This is the map. Each sub-doc drills into one subsystem with the real files, the
> data flow, the extension seams, and the gotchas. Everything here is grounded in
> `packages/**/src` — when in doubt, the cited file is the source of truth.

## What Apex is (one paragraph)

Apex is a full-stack, AI-native meta-framework for Alpine.js. You author a page as
a `.alpine` single-file component; a **Vite plugin** (`packages/vite/src/index.ts`)
transforms it into two modules — an SSR module and a client module. On a request,
the server runs the page's `<script server>` `loader()`, renders the template to
**hydration-safe HTML** against that data (`packages/kit/src/render/renderComponent.ts`),
and ships a `<script type="application/json">` **state island** so Alpine hydrates
to the *exact* same values with **zero flash**. Routes are file-based
(`pages/**/*.alpine` → `packages/apexjs/src/routing/router.ts`). A single
`defineApexRoute` is simultaneously a validated REST endpoint **and** (opt-in) an
MCP tool — the same typed contract powers both (`packages/apexjs/src/api/defineRoute.ts`,
`packages/apexjs/src/mcp/server.ts`). One `defineModel` derives a Drizzle table,
zod validation, migration SQL, an active-record query API, and a REST+MCP CRUD
resource from a single field spec (`packages/data/src/model.ts`). The whole thing is
written as **h3** event handlers so the same render/API pipeline runs in the Vite
dev server, a standalone Node prod server, a serverless handler, **or a bare
on-device JS engine** (mobile) with no filesystem (`packages/apexjs/src/prod/server.ts`).

## Sub-docs

| Doc | Subsystem | One line |
|---|---|---|
| [core.md](./core.md) | Runtime + CLI | File routing, the h3 SSR/API/MCP pipeline (dev + prod), islands, config, middleware, auth wiring, server hardening. |
| [data.md](./data.md) | Data layer (`@apex-stack/data`) | `defineModel` as one source of truth; the shared `repository.ts` write pipeline; active-record, relations, transactions, migrations, on-device sql.js. |
| [components.md](./components.md) | `.alpine` SFC (`@apex-stack/kit`) | Parser, SSR walker/renderer + directive coverage, zero-flash hydration, scoped CSS, props/slots, the client runtime. |
| [pages.md](./pages.md) | Pages & routing | File routes, `<script server>` loaders, the page shell + state island (devalue), `client:*` island modes, layouts, loader→x-data flow, the `<script client>` scope rule. |
| [auth.md](./auth.md) | Auth & access control | Threat model + design: `defineAuth`, route gating, per-op `access` + row-level `scope`, sessions/CSRF/hardening, behaviors. *(Pre-existing — do not edit; referenced by the others.)* |

## Package layout

Apex is a pnpm monorepo (`packages/*`). Two packages are **public** (`@apex-stack/core`,
`@apex-stack/data`); the rest are implementation packages consumed through them or
the `apex` CLI (see `API.md`).

| Package | Import as | Owns |
|---|---|---|
| **`packages/apexjs`** | `@apex-stack/core` (+ `/server`, `/client`, `/testing`) & the `apex` CLI | The runtime + CLI: routing, the API/MCP/SSR request pipeline, dev & prod servers, islands orchestration, config/env, middleware, auth resolution, security hardening, the build, and the platform subsystems (cache/storage/queue/mail/realtime/notifications/authz). Entry: `packages/apexjs/src/index.ts`, `cli.ts`. |
| **`packages/kit`** | `@apex-stack/kit` (+ `/client`) — *internal* | The `.alpine` engine: the parser (`src/parse`), the SSR renderer + directive walker (`src/render`), scoped-CSS rewriting (`src/style`), the state island (devalue), and the browser runtime (`src/client` — hydration, client-side nav, HMR receiver). No Apex app logic; pure SFC compilation + render. |
| **`packages/data`** | `@apex-stack/data` | `defineModel` / `defineResource` / `createDb` / migrations; the shared `repository.ts` pipeline; active-record + relations + transactions; drivers (libSQL/Turso, Postgres, PGlite) + the on-device sql.js backend + `lazyDb`. Entry: `packages/data/src/index.ts`. |
| **`packages/vite`** | `@apex-stack/vite` — *internal* | The Vite plugin that compiles `.alpine` → SSR/client modules (`src/index.ts`, `src/compile.ts`), computes stable ids, and drives fine-grained HMR (CSS hot-swap / DOM-morph / full reload). |
| **`packages/create-apexjs`** | `npm create apexjs` / scaffold templates | The starter template (`templates/default`, incl. `AGENTS.md`) and the `apex new` scaffold generators. |

Also present: `packages/theme` + `packages/components` (themeable UI copied in via
`apex add`), `examples/`, `e2e/`, `mobile-poc/`, and `site/` — supporting, not core
subsystems.

## Reading order for a new maintainer

1. **core.md** — the request pipeline is the spine everything hangs off.
2. **components.md** — how a `.alpine` becomes hydration-safe HTML (the SSR walker).
3. **pages.md** — how a route assembles a full document (shell + island + islands).
4. **data.md** — how one model spec fans out to table/validation/REST/MCP/AR.
5. **auth.md** — how one policy object gates pages, REST, and MCP identically.

## Cross-cutting invariants (true across every subsystem)

- **One pipeline, many surfaces.** REST, MCP, and `Model.*` writes go through the
  *same* code (`packages/data/src/repository.ts`); pages/REST/MCP enforce the *same*
  auth decision (`packages/apexjs/src/auth/check.ts`). Never fork a surface.
- **h3 everywhere.** The render seam (`packages/apexjs/src/dev/renderPage.ts`) is
  deliberately server-agnostic so dev, prod, serverless, and mobile share it.
- **Server code never reaches the client.** The compiler textually excludes
  `<script server>` from the client bundle (`packages/vite/src/compile.ts`); only the
  loader's *result* is serialized (XSS-safely, via devalue).
- **Fail-closed + fail-legible.** Missing user → anonymous; 5xx bodies are generic in
  prod but the real error routes to `server/hooks.ts`; unresolvable route deps throw
  an actionable message.
