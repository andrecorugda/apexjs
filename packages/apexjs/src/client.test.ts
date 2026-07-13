import { describe, expect, it } from 'vitest'
import * as coreClient from './client.js'

// The .alpine compiler (packages/vite/src/compile.ts) emits, into every page's client
// glue, an `import { … } from '@apex-stack/core/client'`. Every symbol it can reference
// there MUST be re-exported by this barrel — otherwise a page throws a runtime
// "no export named …" and hydration silently dies (regression: resolveRootMagic, the
// root-x-data plugin-magic helper (#47), was emitted but not forwarded; magic-using
// pages broke while normal pages were fine). Keep this list in lockstep with compile.ts.
const COMPILER_GLUE = ['registerApexComponent', 'resolveRootMagic'] as const

describe('@apex-stack/core/client forwards all .alpine compiler glue', () => {
  const exported = coreClient as Record<string, unknown>
  for (const name of COMPILER_GLUE) {
    it(`re-exports ${name}`, () => {
      expect(
        exported[name],
        `the .alpine compiler imports "${name}" from @apex-stack/core/client — it must be re-exported here`,
      ).toBeTypeOf('function')
    })
  }
})
