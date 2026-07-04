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
apex make test billing        # → tests/billing.test.ts
```

Full docs: https://apexjs.site
