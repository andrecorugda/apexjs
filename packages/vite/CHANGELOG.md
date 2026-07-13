# @apex-stack/vite

## 0.4.0

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

### Patch Changes

- Updated dependencies [2d8bb33]
  - @apex-stack/kit@0.9.0

## 0.3.0

### Minor Changes

- 5706fce: Plugin magics with a global form (e.g. `$persist`) now work in a page's **root**
  `<template x-data>`.

  A page root's `x-data` compiles into an `Alpine.data` factory (ordinary JS), where
  a bare `$persist(0)` was a `ReferenceError` — even though it worked in a nested
  `x-data`. Apex now rewrites non-core `$magic(…)` calls in the root expression to
  Alpine's global form (`Alpine.$persist(…)`, the shape Alpine documents for use inside
  a data factory): a server-safe no-op during SSR, re-bound to the real magic on
  hydration, so it persists across reloads without throwing. A magic with no global
  form degrades to a no-op at the root (use a nested `x-data` for those). Core magics
  (`$el`, `$store`, `$refs`, …) and composable calls are left untouched. Fixes #47.

## 0.2.6

### Patch Changes

- Updated dependencies [82a7597]
  - @apex-stack/kit@0.8.0

## 0.2.5

### Patch Changes

- Updated dependencies [3d37eb1]
  - @apex-stack/kit@0.7.0

## 0.2.4

### Patch Changes

- Support Vite 7. `@apex-stack/vite` widens its `vite` peer range to include `^7`
  (still `^5`/`^6`), and `@apex-stack/core` + `create-apexjs` build and run on Vite
  7.3.x. Also bumps `citty` to 0.2.2. No public API changes.

## 0.2.3

### Patch Changes

- Updated dependencies [fc8538e]
  - @apex-stack/kit@0.6.0

## 0.2.2

### Patch Changes

- Updated dependencies [c08dabf]
  - @apex-stack/kit@0.5.0

## 0.2.1

### Patch Changes

- Updated dependencies [09fbadd]
  - @apex-stack/kit@0.4.1

## 0.2.0

### Minor Changes

- dcaa2d4: Style-only HMR (no more reload on CSS edits) + working islands in `apex build --islands`.

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

## 0.1.8

### Patch Changes

- Updated dependencies [eadbd06]
  - @apex-stack/kit@0.4.0

## 0.1.7

### Patch Changes

- Updated dependencies [005de5d]
  - @apex-stack/kit@0.3.0

## 0.1.6

### Patch Changes

- Updated dependencies [2f71124]
  - @apex-stack/kit@0.2.0
