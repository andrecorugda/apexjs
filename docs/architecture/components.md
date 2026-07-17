# Components — the `.alpine` SFC engine (`@apex-stack/kit`)

**What it is.** `packages/kit` compiles and renders the `.alpine` single-file
component: a `<script server>` loader, a `<script client>` block, a `<template>`, and
`<style scoped>`. It parses the file, SSR-renders the template to hydration-safe HTML
against loader data, scopes CSS, and ships a tiny browser runtime that hydrates Alpine
with **zero flash**. Kit is *internal* — apps consume it through `@apex-stack/core`.

**How it's designed.** Kit does the DOM work with **linkedom** (a literal, no-tree-
construction DOM) on the server and hands **real Alpine** the same markup on the client.
The core trick is that the server produces exactly what Alpine would produce, then the
client removes-and-reinserts the dynamic bits in the *same task before paint* — so
hydration is value-identical and flash-free. The parse → compile → render split keeps
each stage testable in isolation.

---

## 1. The parser — `src/parse/parseAlpineFile.ts`

`parseAlpineFile(source, filename)` splits a `.alpine` into `{ script, clientScript,
template, styles }`. It uses **htmlparser2 as a SAX stream** and only treats **depth-0**
tags as block delimiters — that's what makes a nested `<template x-for>` inside the
top-level `<template>` safe (a naive regex would truncate at the first inner
`</template>`). Inner content is sliced verbatim from the source (no reserialization),
so offsets stay accurate. Rules it enforces:

- Only `<script>`, `<template>`, `<style>` are allowed at the top level.
- A `<script>` must be marked `server` or `client`; duplicates of either error.
- **TypeScript-only**: `lang` is optional (defaults to `ts`); `lang="js"` is a **parse
  error**.
- At most one top-level `<template>`; `<style scoped>` is flagged for scoping.

The compiler (`@apex-stack/vite`, [pages.md](./pages.md) §2) consumes this descriptor
to emit the SSR + client modules.

## 2. The SSR walker/renderer — `src/render/renderComponent.ts`

`renderComponent({ template, rootXData, componentId, scopeId, loaderData, registry,
stores, authoredDefaults, rootAttrs })` → `{ html, rootData }`. The pipeline:

1. **Rewrite component tags** — `rewriteComponentTags` turns `<PascalCase/>` into
   `<apex-component data-apex-name>` *before* parsing (the DOM lowercases tags).
2. **Parse literally** with linkedom (wrapped in `<html><body>` so `document.body`
   populates).
3. **Emit a real root `<div x-data="apex_<id>">`** — the SFC's top-level `<template>` is
   an authoring wrapper (a `<template>` can't host a live x-data). Its `rootAttrs`
   (`x-init`, `x-effect`, `@events`, …) are carried onto the div so Alpine runs them on
   hydration.
4. **Merge scope** — `{ ...authoredDefaults, ...loaderData }` (loader wins). Defaults
   come from a compiled `rootData()` factory when a `<script client>` exists (real JS —
   resolves composable imports), else from sandbox-evaluating the `x-data` string.
5. **Walk the tree** (`walkChildren`/`walkElement`), applying directives against layered
   scopes (`ScopeLayer[]`), and stamp the scope attribute on every element.

### Directive coverage (server side)

`walkElement` handles, per element:

| Directive | SSR behavior |
|---|---|
| `:attr` / `x-bind:attr` | evaluated → written as a real attribute (`resolveBindTarget` + `applyBinding`) |
| `x-model` | emits the field's initial state (value/checked/selected) so controlled inputs don't flash empty — matches Alpine's own client binding, per input type (text/checkbox/radio/select/textarea) |
| `x-show` | inlines `display: none` when falsy |
| `x-text` / `x-html` | replaces content with the evaluated value |
| `x-for` (`<template x-for>`) | `renderFor` — evaluates the iterable, inserts a `[data-apex-ssr]` clone per item after the `<template>` (matching Alpine), walks each clone in its item scope |
| `x-if` (`<template x-if>`) | `renderIf` — renders the clone once if truthy |
| nested `x-data` | pushes a new `ScopeLayer` for that subtree |
| `x-cloak` | removed (SSR already produced correct content) |
| `@`/`x-on:` | left in place (behavioral — Alpine rebinds on the client) |

Structural directives live on `<template>` elements; everything else recurses into
children unless `x-text`/`x-html` replaced them.

`renderFragment` (no root wrapper) renders a template fragment against a scope — used by
layouts and slots. `renderIslands` (§4) walks the whole page then marks `client:*`
elements as islands.

## 3. Zero-flash hydration — `src/client/runtime.ts`

The browser runtime does two jobs, both **synchronously inside `alpine:init`** (fires
during `Alpine.start()`, before Alpine walks the DOM):

1. **Register each component's `Alpine.data` factory**, merging authored x-data defaults
   with the server's loader state via `Object.assign` (not spread — so a composable's
   `get double()` getter survives; loader state overlays plain values on top, **loader
   wins** — the exact order the server used). State is read from the `[data-apex-state]`
   island and parsed with **devalue** (`readState`).
2. **Remove server-rendered `[data-apex-ssr]` clones** (the x-for/x-if output) so Alpine
   recreates them cleanly on its first pass. Because the removal and Alpine's
   re-insertion happen in the **same task before paint, there is no flash** — this is the
   "remove-and-reinsert" strategy.

`registerApexComponent(id, factory)` registers immediately if Alpine is already running
(a client-side navigation), else arms the `alpine:init` listener. `resolveRootMagic`
handles plugin magics (`$persist`) that only exist in global form
(`Alpine.$persist`) when used in a page-root x-data (see [pages.md](./pages.md) §6).

The **DOM-morph HMR receiver** (`src/client/hmr.ts`, self-installed on import) applies a
template-only edit by morphing the live DOM in place (`src/morph.ts`) — Alpine state,
form input, and scroll preserved. The morph classification lives in the Vite plugin
(§ pages.md §7).

## 4. Islands — `renderIslands` in `src/render/renderComponent.ts`

`renderIslands(template, data, scopeId, registry)` SSR-renders the whole template, then
for every element carrying a `client:*` directive:

- reads the mode (`load`/`idle`/`visible`/`none`), removes the `client:*` attribute,
- tags it `data-apex-island` + `data-apex-client="<mode>"`,
- sets `x-ignore` so **global Alpine never auto-hydrates it** (the lazy loader clears
  `x-ignore` on the one island it hydrates; `none` islands stay ignored forever),
- counts it toward `hydratingCount` (mode ≠ `none`).

The orchestration + lazy loader are in core (`packages/apexjs/src/islands/render.ts`,
[core.md](./core.md) §7, [pages.md](./pages.md) §4).

## 5. Scoped CSS — `src/style/scopedCss.ts`

`scopeCss(css, scopeAttr)` rewrites selectors so they only match elements carrying the
component's scope attribute — Vue's SFC model. It appends the attribute to the last
compound selector of each complex selector (`.card h1` → `.card h1[data-apex-abc123]`),
using a **real `postcss-selector-parser`** (not regex — pseudo-classes, combinators, and
attribute selectors break string manipulation). Global targets (`html`, `body`, `:root`,
`:host`) are left **unscoped** (they can't carry the attribute), and `@keyframes` stops
are skipped. Each source's scoped CSS is emitted as a `<style data-apex-css="<scopeId>">`
block so a style-only edit can hot-swap exactly that tag in dev.

## 6. Component props + slots — `renderComponentInstance` / `buildStructuralComponent`

An embedded `<Counter :start="n" client:load>` is rendered in two ways depending on
context:

- **Resolved path** (`renderComponentInstance`, plain usage): props come from usage
  attributes (`prop="x"` static, `:prop="expr"` evaluated in the parent scope). The
  component's **own `<script server>` loader runs** with those props; its result +
  props + x-data are merged (precedence **props < loader < x-data**) and **baked onto
  the wrapper as a JSON `x-data` literal** — so client hydration needs no access to the
  parent scope or props. Slot children are rendered in the **parent** scope (authored +
  styled where the component is used) and injected into the component's `<slot>` (falling
  back to the slot's default content). A `client:*` directive is forwarded to the wrapper
  for islands mode.

- **Structural path** (`buildStructuralComponent`, inside an `x-for`/`x-if`): the
  component's template is expanded into raw markup **once** so both the SSR clones and
  the kept `<template>` (which Alpine re-clones per item on the client) get real markup —
  the bit raw Alpine can't do (it doesn't know the `<apex-component>` tag). Props are
  reconstructed at runtime via a generated `x-data`, and per-item component **loaders are
  baked** (`bakeComponentLoaders`) into an inline object literal keyed by the loop `:key`
  — so each clone re-evaluates its x-data and reads its item's data with **no island and
  no extra client runtime** (identical props deduped to mitigate N+1). The component's
  own scope is stamped onto its subtree (`stampSubtreeScope`) so its scoped CSS matches.

An unknown component name renders an HTML comment (`apex: unknown component "X"`) rather
than crashing.

## 7. The state island — `src/render/island.ts`

`stateIsland(componentId, data)` emits `<script type="application/json"
data-apex-state="<id>">…</script>` serialized with **devalue** (`serializeState`), not
`JSON.stringify`: devalue is XSS-safe for HTML embedding (escapes `<`, U+2028, U+2029)
and round-trips `Date`/`Map`/`Set`/cyclic refs that JSON corrupts or throws on. The
client runtime parses it back with devalue's `parse`. This is the single channel from
server loader → client hydration.

---

## Extension points

- **A new SSR directive** → handle it in `walkElement` (`src/render/renderComponent.ts`)
  and, if structural (on `<template>`), add a `renderX` alongside `renderFor`/`renderIf`.
  Add a matching case in the client only if Alpine doesn't cover it natively.
- **A new block type in `.alpine`** → extend `TOP_LEVEL_BLOCKS` + `commitBlock` in
  `src/parse/parseAlpineFile.ts`, then teach the compiler to emit it.
- **CSS scoping behavior** → adjust `scopeCss` (`src/style/scopedCss.ts`) — mind the
  global-target and `@keyframes` exclusions.
- **Hydration strategy** → the merge order + clone removal are in
  `src/client/runtime.ts`; keep it value-identical to the SSR merge in
  `renderComponent`.
- A public kit symbol used by the compiler must be re-exported from
  `@apex-stack/core/client` (the compiler imports from there in real apps) — see
  `packages/apexjs/src/client.test.ts` (`COMPILER_GLUE`).

## Gotchas

- **`.alpine` is TypeScript-only.** `lang="js"` is a parse error; scripts default to ts.
- **The top-level `<template>` is an authoring wrapper**, not a live element — its
  `x-data` becomes the root div's factory; its *other* attributes (`x-init`, `@events`)
  must be carried explicitly (they were silently dropped before kit 0.9.1 / #51).
- **linkedom serializes a `<template>` from an internal child list, not `.content`.**
  When baking loop markup you must write `innerHTML` back to sync both the SSR clones and
  the client-cloned template (see `expandTemplateComponents`/`bakeComponentLoaders`).
- **Component hydration needs no parent scope** — everything is baked into the wrapper's
  `x-data` literal. Don't reintroduce a parent-scope dependency.
- **Islands are `x-ignore`'d**; global `Alpine.start()` hydrates nothing inside them. The
  lazy loader clears `x-ignore` per island (core §7).
- **Use devalue, not `JSON.stringify`, for anything embedded in HTML** — XSS-safety +
  Date/Map/Set round-tripping depend on it.

*Grounded in: `packages/kit/src/parse/parseAlpineFile.ts`, `render/renderComponent.ts`,
`render/island.ts`, `render/components.ts`, `style/scopedCss.ts`, `client/runtime.ts`,
`client/hmr.ts`, `client/nav.ts`, `morph.ts`, `index.ts`; plus `packages/apexjs/src/islands/render.ts`
and `packages/kit/CHANGELOG.md`.*
