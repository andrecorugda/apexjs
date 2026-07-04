# {{name}}

An [Apex JS](https://apexjs.site) app — HTML-first, server-rendered, AI-native.

## Commands

```bash
npm run dev          # dev server → http://localhost:3000
npm run dev:islands  # static-first islands mode (ship ~zero JS)
npm run build        # production build
npm start            # run the production server build
npm test             # run tests (Vitest)
npm run typecheck    # strict type-check
```

> `apex` is a project command — run it via `npm run dev`, or install it globally
> (`npm i -g @apex-stack/core`) to use `apex dev` directly.

## Project structure

```
pages/         File-based routes (.alpine) — server-rendered, then hydrated.
layouts/       Shared page shells; default.alpine wraps every page (<slot/>).
components/    Reusable <PascalCase/> components with scoped styles.
server/api/    Typed routes (defineApexRoute) — each is a REST endpoint AND an MCP tool.
services/      Business logic as plain OO classes. Keep routes thin; delegate here.
shared/        Types/interfaces shared by the backend and the frontend.
stores/        Global, SSR-safe state — $store.x, reactive across pages/islands.
composables/   Reusable client logic (useX) for <script client> blocks.
tests/         Vitest tests. `npm test` runs them.
db/            Optional: a database + resources. See db/README.md.
public/        Static assets served as-is.
```

## Conventions (clean code)

- **Thin routes → services.** A route/loader validates input and delegates to a service
  class in `services/`. Business logic stays testable in isolation and reusable everywhere.
- **Types live in `shared/`.** One source of truth; strict TypeScript enforces them across
  backend and frontend — no drift.
- **Tests by default.** `npm test` runs Vitest (see `tests/greeting.test.ts`).

## Generators

```bash
apex make page about
apex make component Card
apex make api todos
apex make service Billing     # → services/BillingService.ts (OO class)
apex make store cart
apex make layout marketing
apex make middleware auth      # → middleware/auth.ts (runs on every request)
apex make test billing         # → tests/billing.test.ts
```

## Styling

- **Scoped by default.** A `<style scoped>` block in an `.alpine` file is scoped to that component.
- **Global / shared styles.** Create `app.css` (also `styles/app.css` or `src/app.css`) in the
  project root — Apex auto-loads and processes it (Vite HMR in dev, bundled in build).
- **Tailwind.** `npm i tailwindcss @tailwindcss/vite`, then `@import "tailwindcss";` at the top of
  `app.css`. Apex auto-detects `@tailwindcss/vite` — no extra config.

## Config & environment

`apex.config.ts` declares `runtimeConfig` (see the file's comments). `public.*` values reach the
browser; everything else is server-only. Override any value from `.env` — `APEX_<KEY>` (private) /
`APEX_PUBLIC_<KEY>` (public). Read it via the loader/route `config` argument, `useRuntimeConfig()`,
or `env('KEY', fallback)`. Real environment variables always win — build once, deploy with env.

## Upgrading

Adopt new scaffold defaults in this app without touching your code:

```bash
apex upgrade        # adds any new template files; never overwrites yours (package.json preserved)
```

Full docs: https://apexjs.site
