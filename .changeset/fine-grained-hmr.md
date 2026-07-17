---
"@apex-stack/vite": minor
"@apex-stack/kit": minor
---

Fine-grained (DOM-morphing) HMR for `.alpine` templates.

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
