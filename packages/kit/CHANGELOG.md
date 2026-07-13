# @apex-stack/kit

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
