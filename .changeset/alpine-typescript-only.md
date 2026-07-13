---
"@apex-stack/kit": minor
"@apex-stack/core": minor
"create-apexjs": patch
---

`.alpine` components are now strictly TypeScript.

The `<script>` parser rejects `lang="js"` (and any non-`ts` value) with a clear
error — `lang` is optional and always defaults to `ts`. This removes the
ambiguity of a JS/TS toggle that never fully worked (loaders, `head()`, and
composables were always type-checked as TS regardless of the attribute).

Templates, examples, and docs are swept to bare `<script server>` /
`<script client>` (no redundant `lang="ts"`).
