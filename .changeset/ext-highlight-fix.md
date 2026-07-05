---
'@apex-stack/core': patch
---

Fix `.alpine` syntax highlighting (VS Code extension 0.1.7) — it now actually works.

The grammar's injection targeted the `text.html.basic` scope, which isn't on the
scope stack when HTML is `include`d under `source.alpine` — so **none** of the
Alpine/Apex highlighting fired (components, directives, events, binds all rendered
as plain HTML). Injecting against `source.alpine` fixes it, verified with the
TextMate engine. Also ships on-brand color defaults (`configurationDefaults`) so
components, directives, `<template x-for/x-if>`, `<slot>`, events, binds, islands,
and magics are visibly colored in any theme.
