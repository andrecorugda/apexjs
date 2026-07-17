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
  // Inline the client runtime's tiny leaf deps so downstream apps never have to resolve or
  // pre-bundle them. Left external, Vite discovers them lazily on first client import and fires
  // a dep re-optimization + hard reload — during which `.alpine` modules briefly 404 (empty MIME)
  // and Alpine throws "apex_c… is not defined" mid morph-swap. Bundled in, the client dist is
  // self-contained and the first `apex dev` load is clean. (Both are browser-safe, no node deps.)
  noExternal: ['morphdom', 'devalue'],
})
