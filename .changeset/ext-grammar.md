---
'@apex-stack/core': patch
---

Richer `.alpine` syntax highlighting (VS Code extension 0.1.5).

Component tags (`<Button>`, `<Card/>`) are now colored as component types (they
previously rendered like plain HTML tags), plus better coverage for Alpine
directives (`x-*` with `:arg` split), event modifiers (`@click.prevent.window`),
binds (`:class`), islands directives (`client:load|idle|visible|none`), Alpine
magics (`$refs`, `$store`, …), and `<script server|client lang>` / `<style scoped>`.
