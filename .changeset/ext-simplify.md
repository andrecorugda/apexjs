---
'@apex-stack/core': patch
---

Simplify `.alpine` highlighting to the parts that matter, robustly (VS Code 0.1.9).

Drops the fragile `@`/`:`/slot/magic name-matching (left to the base HTML grammar,
which handles them cleanly) and the embedded-JS attribute values. What's colored now,
and reliably: **components** (`<Button>`), all **`x-` directives** (name + value
swallowed as one token so HTML never flags the value invalid), and the three
structural tags — **`<template>`**, **`<script>`**, **`<style>`** — plus the
`server`/`client`/`scoped` modifiers. Verified with the TextMate engine: zero invalid
tokens on real `.alpine` pages incl. nested `<template>`.
