# @apex-stack/kit

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
