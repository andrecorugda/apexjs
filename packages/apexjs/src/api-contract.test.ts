import { describe, expect, it } from 'vitest'

// Enforces the 🟢 Stable public surface of @apex-stack/core (see /API.md). If a
// Stable export disappears or changes kind, this test fails in CI — so the
// deprecation policy ("never break a Stable API without deprecating first") is
// enforced, not just intended. Imports go through the real package entry points
// (exports map + built dist), i.e. exactly what users import.
//
// Only value exports are checked (types are erased at runtime). When you
// intentionally graduate/deprecate an API, update this list AND /API.md together.

const CONTRACT: Record<string, Record<string, 'function'>> = {
  '@apex-stack/core': {
    defineApexRoute: 'function',
    defineConfig: 'function',
    env: 'function',
    useRuntimeConfig: 'function',
    defineStore: 'function',
    isApexStore: 'function',
    defineMiddleware: 'function',
    defineAuth: 'function',
    isApexResource: 'function',
  },
  '@apex-stack/core/server': {
    sessionAuth: 'function',
    login: 'function',
    logout: 'function',
    getSession: 'function',
    defineAuth: 'function',
    setStatus: 'function',
    checkCsrf: 'function',
    isCsrfSafe: 'function',
    applySecurityHeaders: 'function',
    securityHeaders: 'function',
  },
  '@apex-stack/core/testing': {
    createTestApp: 'function',
  },
  '@apex-stack/core/client': {
    registerApexComponent: 'function',
    installNav: 'function',
    createAction: 'function',
  },
}

describe('public API contract — @apex-stack/core (🟢 Stable, see /API.md)', () => {
  for (const [entry, exports] of Object.entries(CONTRACT)) {
    it(`${entry} keeps its Stable exports`, async () => {
      const mod = (await import(entry)) as Record<string, unknown>
      for (const [name, kind] of Object.entries(exports)) {
        expect(mod[name], `${entry} must export ${name}`).toBeDefined()
        expect(typeof mod[name], `${entry}.${name} must be a ${kind}`).toBe(kind)
      }
    })
  }
})
