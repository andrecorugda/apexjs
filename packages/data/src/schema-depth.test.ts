import { describe, expect, it } from 'vitest'
import { createDb } from './index.js'
import { defineModel } from './model.js'

const Team = defineModel('teams', { fields: { name: { type: 'string', notNull: true } } })
const Player = defineModel('players', {
  fields: {
    name: { type: 'string', notNull: true },
    teamId: { type: 'int', index: true, references: { table: 'teams', onDelete: 'cascade' } },
  },
  indexes: [{ on: ['name'], unique: true }],
})

describe('schema depth — foreign keys + indexes', () => {
  it('migrationSql emits REFERENCES + ON DELETE + CREATE INDEX statements', () => {
    const sql = Player.migrationSql('postgres')
    expect(sql).toContain('REFERENCES "teams"("id")')
    expect(sql).toContain('ON DELETE CASCADE')
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_players_teamId ON "players" ("teamId")')
    expect(sql).toContain(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_players_name ON "players" ("name")',
    )
  })

  it('enforces the unique index and FK cascade (Postgres)', async () => {
    const h = await createDb({ driver: 'pglite' })
    await h.exec(Team.migrationSql(h.dialect))
    await h.exec(Player.migrationSql(h.dialect))
    const t = await Team.create(h, { name: 'A' })
    await Player.create(h, { name: 'p1', teamId: t.id })
    // unique index on name is enforced
    await expect(Player.create(h, { name: 'p1', teamId: t.id })).rejects.toThrow()
    // FK ON DELETE CASCADE: removing the team removes its players
    await Team.delete(h, { id: t.id })
    expect(await Player.count(h)).toBe(0)
    await h.close()
  })
})
