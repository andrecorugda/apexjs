---
"@apex-stack/core": patch
---

i18n: `createI18n` accepts an `onMissingKey(key)` hook, called when a key resolves to
nothing (before falling back to the key literal). The dev server wires it to a
`console.warn` so missing/typo'd translation keys are surfaced during `apex dev` while
production stays silent. (From i18n verification feedback.)
