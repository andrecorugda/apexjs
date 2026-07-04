---
'@apex-stack/kit': minor
---

Apex components now work inside `x-for` and `x-if`.

Previously a component used in a loop or conditional (`<Card>` inside
`<template x-for>`) rendered correctly on the server but hydrated **unstyled** —
Alpine re-creates a template's children on the client and doesn't know the
component tag. The SSR walker now expands components *inside* template contents
into their resolved markup (slot children spliced in; props + the component's own
x-data reconstructed at runtime so they resolve per clone), so Alpine clones real
markup. This is the "Alpine Extreme" bit: component-driven lists that raw Alpine
can't express now just work.
