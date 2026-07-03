import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  dts: true,
  clean: true,
  target: 'node20',
  external: ['better-sqlite3', 'drizzle-orm', '@apex-stack/core', 'zod'],
})
