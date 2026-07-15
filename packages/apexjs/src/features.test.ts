import { describe, expect, it } from 'vitest'
import { featureKeys, getFeature, isFeature } from './features.js'

// The file-copy + dep-merge paths are covered end-to-end by scaffolding an app;
// here we lock down the fragile string patches (apex.config.ts / .env) and their
// idempotency — re-applying a feature must be a no-op.

const CONFIG = `import { defineConfig } from '@apex-stack/core'

export default defineConfig({
  runtimeConfig: {
    apiSecret: '', // ← APEX_API_SECRET
    public: { appName: 'x' },
  },
})
`

describe('feature recipes', () => {
  it('exposes exactly data / auth / i18n / pwa', () => {
    expect(featureKeys().sort()).toEqual(['auth', 'data', 'i18n', 'pwa'])
    expect(isFeature('auth')).toBe(true)
    expect(isFeature('nope')).toBe(false)
  })

  it('auth patchConfig injects sessionPassword, idempotently', () => {
    const once = getFeature('auth').patchConfig?.(CONFIG) ?? ''
    expect(once).toContain('sessionPassword')
    expect(getFeature('auth').patchConfig?.(once)).toBe(once) // second run: no-op
  })

  it('auth patchEnv adds APEX_SESSION_PASSWORD, idempotently', () => {
    const once = getFeature('auth').patchEnv?.('APEX_API_SECRET=\n') ?? ''
    expect(once).toContain('APEX_SESSION_PASSWORD')
    expect(getFeature('auth').patchEnv?.(once)).toBe(once)
  })

  it('i18n patchConfig adds an i18n block with en/fr, idempotently', () => {
    const once = getFeature('i18n').patchConfig?.(CONFIG) ?? ''
    expect(once).toContain('i18n:')
    expect(once).toContain("locales: ['en', 'fr']")
    expect(getFeature('i18n').patchConfig?.(once)).toBe(once)
    expect(once.trimEnd().endsWith('})')).toBe(true) // still valid defineConfig(...)
  })

  it('data has no config patch but declares its deps + nav', () => {
    expect(getFeature('data').patchConfig).toBeUndefined()
    expect(Object.keys(getFeature('data').deps ?? {})).toContain('@apex-stack/data')
    expect(getFeature('data').navLinks[0]?.href).toBe('/guestbook')
  })
})
