---
"@apex-stack/core": patch
---

Fix: `@apex-stack/core/client` now re-exports `resolveRootMagic`.

0.34.0 shipped the root-x-data magic helper in `@apex-stack/kit` and had the compiler
emit `import { resolveRootMagic } from '@apex-stack/core/client'` into page glue — but
core's client barrel forgot to forward the symbol. Any page using a plugin magic in its
root `x-data` (e.g. `$persist`) then threw `does not provide an export named
'resolveRootMagic'` at module load, so Alpine never hydrated that page (other pages were
unaffected). The one-line re-export restores it; a new `client.test.ts` locks the barrel
to the set the compiler imports so this can't regress.
