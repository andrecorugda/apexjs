---
'@apex-stack/core': patch
---

Fix `.alpine` highlighting breaking attribute values (VS Code extension 0.1.8).

The injection matched only the directive/bind/event **name** (`x-text`, `:href`,
`@click`), which left the base HTML tag parser staring at a dangling `="…"` and
flagging every value as `invalid.illegal.character-not-allowed-here` — so all the
markup below the first directive rendered as errors. The value-bearing patterns now
consume the whole `name="value"` and embed the expression as JS, so Alpine
expressions are highlighted (strings, operators, identifiers) and nothing is flagged
invalid. Verified against real `.alpine` pages (incl. nested `<template x-for>` /
`<template x-if>`) with the TextMate engine: zero invalid tokens.
