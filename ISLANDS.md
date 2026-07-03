# Apex JS — Islands

> Static-first pages. Ship **zero JavaScript** until an island actually needs it.

Alpine is islands-native by design — it only ever activates `x-data` roots. Apex makes that
explicit and lazy: a page is static HTML, and interactive regions ("islands") hydrate
individually, on a trigger, loading Alpine only at that moment.

## Directives

```html
<template>
  <h1 x-text="title"></h1>                 <!-- static, 0 KB JS -->

  <section x-data="{ n: 0 }" client:load>  <!-- hydrate immediately -->
    <button @click="n++" x-text="n"></button>
  </section>

  <section x-data="{ n: 0 }" client:visible><!-- hydrate when scrolled into view -->
    <button @click="n++" x-text="n"></button>
  </section>

  <aside x-data="{}" client:idle> … </aside> <!-- hydrate when the browser is idle -->
  <div x-data="{}" client:none> … </div>      <!-- SSR only, never ships JS -->
</template>
```

Run with `apex dev --islands`.

## How it works

1. **SSR** — the whole page is server-rendered (static HTML *and* island subtrees, evaluated
   against `loader()` data). Every `client:*` element is marked `data-apex-island` +
   `data-apex-client="<mode>"` and `x-ignore`d so global Alpine never auto-hydrates it.
2. **Lazy loader** — a tiny inline script (shipped only if the page has hydrating islands)
   sets up each island's trigger. Alpine is `import()`ed **lazily on the first island that
   needs it** — a `client:none`-only or fully static page loads Alpine never.
3. **Per-island hydration** — on trigger: clear the island's `x-ignore` (attribute *and*
   Alpine's internal `_x_ignore` property, set during the global start) and call
   `Alpine.initTree(el)` on just that element.

## Proven end-to-end

`playground/islands` — static header + a `client:none` island + a below-the-fold
`client:visible` island. Verified by Playwright:

| Gate | Result |
| --- | --- |
| Content is server-rendered (heading, both islands) | ✅ |
| **Zero Alpine JS requested on load** (nothing above the fold hydrates) | ✅ |
| Scrolling the `client:visible` island into view loads Alpine + hydrates it | ✅ |
| The hydrated island is interactive (`@click` increments) | ✅ |
| `client:none` renders on the server and **never** hydrates (button inert) | ✅ |

Plus kit unit tests covering all four modes (`load` / `idle` / `visible` / `none`) and the
"fully static ⇒ zero hydrating islands ⇒ no JS" case.

## The three pillars are now all real

- **Light** — Alpine + islands, zero JS by default ✅
- **Full-stack** — SSR + typed API routes ✅
- **AI-native** — every typed route is an MCP tool ([MCP.md](./MCP.md)) ✅

## Deferred

- `x-for` / `x-if` inside islands (needs per-island `data-apex-ssr` clone removal at
  `initTree` time rather than the global `alpine:init`).
- Component-file islands (`<Counter client:visible />`) — arrives with the Phase 1 component
  system; the current spike uses inline `x-data` islands.
- Islands mode as an automatic per-page choice rather than a dev flag.
