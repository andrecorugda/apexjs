import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// Source of truth for the registry (bundled into the CLI at build time).
const REG = fileURLToPath(new URL('../../../components/registry', import.meta.url))

describe('component registry', () => {
  const registry = JSON.parse(readFileSync(join(REG, 'registry.json'), 'utf8')) as Record<
    string,
    { name: string; file: string; description: string }
  >

  it('lists the seed components', () => {
    expect(Object.keys(registry)).toEqual(expect.arrayContaining(['button', 'card', 'badge']))
    expect(registry.button?.name).toBe('Button')
  })

  it('every entry points at a real .alpine file that inherits the theme tokens', () => {
    for (const entry of Object.values(registry)) {
      const file = join(REG, entry.file)
      expect(existsSync(file), `${entry.file} exists`).toBe(true)
      // Themeable: styled via the theme's token utilities (primary/surface/outline/on-*/radius…).
      expect(readFileSync(file, 'utf8')).toMatch(
        /(primary|secondary|surface|outline|on-surface|on-primary)|rounded-radius/,
      )
    }
  })
})
