---
'@apex-stack/core': minor
'@apex-stack/kit': minor
---

Client-side navigation (SPA) + loading boundary + prefetch.

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
