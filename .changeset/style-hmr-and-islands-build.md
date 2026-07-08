---
'@apex-stack/core': minor
'@apex-stack/vite': minor
---

Style-only HMR (no more reload on CSS edits) + working islands in `apex build --islands`.

**HMR.** Editing a `<style>` block in any `.alpine` file now hot-swaps that
component's scoped CSS in place — no reload, Alpine state and scroll position
untouched. The shell emits one `<style data-apex-css="<scopeId>">` per source
(page / layout / component) and the Vite plugin diffs the file structure on hot
update: style-only → a custom `apex:css` event replaces exactly that tag;
template/script edits still full-reload, but now **save and restore the scroll
position** so an edit no longer dumps you back at the top of the page.

**Islands build.** `apex build --islands` previously emitted the dev island
loader inline, whose bare `import('alpinejs')` only Vite's dev server can
rewrite — in the static output the browser threw and **no island ever
hydrated**. The build now bundles a real islands runtime asset (Alpine stays a
lazily-loaded chunk, so pages without hydrating islands still ship zero JS) and
compiles the project's global stylesheet (Tailwind) alongside it, linking both
into the prerendered pages. Verified from a plain static file server:
`client:visible` hydrates on scroll and is interactive; `client:none` stays inert.
