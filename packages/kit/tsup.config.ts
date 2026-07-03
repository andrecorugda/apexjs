import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'client/runtime': 'src/client/runtime.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  target: 'node20',
  splitting: false,
})
