import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.ts', 'examples/*/tests/**/*.test.ts'],
    environment: 'node',
    // Embedded-database tests (PGlite / sql.js) instantiate WASM engines; under parallel
    // load they can exceed the 5s default. Give the suite headroom so it stays deterministic.
    testTimeout: 30000,
  },
})
