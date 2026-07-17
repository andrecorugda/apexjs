import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
    client: 'src/client.ts',
    server: 'src/server.ts',
    testing: 'src/testing/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  target: 'node20',
  // `@resvg/resvg-js` is an optional, native (.node) module the PWA build lazily imports —
  // it's provided by the app (`apex extend pwa` adds it), never bundled into core.
  external: ['vite', 'alpinejs', '@resvg/resvg-js'],
  // Bundle the (pure) theme package so `apex theme` works from a global install.
  noExternal: [/@apex-stack\/theme/],
})
