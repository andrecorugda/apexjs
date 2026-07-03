# Apex JS — `.alpine` language support

Syntax highlighting and editor configuration for [Apex JS](https://apexjs.site) `.alpine`
single-file components.

A `.alpine` file has three parts, and this extension highlights each correctly:

```html
<script server lang="ts">          <!-- TypeScript (runs on the server) -->
  export async function loader() {
    return { posts: await db.select().from(schema.posts) }
  }
</script>

<template x-data="{ q: '' }">        <!-- HTML + Alpine directives -->
  <input x-model="q" @keyup="search()" :class="q && 'active'" />
</template>

<style scoped>                        /* CSS */
  input { border: 1px solid #6366f1; }
</style>
```

## Features
- **TypeScript** highlighting inside `<script server>` and `<script client>`.
- **CSS** highlighting inside `<style>` (scoped or global).
- **HTML** highlighting in `<template>`.
- **Alpine directives** highlighted: `x-data`, `x-for`, `x-text`, … , event `@click`, and bind `:class`.
- Bracket matching, comment toggling, and auto-closing pairs.

## Install
From a `.vsix`:
```bash
code --install-extension apex-alpine-0.1.0.vsix
```
Or find **“Apex JS — .alpine”** in the VS Code Marketplace.

## Roadmap
Template IntelliSense and type-checking (Volar-based) are planned. For now this provides
full syntax highlighting for the whole file.

MIT © Andre Corugda · part of [Apex JS](https://github.com/andrecorugda/apexjs)
