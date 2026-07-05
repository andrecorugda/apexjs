---
'@apex-stack/core': patch
---

`.alpine` highlighting marks Alpine's structural tags (VS Code extension 0.1.6).

Beyond components, `<template x-for>` / `<template x-if>` are now colored as
control-flow (Alpine's loops & conditionals stand out), and `<slot>` (the
component content outlet) gets its own color. Also documents the Apex Language
Server (does-component-exist checks, go-to-definition, autocomplete) as a roadmap
item — today's extension is grammar-only.
