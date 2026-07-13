import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { clientEntryId } from './client-entry.js'

describe('clientEntryId', () => {
  it('returns null when no app.client file exists', () => {
    const d = mkdtempSync(join(tmpdir(), 'apex-ce-'))
    expect(clientEntryId(d)).toBeNull()
    rmSync(d, { recursive: true, force: true })
  })

  it('returns the forward-slash module id when app.client.ts exists', () => {
    const d = mkdtempSync(join(tmpdir(), 'apex-ce-'))
    writeFileSync(join(d, 'app.client.ts'), 'export default () => {}')
    expect(clientEntryId(d)).toBe('/app.client.ts')
    rmSync(d, { recursive: true, force: true })
  })
})
