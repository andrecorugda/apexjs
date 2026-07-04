# @apex-stack/theme

## 0.3.0

### Minor Changes

- 557c35d: Adopt the PenguinUI token contract (adapted, MIT — see NOTICE).

  - **`@apex-stack/theme`** now uses the PenguinUI token vocabulary (`surface / surface-alt / on-surface(-strong) / primary / secondary / on-* / outline(-strong) / info-success-warning-danger / radius / fonts` + `-dark` variants) as a Tailwind v4 `@theme` contract. Ships `theme.css` (import after `@import 'tailwindcss'`), `defineTheme()`, `renderThemeCss()`. **BREAKING**: replaces the old `--ax-*` vocabulary + drops the `/preset` export.
  - **`@apex-stack/components`** — Button/Card/Badge re-authored against the tokens (`bg-primary`, `rounded-radius`, `dark:*`), so they inherit `apex theme`. Attribution `NOTICE` added.
  - More components (the full PenguinUI catalog) land next.

## 0.2.0

### Minor Changes

- 6bd3191: Themeable components + `apex add` (the components epic, first slice).

  - **`@apex-stack/theme`** — semantic design tokens as `--ax-*` CSS variables (light + dark), `defineTheme()` / `renderThemeCss()`, and a Tailwind preset (`bg-primary`, `rounded`, …). One theme, inherited by every component.
  - **`@apex-stack/components`** — a registry of `.alpine` components (Button, Card, Badge) styled against the theme tokens (with sane fallbacks, so they look right with or without a custom theme).
  - **`apex add <name>`** — copies a component's `.alpine` source into your `components/` (shadcn-style; non-destructive, `--force` to overwrite). `apex add` with no name lists what's available. The registry is bundled into the CLI, so it works right after `apex new`.

  Verified: changing a theme token (`primary`) restyles the component through the CSS cascade — proven end-to-end.
