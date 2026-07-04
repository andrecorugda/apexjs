---
"@apex-stack/theme": minor
"@apex-stack/components": minor
"@apex-stack/core": patch
---

Adopt the PenguinUI token contract (adapted, MIT — see NOTICE).

- **`@apex-stack/theme`** now uses the PenguinUI token vocabulary (`surface / surface-alt / on-surface(-strong) / primary / secondary / on-* / outline(-strong) / info-success-warning-danger / radius / fonts` + `-dark` variants) as a Tailwind v4 `@theme` contract. Ships `theme.css` (import after `@import 'tailwindcss'`), `defineTheme()`, `renderThemeCss()`. **BREAKING**: replaces the old `--ax-*` vocabulary + drops the `/preset` export.
- **`@apex-stack/components`** — Button/Card/Badge re-authored against the tokens (`bg-primary`, `rounded-radius`, `dark:*`), so they inherit `apex theme`. Attribution `NOTICE` added.
- More components (the full PenguinUI catalog) land next.
