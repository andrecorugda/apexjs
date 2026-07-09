# apex-showcase

The **feature-complete** [Apex JS](https://apexjs.site) example — one app that exercises
every core capability of the framework. It doubles as the target for the repo's
end-to-end suite (`e2e/`). For a clean, minimal starting point instead, scaffold a
fresh app with `npm create apexjs@latest` (or `apex new`).

## Features demonstrated

| Feature | Where | What it shows |
|---|---|---|
| **SSR + file routing** | `pages/*.alpine` | Pages are server-rendered from a `loader()`, then hydrated — no flash. |
| **Dynamic routes** | `pages/blog/[slug].alpine` | Params from the file name; SSR + SEO via `head()`. |
| **Islands** | `components/Counter.alpine` + `client:load` on the home page | Ship ~zero JS by default; hydrate only what's interactive. |
| **Data & models** | `models/Message.ts`, `db/`, `server/api/messages.ts`, `pages/guestbook.alpine` | One `defineModel` → Zod schema + migration + Drizzle table + REST/MCP CRUD, over SQLite/libSQL. |
| **Behaviors** | `models/Message.ts` (`use: [timestamps()]`) | Composable lifecycle add-ons (timestamps, owned, softDeletes, auditable…). |
| **Auth** | `server/auth.ts`, `server/api/{login,logout,whoami}.ts`, `pages/account.alpine` | Sealed-cookie sessions; `auth: true` gates a route (401 anon); `ctx.user` everywhere. |
| **i18n** | `apex.config.ts`, `locales/*.json`, `pages/hello.alpine` | Server-side translation; `/fr` prefix or Accept-Language selects the catalog. |
| **AI-native / MCP** | any route with `mcp: true` | Every typed route is also a tool your AI can call at `/mcp`. |
| **Services / stores / composables** | `services/`, `stores/`, `composables/` | Thin routes → services; SSR-safe global state; reusable client logic. |
| **Theming** | `app.css`, `components/*` | Token-based; restyle everything with one `apex theme`. |

## Commands

```bash
npm run dev           # dev server → http://localhost:3000
npm run dev:islands   # static-first islands mode (ship ~zero JS)
npm run build         # production build (server target: SSR + dynamic routes + API/MCP)
npm start             # run the production server build
npm test              # run tests (Vitest) — see tests/showcase.test.ts
npm run typecheck     # strict type-check
```

## Project structure

```
pages/         File-based routes (.alpine): index, blog/, guestbook, account, hello, about.
layouts/       Shared shells; default.alpine wraps every page (<slot/>) + nav.
components/    Reusable <PascalCase/> components, themed (Button, Card, Badge, Counter).
models/        defineModel — single source of truth → schema + migration + table + REST/MCP.
db/            createDb + applyMigrations on boot; migrations/ generated from models/.
server/api/    Typed routes (defineApexRoute / model resources) — REST endpoints AND MCP tools.
server/auth.ts Identity: sessionAuth resolves ctx.user from the sealed session cookie.
locales/       i18n catalogs (en.json, fr.json).
services/      Business logic as plain classes. Keep routes thin; delegate here.
shared/        Types shared by backend + frontend.
stores/        Global, SSR-safe state ($store.x).
composables/   Reusable client logic (useX) for <script client> blocks.
tests/         Vitest tests (posts.test.ts, showcase.test.ts).
public/        Static assets served as-is.
```

## Config & environment

`apex.config.ts` declares `runtimeConfig` and `i18n`. `public.*` values reach the browser;
everything else (including `sessionPassword`) is server-only. Override any value from `.env`
— `APEX_<KEY>` (private) / `APEX_PUBLIC_<KEY>` (public). Copy `.env.example` to `.env` and set
a strong `APEX_SESSION_PASSWORD` (≥32 chars) before deploying.

Full docs: https://apexjs.site
