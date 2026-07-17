# Pages & routing

**What it is.** A *page* is a `.alpine` file under `pages/` whose path is its URL. Its
`<script server>` `loader()` runs on the server, its result becomes the page's Alpine
`x-data` (real HTML first), and the framework assembles a full HTML document — shell +
SSR body + state island + client entry — that hydrates with zero flash. This doc covers
the route → document flow: loaders, the shell, `client:*` islands, layouts, the
loader→x-data data flow, and the `<script client>` scope rule.

**How it's designed.** The render seam (`packages/apexjs/src/dev/renderPage.ts`) is
deliberately **dev-server-agnostic** — the exact same `renderPage`/`renderIslandsPage`
functions run in the Vite dev server, the Node prod server, a serverless handler, and a
mobile bundle. Dev loads page modules via `vite.ssrLoadModule` per request; prod imports
pre-built modules from the manifest. Same seam, different `loadModule`.

---

## 1. File routes — `packages/apexjs/src/routing/router.ts`

`pages/**/*.alpine` is scanned into a route table (see [core.md](./core.md) §1 for the
full rules): `index.alpine` → parent path, `[param]` → dynamic segment, `[...name]` →
catch-all; precedence static < param < catch-all. `error.alpine` and `loading.alpine`
are reserved boundaries, not routes. A request resolves to `{ pageId, params }` and the
server renders `pageId`, passing `params` to the loader.

## 2. `<script server>` loaders — the compiler contract

The Vite compiler (`packages/vite/src/compile.ts`) emits a page's **SSR module** with:

- the whole `<script server>` body (so `head()` and helpers survive) + a guaranteed
  `loader` export (a no-op `() => ({})` is injected if the author didn't declare one),
- `template` (the raw inner HTML string), `rootXData`, `rootAttrs`, `componentId`,
  `scopeId`, `css`, and — when a `<script client>` exists — a compiled `rootData()`
  factory so x-data can resolve composable imports at SSR.

The client module (`ssr: false`) **never includes the `<script server>` body** — loader
code and any secrets it references are textually excluded from the browser bundle.

`renderPage` (`src/dev/renderPage.ts`) runs the loader with `{ params, url, config,
locals }`, then optionally `head({ data, params, url, config, locals })` for SEO
(`renderHead` always emits a `<title>`; page-specific `<meta>`/`<link>` carry
`data-apex-head` so client-side nav can swap exactly that set). The loader's result is
the single input to both the SSR render and the hydration state island.

## 3. The page shell + state island — `shell()` in `src/dev/renderPage.ts`

`renderComponent` (kit, [components.md](./components.md) §2) turns the template +
loaderData into hydration-safe body HTML. `shell()` then assembles the document:

- `<div id="__apex" data-apex-root>` wrapping the SSR body (the stable region
  client-side nav swaps),
- the **state island** — `stateIsland(componentId, loaderData)`, serialized with
  **devalue** (XSS-safe, round-trips Date/Map/Set/cycles — [components.md](./components.md) §7),
- one `<style data-apex-css="<scopeId>">` per source (page / layout / component) so a
  style-only dev edit hot-swaps exactly that tag,
- render-blocking `<link>`s for the global stylesheet + built CSS (so the page never
  flashes unstyled before Alpine hydrates),
- the public-config `<script>` (`clientConfigScript`), `window.__APEX_LOCALE__`, and the
  boot script.

The **boot script** imports Alpine + the page module, optionally the user client hook
(`app.client.ts`) called before `Alpine.start()`, registers global stores
(`Alpine.store(name, factory())` — same factory the server used, so hydration is
value-identical), calls `Alpine.start()`, and installs client-side nav (`installNav()`,
guarded by `window.__apexNav`). In prod the shell references the built, hashed client
bundle instead of the inline dev module.

## 4. `client:*` island modes — `src/islands/render.ts`

Two render modes exist. The **default** renderer (`renderPage`) hydrates the page as one
component root. The **islands** renderer (`renderIslandsPage`) renders static-first: the
whole tree (layout + page) goes through the islands walker, so any `client:*` directive —
page or layout — becomes an independently-hydrating island. A page with **no hydrating
islands ships zero JavaScript**.

The inlined `islandLoader` imports Alpine **lazily** on the first island that needs it,
then hydrates each on its trigger:

| Mode | Trigger |
|---|---|
| `client:load` | immediately |
| `client:idle` | `requestIdleCallback` (falls back to `setTimeout`) |
| `client:visible` | `IntersectionObserver` |
| `client:none` | never — the SSR HTML is the final static output; Alpine may never load |

`__hydrate(el)` clears both the `x-ignore` attribute and Alpine's internal `_x_ignore`
flag, then `Alpine.initTree(el)` so only that island initializes. In prod the loader is a
built bundle (`loaderHref`); the inline dev loader's bare `import('alpinejs')` only Vite
can resolve.

## 5. Layouts — `src/dev/renderPage.ts` / `src/islands/render.ts`

`layouts/<name>.alpine` wraps a page: its `<slot></slot>` is replaced by the rendered
page. `export const layout` on the page overrides the choice; `false` opts out;
otherwise `default` is used when it exists. **Layouts nest** — a layout may itself
`export const layout = '<parent>'`, wrapping again outermost-last; a `seen` set guards
against cycles. In the default renderer, layouts wrap the *rendered HTML*; in islands
mode they wrap at the *template* level (so islands in the layout, e.g. a nav toggle,
hydrate too). Each layout's scoped CSS is emitted as its own `<style>` block.

## 6. The loader → x-data data flow (end to end)

```
request → matchRoute → loadModule(pageId)     (dev: ssrLoadModule / prod: manifest import)
  → mod.loader({ params, url, config, locals })          → loaderData
  → renderComponent({ template, rootXData, loaderData, authoredDefaults: rootData?.() })
        rootData = { ...authoredDefaults, ...loaderData }  (loader wins)
  → shell(): body + stateIsland(componentId, loaderData) + boot script
  → browser: alpine:init → registerApexComponent merges factory() + parse(state island)
        (same merge order, loader wins) → value-identical hydration, no flash
```

`locals` comes from middleware + the resolved `user` (see [core.md](./core.md) §6). The
loader sees `locals.user`; it must **not** serialize secrets into its return value — the
loaderData goes into the state island, which is shipped to the client (auth.md §3.6). An
**error boundary**: if the loader throws and `pages/error.alpine` exists, that page is
rendered with `{ error }` instead of crashing.

## 7. The `<script client>` scope rule (page-root only, not islands)

`<script client>` is imports + reusable logic (composables) made available to the
template's **page-root `x-data`** on both server and client. The compiler wires it into
the root factory (`rootData()` on the server, `registerApexComponent(..., () =>
(x-data))` on the client) so a composable import resolves.

**It is page-root-scoped only. Its imports are NOT in scope inside a `client:*`
island.** An island hydrates independently (§4) — its x-data is baked/reconstructed
without the page's `<script client>` bindings. If an island needs a composable, it must
get it through props or the island component's own `<script>`. This is a documented
gotcha (create-apexjs 0.7.1 / @apex-stack/core 0.43.2 changelog).

Two related SSR rules the compiler enforces:

- **Declarations-only at SSR** (`hoistClientDeclarations`, `packages/vite/src/index.ts`,
  #53): the SSR module receives only the client body's imports + `const`/`function`/
  `class` declarations. Top-level **side effects** (`setTimeout`, `window.*`, event
  wiring) are stripped from SSR (they still ship + run in the client module). Running
  them at SSR eval was semantically wrong and crashed bare on-device engines
  (`setTimeout is not defined`).
- **Root-magic rewriting** (`rewriteRootMagics`, `packages/vite/src/compile.ts`, #47):
  a page-root `x-data` compiles into an `Alpine.data` factory (plain JS), so a bare
  plugin magic like `$persist(0)` is a `ReferenceError` there. Non-core `$magic(` calls
  are rewritten to the global form — client: via `resolveRootMagic(name, window.Alpine)`
  (real global when present, else warn-once + no-op); SSR: a silent no-op (the client
  rebinds on hydration). A magic with no global form belongs in a **nested** `<div
  x-data>`, which Alpine evaluates with all magics in scope.

## 8. HMR classification — `packages/vite/src/index.ts`

An edit to a `.alpine` is classified against the last-seen structure and dispatched over
a custom Vite event (dev only):

- **Style-only** (only `<style>` changed) → `apex:css` hot-swaps the scoped CSS in place;
  no reload, state + scroll preserved.
- **Template-markup-only** (root `x-data` + both scripts unchanged) → `apex:template`
  ships the new markup and the client **morphs the live DOM** in place (Alpine state,
  form input, scroll preserved) — [components.md](./components.md) §3.
- **Unsafe** (root `x-data` shape or a `<script>` body changed) → full reload. Islands
  pages always full-reload (they carry no HMR listener).

## 9. Client-side navigation — `packages/kit/src/client/nav.ts`

`installNav()` turns same-origin link clicks into in-place swaps: fetch the target page's
HTML, adopt its `[data-apex-root]` region, merge the `data-apex-head` tags, register the
incoming page's Alpine factory (via the `apex:page-module` meta hint), re-init Alpine on
the new subtree — shared runtime (Alpine, stores, nav) stays alive. It **degrades
safely** to a real browser navigation for cross-origin, downloads, modified clicks,
non-OK responses, or a missing swap region. Opt-in extras: a progress bar, a
`loading.alpine` slow-nav boundary, and hover/viewport prefetch. Disabled via
`apex.config.clientNav: false`.

---

## Extension points

- **A new document-shell feature** (a head tag, a boot-script hook) → `shell()` /
  `renderHead` in `src/dev/renderPage.ts`. Mirror it in `renderIslandsPage` if it should
  apply in islands mode.
- **A new island trigger** → add a mode branch in `islandLoader`
  (`src/islands/render.ts`) and accept it in `renderIslands` (kit).
- **A new page-level export** (like `layout`) → add it to `PageModule`
  (`src/dev/renderPage.ts`), have the compiler emit it, and honor it in the renderer.
- **Loader/head context** → extend the `ctx` passed to `loader`/`head`; thread the new
  field from both servers ([core.md](./core.md) §8).

## Gotchas

- **Don't put secrets in loader output** — it goes into the client-shipped state island.
- **`<script client>` imports are page-root-only** — not available inside `client:*`
  islands.
- **No top-level side effects in `<script client>` expecting SSR** — they're stripped at
  SSR and only run client-side (#53).
- **Page-root x-data can't use a bare plugin magic** — use its global form (auto-
  rewritten) or a nested `<div x-data>` (#47).
- **Islands mode ships zero JS only when nothing hydrates** — a single `client:load`
  pulls in Alpine (lazily).
- **SSR pages are `Cache-Control: no-store`** (per-request data) — static builds are
  served as files.
- Store factories run on **both** server and client with the same code — keep them
  SSR-safe (no `window` at construction).

*Grounded in: `packages/apexjs/src/dev/renderPage.ts`, `islands/render.ts`, `routing/router.ts`,
`config/runtime.ts`, `stores/loader.ts`; `packages/vite/src/compile.ts`, `packages/vite/src/index.ts`;
`packages/kit/src/render/island.ts`, `client/runtime.ts`, `client/nav.ts`; plus
`packages/create-apexjs/templates/default/AGENTS.md`, `API.md`, and the vite/core/create-apexjs CHANGELOGs.*
