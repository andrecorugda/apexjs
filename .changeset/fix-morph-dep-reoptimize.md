---
"@apex-stack/kit": patch
"@apex-stack/core": patch
---

Fix a dev-server regression from the fine-grained morph HMR (#20): the client runtime's
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
