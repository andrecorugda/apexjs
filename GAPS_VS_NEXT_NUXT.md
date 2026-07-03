# Apex JS — Gap Analysis vs Next.js & Nuxt (and the plan to close them)

> Written 2026-07-04. The goal isn't to clone Next/Nuxt — it's to give Alpine developers
> everything a modern meta-framework offers, delivered the **Apex way**: HTML-first, ~zero-JS
> by default, AI-native by construction. Where we can be more original than "port the feature",
> we should be.

## The thesis (why Apex, not a clone)

React re-imagined the *view* as a function of state. Next made it full-stack. Nuxt did the
same for Vue. Alpine already re-imagined interactivity as **HTML you can read** — no build step,
no virtual DOM, behavior colocated with markup. Apex's job is to keep that feeling while adding
the meta-framework layer, and to add the one thing none of them have: **every server surface is
an MCP tool by construction** (the AI-native moat).

So the bar for every feature below: does it preserve "it's just HTML + a little TypeScript",
and does it get an AI-callable surface for free where that makes sense?

---

## Capability matrix

Legend: ✅ have · 🟡 partial · ❌ gap

| Dimension | Next.js | Nuxt | Apex today | Priority |
|---|---|---|---|---|
| File-based routing | ✅ app/pages | ✅ pages | ✅ `pages/**` + `[param]` | — |
| Dynamic/catch-all routes | ✅ `[...slug]` | ✅ | 🟡 `[param]` only (no catch-all) | P2 |
| **Layouts / nested layouts** | ✅ | ✅ `layouts/` | ❌ | **P1** |
| Client-side navigation (SPA nav) | ✅ `<Link>` | ✅ `<NuxtLink>` | ❌ full page loads | P2 |
| Loading / error boundaries | ✅ | ✅ | 🟡 dev error page ✅, no per-route boundary | P2 |
| Server data loading | ✅ RSC/`getServerSideProps` | ✅ `useAsyncData` | ✅ `loader()` | — |
| **Composables / reusable logic** | ✅ hooks | ✅ composables (`useX`) | ❌ no pattern | **P1** |
| **Global store / shared state** | 🟡 (Context/3rd-party) | ✅ `useState`, Pinia | ❌ (`$store` throws in SSR) | **P1** |
| **Server actions / mutations** | ✅ server actions | ✅ `$fetch`+server routes | 🟡 REST via `defineApexRoute` (no form-action sugar) | P2 |
| Typed API routes | ✅ route handlers | ✅ server routes | ✅ `defineApexRoute` (+ MCP!) | — |
| Data/ORM layer | 🟡 (bring your own) | 🟡 (Nitro + bring your own) | ✅ `defineResource` (REST+MCP) | — |
| **Shared FE/BE types** | ✅ (same TS project) | ✅ | 🟡 possible, undocumented | **P1** |
| **Head / SEO / meta** | ✅ Metadata API | ✅ `useHead`/`useSeoMeta` | ❌ | **P1** |
| **Tailwind** | ✅ first-class | ✅ module | ❌ not wired | **P1** |
| Scoped styles | 🟡 CSS Modules | ✅ `<style scoped>` | ✅ `<style scoped>` | — |
| Global/shared styles | ✅ | ✅ | 🟡 works (import css) undocumented | P2 |
| **Component slots / children** | ✅ | ✅ | ❌ | P2 |
| Component data loaders | ✅ (RSC) | ✅ (async setup) | ❌ props only | P2 |
| **Editor support (.alpine)** | ✅ (.tsx native) | ✅ Volar | ❌ no highlighting | **P1** |
| Type-checking of templates | ✅ | ✅ Volar | ❌ | P3 |
| HMR | ✅ fast refresh | ✅ | 🟡 full reload (state preserved for style-only) | P2 |
| Image optimization | ✅ `<Image>` | ✅ `<NuxtImg>` | ❌ | P3 |
| Font optimization | ✅ `next/font` | ✅ `@nuxt/fonts` | ❌ | P3 |
| Env vars / runtime config | ✅ | ✅ `runtimeConfig` | 🟡 process.env only | P2 |
| Middleware | ✅ | ✅ route middleware | ❌ | P2 |
| Auth | 🟡 (NextAuth) | 🟡 (modules) | ❌ | P3 |
| Prod build (static/SSR/node) | ✅ | ✅ Nitro presets | ✅ static/islands/server | — |
| Deploy presets (Vercel/CF/…) | ✅ | ✅ Nitro | ❌ node only | P3 |
| Testing story | ✅ | ✅ `@nuxt/test-utils` | 🟡 internal tests, no user kit | P3 |
| i18n | 🟡 (3rd-party) | ✅ `@nuxt/i18n` | ❌ | P3 |
| Plugin/module ecosystem | ✅ | ✅ modules | ❌ | P3 |
| **AI-native (routes = MCP tools)** | ❌ | ❌ | ✅ **unique moat** | keep leading |

---

## The features you asked about — proposed Apex designs

### 1. Reactivity & reusable logic ("hooks/composables")
**Gap:** no way to factor logic out of `x-data` and reuse it.
**Apex way — composables as plain functions.** Alpine's `x-data` is just an object factory, so a
composable is literally a function that returns state + methods. No new runtime:

```ts
// composables/useCounter.ts
export function useCounter(start = 0) {
  return {
    count: start,
    inc() { this.count++ },
    get double() { return this.count * 2 },
  }
}
```
```html
<script client>            <!-- NEW: a client-side module block, bundled for the browser -->
  import { useCounter } from '../composables/useCounter'
</script>
<template x-data="useCounter(5)">
  <button @click="inc()" x-text="count"></button>
  <span x-text="double"></span>
</template>
```
- **Observing state changes:** expose Alpine's `$watch` (already a magic) + document `x-effect`.
  A composable can accept `$watch` or return an `init()` that Alpine calls.
- **Originality:** composables that are *just objects* compose by spread —
  `x-data="{ ...useCounter(), ...useTimer() }"` — no hook rules, no dependency arrays.
- Needs: a `<script client>` block (client-bundled, unlike `<script server>`) so imports resolve.

### 2. Global store / shared services
**Gap:** `$store` throws during SSR; no registration hook.
**Apex way — `defineStore` (SSR-safe, hydrated).** See detailed design in the store task; API:
```ts
// stores/cart.ts
import { defineStore } from '@apex-stack/core'
export default defineStore('cart', () => ({ items: [], get count(){ return this.items.length }, add(x){ this.items.push(x) } }))
```
`$store.cart.count` renders on the server, seeds into the hydration island, and is shared across
every page/component/island. **Shared services** (a logger, an API client) are the same primitive
without reactive UI — or a plain module exported once and imported where needed.

### 3. Shared types between backend & frontend
**Gap:** works today (one TS project) but undocumented and no convention.
**Apex way — a `shared/` (or `types/`) folder + inference from contracts.**
- Put cross-cutting interfaces in `shared/*.ts`; import in both `server/api/*` and `.alpine` `<script>`.
- Better: **infer** the client type from the route contract. `defineApexRoute`/`defineResource`
  already carry Zod schemas — expose `InferInput`/`InferOutput` helpers so the frontend gets the
  API's types with zero duplication (and the MCP tool, REST client, and UI all share one source).

### 4. Tailwind & shared styles
**Gap:** not wired.
**Apex way — first-class, one flag.** Wire `@tailwindcss/vite` (v4, zero-config) into the Apex Vite
setup; a scaffold option (`apex new --tailwind`) or `apex add tailwind`. Works with `<style scoped>`
(utilities global, scoped blocks local). Shared styles: a documented `app.css` imported once.

### 5. Editor support — the `.alpine` VSCode extension
**Gap:** `.alpine` shows as plain text.
**Apex way — a TextMate grammar** that embeds: HTML in `<template>`, TypeScript in
`<script server|client>`, CSS in `<style>`, plus Alpine directive highlighting (`x-*`, `@`, `:`).
Ship as a `.vsix` now; add Volar-style IntelliSense later (P3).

---

## Proposed roadmap (waves)

**Wave A — "feels like a framework" (P1, do first)**
1. `defineStore` global store (SSR + hydration).
2. Composables + `<script client>` block + shared-logic docs.
3. Layouts (`layouts/` + `<slot/>`-style page insertion).
4. Head/SEO: `useHead()` / a `<head>` block, SSR-injected.
5. Tailwind support (`@tailwindcss/vite`).
6. Shared types: `shared/` convention + `InferInput/Output` from contracts.
7. VSCode extension (.alpine grammar) → publish to Marketplace.

**Wave B — "scales to real apps" (P2)**
8. Client-side navigation (`<a>` interception, partial swap) — keep HTML-first.
9. Catch-all routes, per-route error/loading boundaries.
10. Server actions / form-action sugar over `defineApexRoute`.
11. Component slots + component-level loaders.
12. Runtime config / env, route middleware.
13. Fine-grained HMR (morph instead of full reload).

**Wave C — "ecosystem & polish" (P3)**
14. Deploy presets (Vercel/Netlify/Workers via Nitro-style adapters).
15. Image/font optimization, i18n, auth module, test kit.
16. Template type-checking (Volar), plugin/module system.

Every server-facing item (actions, middleware, resources) keeps the MCP moat: if it runs on the
server with a schema, it should be AI-callable for free.
