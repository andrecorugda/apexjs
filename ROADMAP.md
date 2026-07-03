# Apex JS Roadmap

**Positioning:** *HTML-first apps, AI-native APIs.* Three pillars:

- **Light** — Alpine + islands, near-zero JS by default
- **Full-stack** — file routing, SSR, typed API routes on Node
- **AI-native** — every typed route is also an MCP tool, no extra lib

## Strategy

Don't out-build Laravel/Rails feature-by-feature. **Curate + integrate** best-in-class Node
libraries, wrap them in Apex conventions + one CLI, and give each an **MCP hook**. The moat is
that *every model, route, and job is AI-callable by construction* — nothing else has that.

| Concern | Leverage (don't rebuild) | Apex twist |
| --- | --- | --- |
| ORM + migrations | Drizzle | models/queries exposable as MCP tools |
| CLI + generators | citty | `apex make:*`, `apex migrate` |
| Jobs + queues | BullMQ | a job = an MCP tool; queue state AI-observable |
| Events + observers | thin event bus + model hooks | lifecycle events → watchers/MCP |
| Validation | zod | one schema → REST + MCP + TS types |
| Auth | Lucia / Auth.js | route + tool scoping in one place |

## Status

### ✅ Phase 0 — Spike ([PHASE0.md](./PHASE0.md))
`.alpine` SFC → SSR (hydration-safe, no flash) + Vite HMR. Proven.

### ✅ AI-native APIs ([MCP.md](./MCP.md))
`defineApexRoute` serves REST **and** an auto-MCP tool at `/mcp`. `apex mcp` CLI inspector.

### ✅ Islands ([ISLANDS.md](./ISLANDS.md))
`apex dev --islands` — static-first, per-island lazy hydration (`client:load|idle|visible|none`),
zero JS until an island needs it.

### ✅ Phase 1 — Base Camp
- File-based routing: `pages/**/*.alpine`, static + `[param]` dynamic segments, 404s.
- Component embedding: `<Counter start="5" />` → `components/Counter.alpine`, props (static + `:bound`),
  resolved x-data baked as a prop-free literal for hydration; works as component islands too.
- `create-apexjs` scaffolder: `npm create apexjs@latest`.

### ◑ Phase 2 — Data ([DATA.md](./DATA.md))
- **Done:** `@apex-stack/data` — Drizzle + SQLite, `createDb`, SQL-file `applyMigrations`, and
  `defineResource` (list/get/create) where one table → REST endpoints **and** MCP tools on one DB.
  Proven: an MCP-tool write is visible via the REST list.
  Full CRUD (list/get/create/update/delete). `apex migrate` CLI + `apex make page/component/api`.
- **Next:** `apex make:model` + `drizzle-kit`-generated migrations, per-route auth scoping, more
  Drizzle drivers. SSG + Nitro prod build. Component `<script server>` loaders + slots.

### ▢ Phase 3 — Backend
Jobs/queues, events/observers, auth — all MCP-aware.

## Known deferrals
- `x-for`/`x-if` inside islands (per-island clone removal at `initTree`).
- Component `<script server>` loaders, slots.
- Nitro production build + deploy presets (dev server is h3 + Vite middleware today).
- `outputSchema` → MCP structured content; route-level auth scoping for tools.
