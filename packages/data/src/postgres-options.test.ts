import { describe, expect, it } from 'vitest'
import { postgresOptions } from './index.js'

// A real Supabase/pooler connection can only be verified against a live project;
// here we lock down the option-derivation logic that makes that connection work.

const POOLER = 'postgres://postgres.abcdefgh:pw@aws-0-us-east-1.pooler.supabase.com:6543/postgres'
const DIRECT = 'postgres://postgres:pw@db.abcdefgh.supabase.co:5432/postgres'
const LOCAL = 'postgres://user:pw@localhost:5432/app'

describe('postgresOptions', () => {
  it('disables prepared statements + enables SSL on the transaction pooler', () => {
    // Supavisor/pgBouncer transaction mode can't use prepared statements.
    expect(postgresOptions(POOLER)).toEqual({ prepare: false, ssl: 'require' })
  })

  it('keeps prepared statements (default) but enables SSL on a direct remote host', () => {
    expect(postgresOptions(DIRECT)).toEqual({ ssl: 'require' }) // no `prepare` key → postgres-js default
  })

  it('leaves localhost plain — no forced SSL, no prepare override', () => {
    expect(postgresOptions(LOCAL)).toEqual({})
  })

  it('lets explicit overrides win, and maps pool/idle', () => {
    expect(postgresOptions(POOLER, { prepare: true, max: 5, idleTimeout: 20 })).toEqual({
      prepare: true, // override beats the pooler auto-disable
      ssl: 'require',
      max: 5,
      idle_timeout: 20,
    })
    expect(postgresOptions(LOCAL, { ssl: true })).toEqual({ ssl: true })
  })

  it('treats an unparseable URL as local (no forced SSL)', () => {
    expect(postgresOptions('not-a-url')).toEqual({})
  })
})
