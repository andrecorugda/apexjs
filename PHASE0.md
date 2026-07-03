# Apex JS — Phase 0 Spike Report

**Verdict: ✅ GO.** Both risky bets are proven. The architecture holds; proceed to v0.1 "Base Camp".

## What Phase 0 set out to prove

1. **SSR bet** — an `.alpine` single-file component can be server-rendered against `loader()` data into HTML that Alpine hydrates with **no visible flash**.
2. **DX bet** — `.alpine` files flow through a Vite transform with working HMR.

## Results

Run `pnpm test` (42 unit tests) and `pnpm test:e2e` (6 browser gates).

| Gate | What it proves | Result |
| --- | --- | --- |
| 1 | SSR/SEO: real content in the raw HTML response before any JS | ✅ |
| 3 | First paint is the SSR content even with JavaScript disabled | ✅ |
| 3b | The `x-for` list never empties during hydration (atomic remove→recreate) | ✅ |
| 4 | Hydration works; clicking is reactive; **no boot duplication** (exactly 3→4 items) | ✅ |
| 5 | Editing a `.alpine` file updates the browser with no manual reload (HMR) | ✅ |
| 6 | `x-show` / `:class` fidelity matches between server and client | ✅ |

## How it works

- **`@apexjs/kit`** — parses `.alpine` SFCs (htmlparser2, depth-0 splitting so nested `<template x-for>` survives), evaluates Alpine expressions server-side (`new Function`/`with` + a `mergeProxies`-style scope stack, matching Alpine's own evaluator), and renders directives (`x-text/html/show/if/for`, `:class/:style/:attr`) against loader data using linkedom. Loader data is serialized with **devalue** (XSS-safe) into a state island.
- **No-flash mechanism** — `x-text`/`x-show`/`:class` self-heal (Alpine re-applies identical values in the same task). `x-if`/`x-for` clones are marked `data-apex-ssr`; a <1 KB client runtime removes them on `alpine:init`, and Alpine synchronously recreates identical nodes before paint. Gate 3b confirms the swap is atomic.
- **`@apexjs/vite`** — transforms `.alpine` into an SSR module (`loader`, `template`, ids, scoped CSS) or a client module (registers `Alpine.data`, arms HMR). `<script server>` code is textually excluded from the client bundle — verified by test.
- **`apexjs` dev server** — Vite middleware mode fronted by an h3 app; the SSR render path is written as an h3 handler so it can move to Nitro unchanged.

## Deferred to later phases

- Adoption-based x-for hydration (preserve DOM identity instead of remove-on-boot)
- `x-model` initial `value`/`checked` seeding
- File-based routing (spike renders a single hardcoded route)
- Nitro integration + deploy presets, SSG
- Fine-grained template HMR (currently full reload)
- Real `create-apexjs` scaffolder, docs site, plugin API
