import { describe, expect, it } from 'vitest'

// Enforces the 🟢 Stable public surface of @apex-stack/data (see /API.md). Fails
// in CI if a Stable export disappears or changes kind. Value exports only (types
// are erased). Update this list + /API.md together when you deliberately change
// the surface.

const STABLE: Record<string, 'function'> = {
  defineModel: 'function',
  defineResource: 'function',
  createDb: 'function',
  applyMigrations: 'function',
  rollbackMigrations: 'function',
  timestamps: 'function',
  owned: 'function',
  softDeletes: 'function',
  composeBehaviors: 'function',
  factory: 'function',
}

describe('public API contract — @apex-stack/data (🟢 Stable, see /API.md)', () => {
  it('keeps its Stable exports', async () => {
    const mod = (await import('@apex-stack/data')) as Record<string, unknown>
    for (const [name, kind] of Object.entries(STABLE)) {
      expect(mod[name], `@apex-stack/data must export ${name}`).toBeDefined()
      expect(typeof mod[name], `@apex-stack/data.${name} must be a ${kind}`).toBe(kind)
    }
  })
})
