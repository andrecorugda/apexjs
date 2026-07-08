import { describe, expect, it } from 'vitest'
import { defineModel } from './model.js'

const todos = defineModel('todos', {
  fields: {
    title: { type: 'string', notNull: true },
    done: { type: 'boolean', default: false },
    views: { type: 'int', default: 0 },
    meta: 'json',
  },
})

describe('defineModel — zod insert shape', () => {
  it('requires NOT NULL fields without a default; others optional', () => {
    // title: notNull + no default → required
    expect(() => todos.insert.title.parse(undefined)).toThrow()
    expect(todos.insert.title.parse('hi')).toBe('hi')
    // done/views have defaults → optional; meta is nullable-ish → optional
    expect(todos.insert.done.parse(undefined)).toBeUndefined()
    expect(todos.insert.views.parse(undefined)).toBeUndefined()
    expect(todos.insert.meta.parse(undefined)).toBeUndefined()
  })

  it('coerces types', () => {
    expect(todos.insert.views.parse('5')).toBe(5)
    expect(todos.insert.done.parse('true')).toBe(true)
  })
})

describe('defineModel — migration SQL', () => {
  it('generates a dialect-appropriate CREATE TABLE (sqlite)', () => {
    const sql = todos.migrationSql('sqlite')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS todos')
    expect(sql).toContain('id INTEGER PRIMARY KEY AUTOINCREMENT')
    expect(sql).toContain('title TEXT NOT NULL')
    expect(sql).toContain('done INTEGER DEFAULT FALSE')
    expect(sql).toContain('views INTEGER DEFAULT 0')
    expect(sql).toContain('meta TEXT')
  })

  it('generates postgres types', () => {
    const sql = todos.migrationSql('postgres')
    expect(sql).toContain('id SERIAL PRIMARY KEY')
    expect(sql).toContain('meta JSONB')
    expect(sql).toContain('done BOOLEAN')
  })
})

describe('defineModel — timestamp is a JSON-Schema-safe string', () => {
  // Regression: z.coerce.date() output can't convert to JSON Schema, which crashed
  // MCP tools/list for the whole app. Timestamps are ISO strings instead.
  const events = defineModel('events', { fields: { at: 'timestamp' } })
  it('validates timestamps as ISO strings (not Date)', () => {
    expect(events.insert.at.parse('2026-01-01T00:00:00Z')).toBe('2026-01-01T00:00:00Z')
  })
  it('uses a string column type in migrations', () => {
    expect(events.migrationSql('sqlite')).toContain('at TEXT')
    expect(events.migrationSql('postgres')).toContain('at TIMESTAMP')
  })
})

describe('defineModel — table', () => {
  it('builds a Drizzle table for each dialect with the pk + fields', () => {
    const t = todos.table('sqlite') as Record<string, unknown>
    expect(t.id).toBeDefined()
    expect(t.title).toBeDefined()
    expect(t.views).toBeDefined()
    // pg variant builds too
    expect(todos.table('postgres')).toBeTruthy()
  })
})
