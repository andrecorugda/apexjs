# AGENTS.md — building this app with an AI agent

This is an **Apex JS** app. Apex is a full-stack, AI-native meta-framework for
Alpine.js: file-based routing, SSR, islands, and **every typed API route is also
an MCP tool**. This file tells you (the agent) how to work here effectively.

## Golden rules
1. **Prefer generators over hand-writing.** Run `apex make …` / `apex extend …` /
   `apex add …` to create files — they produce correct, conventional, typed code.
   Hand-writing boilerplate is where you make mistakes.
2. **Everything has one place.** Follow the structure below; don't invent folders.
3. **Security is the framework's job, not yours.** Use `auth`/`can`/`scope` — never
   hand-roll auth. Defaults are fail-closed.
4. **Verify your work.** After changing code, run `apex check` (type gate) then
   `apex test`. Add tests with `createTestApp`. Fix type errors before moving on.
5. **TypeScript is strict.** If it compiles, it's probably right; lean on the types.

## Do things with the CLI (this is the fast path)
```bash
apex make page dashboard          # pages/dashboard.alpine (a route → /dashboard)
apex make component Card          # components/Card.alpine  (<Card /> in templates)
apex make component ui/Navbar     # group in a folder → components/ui/Navbar.alpine (<UiNavbar />)
apex make client                  # app.client.ts — register Alpine plugins/directives/magics
apex make model Article title:string body:string # models/Article.ts → defineModel('articles') → /api/articles + MCP CRUD (avoid `Post` — the starter ships a posts demo)
apex make composable Article      # composables/useArticles.ts — typed client data-hook off the model (make the model first)
apex make api webhooks            # server/api/webhooks.ts (defineApexRoute; also an MCP tool)
apex make service Billing         # services/BillingService.ts
apex extend auth                  # add sealed-cookie sessions + login/logout + /account
apex extend data                  # add a DB-backed model + /guestbook demo (Supabase-ready)
apex extend i18n                  # add locales/*.json + /fr routing
apex add button card modal        # copy themeable UI components in
apex migrate                      # apply DB migrations
apex check                        # type-check (tsc --noEmit; fast with the native compiler)
apex build --preset vercel        # build + Vercel config (also: netlify, docker); then deploy
apex test                         # run Vitest
```
`apex make <kind> …` kinds: `page component api service store layout middleware test model migration auth client composable`.

**Data flow, end to end.** One `defineModel` drives the whole stack: schema + migration + REST (`/api/articles` list/get/create/update/delete) + MCP tools **and** the client. `apex make composable Article` emits `composables/useArticles.ts` — a typed `useArticles()` returning `items / loading / error` + `fetch / find / create / update / remove` bound to that resource. Spread it into an x-data:
```alpine
<script client>
  import { useArticles } from '../composables/useArticles'
</script>
<template x-data="{ ...useArticles(), init() { this.fetch() } }">
  <template x-for="p in items" :key="p.id"><li x-text="p.title"></li></template>
</template>
```

## Project structure
```
pages/**/*.alpine   Routes. File path → URL. [param] = dynamic. index.alpine → parent path.
layouts/*.alpine    Shared shells; default.alpine wraps every page (<slot/>).
components/**/*.alpine  Reusable <PascalCase/> components (props via attributes). Group in
                     folders: components/ui/Card.alpine → <UiCard/> (folder-namespaced, Nuxt-style).
server/api/*.ts     Typed routes (defineApexRoute) / model resources → REST + MCP.
server/auth.ts      Identity (sessionAuth) → ctx.user everywhere. (from `apex extend auth`)
models/*.ts         defineModel → schema + migration + table + REST/MCP CRUD.
db/                 createDb + migrations. Uses DATABASE_URL (Postgres) or in-memory libSQL.
locales/*.json      i18n catalogs. (from `apex extend i18n`)
services/*.ts       Business logic (classes). Keep routes thin; delegate here.
stores/*.ts         Global SSR-safe state ($store.x).
composables/*.ts    Reusable client logic (useX) for <script client>.
app.client.ts       Optional. Default-exports (Alpine) => {…}, run BEFORE Alpine.start() —
                     register Alpine plugins ($persist, x-intersect, x-mask…), directives, magics.
shared/*.ts         Types shared by server + client.
tests/*.test.ts     Vitest. createTestApp boots the whole app in-process.
```

## The `.alpine` single-file component
`.alpine` is **TypeScript-only** — `<script>` blocks are always TS; `lang` is optional
(a `lang="js"` is a parse error).
```alpine
<script server>
  // Runs on the server. loader() data becomes the page's x-data (real HTML first).
  export function loader() { return { title: 'Hello' } }
  export function head() { return { title: 'Hello' } }   // SEO
</script>
<script client>
  // Optional client-only logic; import composables here.
</script>
<template x-data>
  <h1 x-text="title"></h1>
  <Counter start="0" client:load />   <!-- island: client:load | client:visible | client:idle -->
</template>
<style scoped> h1 { color: var(--color-primary); } </style>
```

## APIs you'll use (import from `@apex-stack/core`, `/server`, `/testing`; data from `@apex-stack/data`)
- **Route** → `defineApexRoute({ method, input: { …zod }, mcp: true, auth: true, can, handler })`. `mcp: true` makes it an AI-callable tool at `/mcp`.
- **Model** → `defineModel('articles', { fields: {…}, use: [timestamps(), owned()] })` → `.resource(handle)` mounts REST + MCP CRUD. Its route imports `@apex-stack/data`, so install it (`npm i @apex-stack/data @libsql/client`) — otherwise `createTestApp` can't mount `/api` and every API test errors (or pass `createTestApp({ root, lenientRoutes: true })` to skip unresolvable routes).
- **Query a model (active-record — do NOT hand-write SQL)** → the model object *is* the query API. Pass your db handle (`db` from `db/index.ts`):
  ```ts
  await Player.first(db)                                   // first row, or null
  await Player.find(db, id)                                // by primary key
  await Player.where({ team: 'A', plays: { gt: 5, lte: 100 } }) // ops: eq/ne/gt/gte/lt/lte/like/in/notIn/isNull
    .orderBy('plays', 'desc').limit(10).all(db)            // + .offset() .orWhere() .count() .exists() .pluck() .sum/avg/min/max()
  await Player.create(db, { handle: 'ada', plays: 0 })     // → the inserted row
  await Player.updateOrCreate(db, { handle: 'ada' }, { plays: 10 })
  await Player.upsert(db, ['handle'], { handle: 'ada', plays: 99 }, { keep: { plays: 'max' } }) // high-score
  await Player.update(db, id, { plays: raw('plays + 1') }) // raw() = a trusted SQL expression
  await Player.count(db, { team: 'A' }); await Player.delete(db, { team: 'A' })
  ```
  Writes go through the **same pipeline as your REST/MCP resource**: `create/update/updateOrCreate/delete` fire your model's hooks (`timestamps()`, `observable()`, `auditable()`), apply row-level `scope`, respect `softDeletes()`, and validate the payload — so `Model.*` and `/api/*` never diverge. Pass `{ user }` as the last arg to apply tenant scope (`Player.all(db, { user })`). Column names are validated against the model's fields (a typo throws — never an injection vector); values are bound; booleans/JSON hydrate automatically. Works identically on sqlite/Postgres/on-device. (`upsert` is a fast bulk primitive — it bypasses per-row hooks, like Eloquent's; use `updateOrCreate` when you need them.) Only drop to `db.query(sql, params)` (bound `?` placeholders) for something the API can't express — never string-concatenate values into SQL.
- **Auth** → `server/auth.ts` default-exports `sessionAuth({ password })`; gate routes with `auth: true` / `can`. In loaders, the user is `locals.user`.
- **Config** → `apex.config.ts`: `defineConfig({ runtimeConfig: { …, public: {…} }, i18n: {…} })`. Read with `useRuntimeConfig()`.
- **Test** → `createTestApp({ root })` → `app.get/post(path, body?, { user })`, `app.mcp.listTools()`.

The full stability contract of public APIs is in the framework's `API.md` — 🟢 Stable ones won't break; 🟡 Experimental ones might.

## Deploy
`apex build --preset vercel|netlify|docker`. Set `DATABASE_URL` (Supabase/Neon/Postgres or Turso) + `APEX_SESSION_PASSWORD` (≥32 chars) in the host env. See the deploy docs.

## Drive Apex as MCP tools (optional, powerful)
Apex ships an MCP server for its own CLI — run `apex mcp-server` (stdio). Point your
agent host at it to get `apex_make`, `apex_extend`, `apex_add`, `apex_build`, `apex_list`,
`apex_project_info`, `apex_check`, and `apex_test` as structured tools, so you scaffold,
type-check, and test by calling tools instead of shelling out.

Docs: https://apexjs.site/docs/
