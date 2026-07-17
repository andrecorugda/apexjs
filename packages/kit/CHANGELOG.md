# @apex-stack/kit

## 0.10.1

### Patch Changes

- 7c3bef6: Fix a dev-server regression from the fine-grained morph HMR (#20): the client runtime's
  leaf deps (`morphdom`, `devalue`) were left external, so on the first `apex dev` after
  installing/upgrading, Vite discovered them lazily, triggered a dependency re-optimization,
  and forced a hard reload. During that window `.alpine` module requests briefly 404 with an
  empty MIME type, so Alpine threw `apex_c… is not defined` / `posts is not defined` mid
  morph-swap — a scary cascade of console errors on component / `x-for` / form pages.

  `@apex-stack/kit` now bundles `morphdom` + `devalue` into its client dist (both are
  browser-safe, no node deps), so there are no external leaf deps for Vite to discover and the
  first dev load is clean and stable. Verified end-to-end across the full showcase (every route,
  client-side navigation, forms, `x-for` lists, and a live HMR morph edit — new markup applied,
  no reload, form state preserved, zero console errors).

## 0.10.0

### Minor Changes

- a39517f: Fine-grained (DOM-morphing) HMR for `.alpine` templates.

  A template markup edit no longer full-reloads the page: the vite plugin ships the
  new markup over the WS (`apex:template`) and the kit client runtime morphs the live
  DOM subtree in place, preserving Alpine component state — open dropdowns, form input
  and scroll position all survive the edit.

  - `@apex-stack/vite`: `handleHotUpdate` now classifies an edit as style-only
    (`apex:css`, unchanged), template-markup-only (new `apex:template` morph message),
    or unsafe. A changed root `x-data` shape or `<script>` body still falls back to
    `full-reload`, since the `Alpine.data` factory / loader changed.
  - `@apex-stack/kit`: new `morphView` helper (`packages/kit/src/morph.ts`) and client
    receiver (`client/hmr.ts`). Morphing uses Alpine's own `@alpinejs/morph`
    (`Alpine.morph`) when present, otherwise `morphdom` with guards that preserve live
    form-control values and re-run `Alpine.initTree` only on genuinely new nodes.
    Adds a `morphdom` dependency.

- 613fd3c: Build-time image & font optimization (🟡 Experimental) — Apex matches Next/Nuxt on the
  `Image / font optimization` axis.

  - **`<Image>` kit helper** (`@apex-stack/kit` → `image`, `imageAttrs`, `imageSrcset`) — a pure,
    browser-safe function that emits a responsive, layout-stable `<img>`: `srcset` candidates
    (retina by default, or your configured widths), `sizes`, explicit `width`/`height` to avoid CLS,
    and `loading="lazy"`/`decoding="async"` defaults.
  - **Image transform** — an optional `image` block in `apex.config.ts` wires `vite-imagetools` into
    the client build for the default (`apex build`, prerender+hydrate) and `--server` targets (gated on
    config presence), turning `?w=…&format=…` candidates into
    hashed, optimized variants under `dist/`.
  - **Self-hosted fonts** — a `fonts` block copies declared font files into `dist/fonts/`, emits the
    matching `@font-face` rules, and injects `<link rel="preload" as="font" crossorigin>` hints into
    the page shell — no third-party request, no FOIT/FOUT.
  - Types-only `image?` / `fonts?` blocks added to `ApexConfig` (runtime.ts stays browser-safe).

## 0.9.1

### Patch Changes

- 4c4e830: Fix #51: a page's root `<template>` now carries directives other than `x-data` (`x-init`,
  `x-effect`, `@events`, …) onto the emitted root element, so Alpine runs them on hydration.
  Previously they were silently dropped.

  Fix #52 (mobile): the `apex build --mobile` runtime shim now provides `atob`/`btoa`, a correct
  `Buffer.toString('binary'|'base64')`, and a 4-byte-safe `TextEncoder`/`TextDecoder`, so HTML
  entities (`&nbsp;`, …) decode correctly on a bare on-device engine (they were over-escaped).

## 0.9.0

### Minor Changes

- 2d8bb33: Polish the two rough edges from the 0.33.0 verify.

  - **Smarter pluralizer** (`apex make model`). The resource normalizer now knows the
    common English irregulars and uncountables in both directions: `Person` → `people`,
    `Child` → `children`, `Datum` → `data`, `Analysis` → `analyses`, `Status` →
    `statuses` (not `stati`); `Sheep` / `Series` stay put. Still idempotent
    (`people` → `people`). Fixes the naive `Person` → `persons` result.

  - **Root x-data magic diagnostic** (#47 follow-up). A plugin magic used in a page's
    root `x-data` now routes through `resolveRootMagic(name, Alpine)` on the client:
    a magic with a global form (`$persist`) works as before; one _without_ a global form
    no longer degrades to a _silent_ no-op — it logs a one-time console warning naming the
    magic and the fix (use a nested `x-data`), then returns undefined so the page never
    crashes. The helper is imported only when a page actually uses such a magic.

## 0.8.0

### Minor Changes

- 82a7597: Generate a typed client data-hook from a model (`apex make composable`).

  - **New runtime factory** `createResourceClient<T>(name, opts?)` (exported from
    `@apex-stack/core/client`) — a reactive Alpine data object you spread into an
    `x-data`, exposing `items / current / loading / error` plus
    `fetch / find / create / update / remove`, wired to the model's `/api/<name>`
    REST resource and keeping the local list in sync.
  - **New generator** `apex make composable <Model>` reads `models/<Model>.ts` and
    emits `composables/use<Plural>.ts` — a typed `usePosts()` wrapper with the item
    interface + create-payload type lifted from `defineModel` (behaviors like
    `timestamps()` / `softDeletes()` are reflected in the shape). Also exposed as an
    MCP tool kind for AI agents.

  One `defineModel` now spans schema + migration + REST + MCP **and** the browser.
  Additive — no change to the Stable API surface.

## 0.7.0

### Minor Changes

- 3d37eb1: `.alpine` components are now strictly TypeScript.

  The `<script>` parser rejects `lang="js"` (and any non-`ts` value) with a clear
  error — `lang` is optional and always defaults to `ts`. This removes the
  ambiguity of a JS/TS toggle that never fully worked (loaders, `head()`, and
  composables were always type-checked as TS regardless of the attribute).

  Templates, examples, and docs are swept to bare `<script server>` /
  `<script client>` (no redundant `lang="ts"`).

## 0.6.0

### Minor Changes

- fc8538e: Component server loaders now run inside `x-for` / `x-if` (completes the feature).

  Each instance's loader runs once at SSR; the results are baked into the loop
  component's `x-data` as an inline object literal keyed by the loop `:key`, so the
  client re-evaluates `x-data` per clone and reads its item's slice — **no payload
  island, no extra client runtime** (it's native Alpine `x-data` evaluation). Identical
  props are deduped per render (mitigates N+1). Verified: per-item SSR data, correct
  per-clone client evaluation, and memoized loader calls. (Keyless loops over objects
  should use `:key`; primitives work either way.)

## 0.5.0

### Minor Changes

- c08dabf: Component-level server loaders (singleton).

  A component (`components/*.alpine`) can now declare a `<script server>` with
  `export function loader({ props })` — it runs on the server when the component is
  embedded, its result merges into the component's scope (available to the template +
  x-data) and is baked into the instance's `x-data` literal, so the client hydrates
  without re-fetching and no extra state island is needed. Loaders may be async; the
  SSR render pipeline is now async end-to-end.

  Great for self-contained widgets (`<Sidebar/>`, `<LatestPosts/>`, `<Dashboard/>`)
  that own their data instead of receiving everything via props. Loaders inside
  `x-for`/`x-if` are not run yet (a dev warning points you to hoist to the parent
  loader); per-item keyed-payload loop hydration is the next increment.

## 0.4.1

### Patch Changes

- 09fbadd: Fix component `<style scoped>` not applying to components rendered inside `x-for` / `x-if`.

  The in-loop (structural) component expansion stamped the component's scope id only
  on the wrapper element, leaving its inner elements unstamped — then the loop-clone
  re-walk blanketed them with the enclosing page scope. So a component's scoped CSS
  (`button[data-apex-xxx]`) never matched inside a loop (Tailwind classes still worked,
  since utilities need no scope attribute). The expansion now stamps the component's
  own scope across its whole subtree (stopping at nested component boundaries), matching
  the non-loop path. Verified with a nested-element component in `x-for`.

## 0.4.0

### Minor Changes

- eadbd06: Client-side navigation (SPA) + loading boundary + prefetch.

  Same-origin link clicks now swap pages in place instead of full-loading: Apex
  fetches the target page's HTML, adopts its `[data-apex-root]` region, merges the
  `head()` tags (title/meta/link), registers the incoming page's Alpine factory, and
  re-initialises Alpine on the new subtree — no reload, so Alpine, stores and the nav
  layer stay alive between pages. Includes `history` push/pop with scroll restoration,
  focus management, an always-on top progress bar, hover/viewport **prefetch**, and a
  `pages/loading.alpine` boundary shown on slow navigations.

  Degrades safely: cross-origin, downloads, modified clicks, non-OK responses and
  unrecognised markup fall back to a real browser navigation. Opt out per-link with
  `data-apex-no-nav` (and `data-apex-no-prefetch`), or globally with `clientNav: false`
  in `apex.config`. Works in dev and in the built static + Node-server targets
  (browser-verified end-to-end). Islands-mode SPA nav and persistent layout regions
  are deferred (see ROADMAP).

## 0.3.0

### Minor Changes

- 005de5d: Apex components now work inside `x-for` and `x-if`.

  Previously a component used in a loop or conditional (`<Card>` inside
  `<template x-for>`) rendered correctly on the server but hydrated **unstyled** —
  Alpine re-creates a template's children on the client and doesn't know the
  component tag. The SSR walker now expands components _inside_ template contents
  into their resolved markup (slot children spliced in; props + the component's own
  x-data reconstructed at runtime so they resolve per clone), so Alpine clones real
  markup. This is the "Alpine Extreme" bit: component-driven lists that raw Alpine
  can't express now just work.

## 0.2.0

### Minor Changes

- 2f71124: Form-action sugar — `createAction(url, opts)` (from `@apex-stack/core/client`).

  Spread it into an `x-data` to bind a form to an Apex route with `pending` / `error` / `data` state and no boilerplate:

  ```html
  <script client>
    import { createAction } from "@apex-stack/core/client";
  </script>
  <template
    x-data="{ ...createAction('/api/messages', { onSuccess: () => location.reload() }) }"
  >
    <form @submit="submit($event)">
      <input name="body" />
      <button
        :disabled="pending"
        x-text="pending ? 'Saving…' : 'Post'"
      ></button>
      <p x-show="error" x-text="error"></p>
    </form>
  </template>
  ```

  Posts the form as JSON to the same typed route your REST clients + MCP tools hit — one server surface. Methods/fields survive object-spread (stays reactive).
