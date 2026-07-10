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
apex make model Post title:string body:string   # models/Post.ts → migration + REST + MCP CRUD
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
`apex make <kind> …` kinds: `page component api service store layout middleware test model migration auth`.

## Project structure
```
pages/**/*.alpine   Routes. File path → URL. [param] = dynamic. index.alpine → parent path.
layouts/*.alpine    Shared shells; default.alpine wraps every page (<slot/>).
components/*.alpine  Reusable <PascalCase/> components (props via attributes).
server/api/*.ts     Typed routes (defineApexRoute) / model resources → REST + MCP.
server/auth.ts      Identity (sessionAuth) → ctx.user everywhere. (from `apex extend auth`)
models/*.ts         defineModel → schema + migration + table + REST/MCP CRUD.
db/                 createDb + migrations. Uses DATABASE_URL (Postgres) or in-memory libSQL.
locales/*.json      i18n catalogs. (from `apex extend i18n`)
services/*.ts       Business logic (classes). Keep routes thin; delegate here.
stores/*.ts         Global SSR-safe state ($store.x).
composables/*.ts    Reusable client logic (useX) for <script client>.
shared/*.ts         Types shared by server + client.
tests/*.test.ts     Vitest. createTestApp boots the whole app in-process.
```

## The `.alpine` single-file component
```alpine
<script server lang="ts">
  // Runs on the server. loader() data becomes the page's x-data (real HTML first).
  export function loader() { return { title: 'Hello' } }
  export function head() { return { title: 'Hello' } }   // SEO
</script>
<script client lang="ts">
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
- **Model** → `defineModel('posts', { fields: {…}, use: [timestamps(), owned()] })` → `.resource(handle)` mounts REST + MCP CRUD.
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
