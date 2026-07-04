---
"apexjs": patch
---

Fix client hydration in `apex build` output and add subpath deploy support.

- **Hydration fix**: `buildClient` matched the Vite manifest entry by exact virtual-id equality, but Vite normalizes the virtual src (prefixing `../../`), so no entry matched. The prerendered HTML then fell back to an inline `import Alpine from 'alpinejs'`, which the browser cannot resolve — pages shipped dead. Entries are now matched by suffix, so the HTML references the hashed, bundled client and hydrates.
- **Store registration**: the built client bundle never registered global `stores/*`, so `$store.*` was `undefined` after hydration (the dev shell registered them but the build did not). The built entry now imports and registers each store before `Alpine.start()`, matching the server-rendered state.
- **`apex build --base <path>`**: assets and the client href are now prefixed with a configurable base, enabling subpath deploys (e.g. `/demo/`).
