import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
    client: 'src/client.ts',
    server: 'src/server.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  target: 'node20',
  external: ['vite', 'alpinejs'],
  // Bundle the (pure) theme package so `apex theme` works from a global install.
  noExternal: [/@apex-stack\/theme/],
})
