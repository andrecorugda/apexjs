import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { applyMigrations, createDb, parseMigration, rollbackMigrations } from './index.js'

describe('parseMigration', () => {
  it('splits up/down on the @down marker', () => {
    expect(parseMigration('CREATE X;\n-- @down\nDROP X;')).toEqual({
      up: 'CREATE X;',
      down: 'DROP X;',
    })
  })
  it('is up-only when there is no @down marker', () => {
    expect(parseMigration('CREATE X;')).toEqual({ up: 'CREATE X;', down: '' })
  })
  it('strips a leading @up marker', () => {
    expect(parseMigration('-- @up\nCREATE X;\n-- @down\nDROP X;')).toEqual({
      up: 'CREATE X;',
      down: 'DROP X;',
    })
  })
})

describe('applyMigrations + rollbackMigrations (embedded pglite)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'apex-mig-'))
  writeFileSync(
    join(dir, '001_create_widget.sql'),
    'CREATE TABLE widget (id SERIAL PRIMARY KEY, name TEXT);\n-- @down\nDROP TABLE widget;',
  )
  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  it('applies up, is idempotent, then rolls back down and can re-apply', async () => {
    const h = await createDb({ driver: 'pglite' })
    expect(await applyMigrations(h, dir)).toEqual(['001_create_widget.sql'])
    await h.exec("INSERT INTO widget (name) VALUES ('a')")
    expect(await applyMigrations(h, dir)).toEqual([]) // idempotent — already applied

    const { reverted, blocked } = await rollbackMigrations(h, dir)
    expect(reverted).toEqual(['001_create_widget.sql'])
    expect(blocked).toBeNull()
    await expect(h.query('SELECT * FROM widget')).rejects.toBeDefined() // table dropped

    expect(await applyMigrations(h, dir)).toEqual(['001_create_widget.sql']) // re-applies
    await h.close()
  })

  it('blocks rollback on a non-reversible migration (no @down)', async () => {
    const d2 = mkdtempSync(join(tmpdir(), 'apex-mig2-'))
    writeFileSync(join(d2, '001_thing.sql'), 'CREATE TABLE thing (id SERIAL PRIMARY KEY);')
    const h = await createDb({ driver: 'pglite' })
    await applyMigrations(h, d2)
    const { reverted, blocked } = await rollbackMigrations(h, d2)
    expect(reverted).toEqual([])
    expect(blocked).toBe('001_thing.sql')
    await h.close()
    rmSync(d2, { recursive: true, force: true })
  })
})
