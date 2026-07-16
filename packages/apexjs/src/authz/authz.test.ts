import { describe, expect, it } from 'vitest'
import { createFlowTokens } from './flows.js'
import type { AuthzDbHandle, SqlValue } from './handle.js'
import { createAccessControl, permissionGate } from './roles.js'
import { createTokenStore } from './tokens.js'

/**
 * A hand-rolled in-memory {@link AuthzDbHandle} that honors the `?`-placeholder contract every authz
 * module relies on, modeled on the fake in `queue.test.ts`. It's a tiny relational VM understanding
 * the exact statement shapes these modules emit: CREATE (no-op), INSERT, SELECT/DELETE with an
 * optional `WHERE` of `col = ?` / `col IN (?, …)` terms joined by AND, and UPDATE … SET … WHERE.
 * Nothing is string-concatenated by the modules — every value arrives as a bound `?` param — so this
 * VM binds params positionally and never parses a literal.
 */
function memoryHandle(): AuthzDbHandle {
  type Row = Record<string, SqlValue>
  const tables = new Map<string, Row[]>()
  const rowsOf = (t: string): Row[] => {
    let r = tables.get(t)
    if (!r) {
      r = []
      tables.set(t, r)
    }
    return r
  }
  const norm = (sql: string): string => sql.replace(/\s+/g, ' ').trim()

  // Build a row predicate from a WHERE clause, consuming params from `offset` onward.
  function predicate(
    where: string | undefined,
    params: readonly SqlValue[],
    offset: number,
  ): (row: Row) => boolean {
    if (!where) return () => true
    const checks: Array<(row: Row) => boolean> = []
    let i = offset
    for (const term of where.split(/ AND /i)) {
      const inMatch = term.match(/^(\w+) IN \(([^)]*)\)$/i)
      if (inMatch) {
        const col = inMatch[1] as string
        const count = (inMatch[2]?.match(/\?/g) ?? []).length
        const vals = params.slice(i, i + count)
        i += count
        checks.push((row) => vals.some((v) => row[col] === v))
        continue
      }
      const eqMatch = term.match(/^(\w+) = \?$/i)
      if (eqMatch) {
        const col = eqMatch[1] as string
        const val = params[i] ?? null
        i += 1
        checks.push((row) => row[col] === val)
        continue
      }
      throw new Error(`memoryHandle: unsupported WHERE term: ${term}`)
    }
    return (row) => checks.every((c) => c(row))
  }

  async function run(sql: string, params: readonly SqlValue[] = []): Promise<Row[]> {
    const s = norm(sql)
    if (/^CREATE (TABLE|UNIQUE INDEX|INDEX)/i.test(s)) return []

    const insert = s.match(/^INSERT INTO (\w+) \(([^)]+)\) VALUES \(([^)]*)\)$/i)
    if (insert) {
      const cols = (insert[2] as string).split(',').map((c) => c.trim())
      const row: Row = {}
      cols.forEach((c, idx) => {
        row[c] = params[idx] ?? null
      })
      rowsOf(insert[1] as string).push(row)
      return []
    }

    const select = s.match(/^SELECT .+? FROM (\w+)(?: WHERE (.+?))?(?: ORDER BY (.+))?$/i)
    if (select && /^SELECT/i.test(s)) {
      const test = predicate(select[2], params, 0)
      let out = rowsOf(select[1] as string)
        .filter(test)
        .map((r) => ({ ...r }))
      const order = select[3]
      if (order) {
        const [col, dir] = order.trim().split(/\s+/)
        const key = col as string
        out = out.sort((a, b) => {
          const av = a[key]
          const bv = b[key]
          const cmp = av === bv ? 0 : (av ?? 0) < (bv ?? 0) ? -1 : 1
          return /desc/i.test(dir ?? '') ? -cmp : cmp
        })
      }
      return out
    }

    const del = s.match(/^DELETE FROM (\w+)(?: WHERE (.+))?$/i)
    if (del) {
      const table = del[1] as string
      const test = predicate(del[2], params, 0)
      const kept = rowsOf(table).filter((r) => !test(r))
      tables.set(table, kept)
      return []
    }

    const update = s.match(/^UPDATE (\w+) SET (.+?) WHERE (.+)$/i)
    if (update) {
      const table = update[1] as string
      const assigns = (update[2] as string).split(',').map((a) => a.trim())
      const setCols = assigns.map((a) => (a.match(/^(\w+) = \?$/) as RegExpMatchArray)[1] as string)
      const test = predicate(update[3], params, setCols.length)
      for (const row of rowsOf(table)) {
        if (!test(row)) continue
        setCols.forEach((c, idx) => {
          row[c] = params[idx] ?? null
        })
      }
      return []
    }

    throw new Error(`memoryHandle: unhandled SQL: ${s}`)
  }

  return {
    async exec(sql, params) {
      await run(sql, params)
    },
    async query(sql, params) {
      return run(sql, params)
    },
    // Expose the raw store for white-box assertions (e.g. "no plaintext stored").
    ...({ __tables: tables } as Record<string, unknown>),
  }
}

/** A deterministic id factory. */
function seqIds(prefix: string): () => string {
  let n = 0
  return () => `${prefix}-${++n}`
}

/** Peek at a fake handle's raw table rows for white-box assertions. */
function rawRows(handle: AuthzDbHandle, table: string): Array<Record<string, unknown>> {
  const tables = (handle as unknown as { __tables: Map<string, Array<Record<string, unknown>>> })
    .__tables
  return tables.get(table) ?? []
}

async function migrate(handle: AuthzDbHandle, sql: string): Promise<void> {
  for (const stmt of sql.split(';')) {
    if (stmt.trim()) await handle.exec(`${stmt};`)
  }
}

describe('roles + permissions', () => {
  it('effective permissions are the union of role-granted and direct grants', async () => {
    const handle = memoryHandle()
    const ac = createAccessControl({ handle, idFactory: seqIds('ac') })
    await migrate(handle, ac.migrationSql())

    await ac.grantPermissionToRole('editor', 'posts.edit')
    await ac.grantPermissionToRole('editor', 'posts.publish')
    await ac.assignRole('u1', 'editor')
    await ac.giveDirectPermission('u1', 'billing.view')

    expect(await ac.rolesOf('u1')).toEqual(['editor'])
    expect(await ac.permissionsOf('u1')).toEqual(['billing.view', 'posts.edit', 'posts.publish'])
    expect(await ac.hasPermission('u1', 'posts.edit')).toBe(true)
    expect(await ac.hasPermission('u1', 'billing.view')).toBe(true)
    expect(await ac.hasPermission('u1', 'posts.delete')).toBe(false)
    expect(await ac.hasRole('u1', 'editor')).toBe(true)
    expect(await ac.hasRole('u1', 'admin')).toBe(false)
  })

  it('a user with no roles or grants has no permissions (no IN () crash)', async () => {
    const handle = memoryHandle()
    const ac = createAccessControl({ handle, idFactory: seqIds('ac') })
    await migrate(handle, ac.migrationSql())
    expect(await ac.rolesOf('ghost')).toEqual([])
    expect(await ac.permissionsOf('ghost')).toEqual([])
    expect(await ac.hasPermission('ghost', 'anything')).toBe(false)
  })

  it('revokeRole and revokePermission remove effective access', async () => {
    const handle = memoryHandle()
    const ac = createAccessControl({ handle, idFactory: seqIds('ac') })
    await migrate(handle, ac.migrationSql())

    await ac.grantPermissionToRole('editor', 'posts.edit')
    await ac.assignRole('u1', 'editor')
    await ac.giveDirectPermission('u1', 'billing.view')
    expect(await ac.permissionsOf('u1')).toEqual(['billing.view', 'posts.edit'])

    await ac.revokeRole('u1', 'editor')
    expect(await ac.rolesOf('u1')).toEqual([])
    expect(await ac.permissionsOf('u1')).toEqual(['billing.view'])

    await ac.revokePermission('u1', 'billing.view')
    expect(await ac.permissionsOf('u1')).toEqual([])
  })

  it('idempotent: repeated grants/assignments do not duplicate', async () => {
    const handle = memoryHandle()
    const ac = createAccessControl({ handle, idFactory: seqIds('ac') })
    await migrate(handle, ac.migrationSql())
    await ac.createRole('editor')
    await ac.createRole('editor')
    await ac.grantPermissionToRole('editor', 'posts.edit')
    await ac.grantPermissionToRole('editor', 'posts.edit')
    await ac.assignRole('u1', 'editor')
    await ac.assignRole('u1', 'editor')
    expect(rawRows(handle, 'roles').length).toBe(1)
    expect(rawRows(handle, 'role_permissions').length).toBe(1)
    expect(rawRows(handle, 'user_roles').length).toBe(1)
    expect(await ac.permissionsOf('u1')).toEqual(['posts.edit'])
  })

  it('permissionGate works as an access `can`, fail-closed for anonymous', async () => {
    const handle = memoryHandle()
    const ac = createAccessControl({ handle, idFactory: seqIds('ac') })
    await migrate(handle, ac.migrationSql())
    await ac.grantPermissionToRole('editor', 'posts.edit')
    await ac.assignRole('42', 'editor')

    const gate = permissionGate(ac, 'posts.edit')
    expect(await gate({ user: { id: 42 } })).toBe(true) // number id coerced to string
    expect(await gate({ user: { id: '99' } })).toBe(false)
    expect(await gate({ user: null })).toBe(false)
    expect(await gate({ user: {} })).toBe(false)
  })

  it('validates the table prefix as a SQL identifier (no injection)', () => {
    const handle = memoryHandle()
    expect(() => createAccessControl({ handle, tablePrefix: 'bad; DROP TABLE x --' })).toThrow(
      /Invalid table prefix/,
    )
  })
})

describe('opaque API tokens', () => {
  function store(handle: AuthzDbHandle, now: () => number) {
    let n = 0
    return createTokenStore({
      handle,
      now,
      idFactory: seqIds('tok'),
      secretFactory: () => `secret-${++n}-${'x'.repeat(64)}`,
    })
  }

  it('issue → verify round-trips claims; stores only a hash, never the plaintext', async () => {
    const handle = memoryHandle()
    const ts = store(handle, () => 1000)
    await migrate(handle, ts.migrationSql())

    const { id, token } = await ts.issue('u1', 'cli', ['posts.read', 'posts.write'])
    expect(token.startsWith(`${id}.`)).toBe(true)

    // White-box: the stored row holds a SHA-256 hash, and NOWHERE the plaintext secret.
    const row = rawRows(handle, 'tokens')[0] as Record<string, unknown>
    const secret = token.slice(token.indexOf('.') + 1)
    expect(row.hash).not.toBe(secret)
    expect(row.hash).not.toContain(secret)
    expect(String(row.hash)).toMatch(/^[0-9a-f]{64}$/) // sha-256 hex
    expect(JSON.stringify(row)).not.toContain(secret)

    const verified = await ts.verify(token)
    expect(verified).toEqual({ id, userId: 'u1', abilities: ['posts.read', 'posts.write'] })
  })

  it('verify rejects an unknown id, a wrong secret, and garbage — returns null, never throws', async () => {
    const handle = memoryHandle()
    const ts = store(handle, () => 1000)
    await migrate(handle, ts.migrationSql())
    const { id, token } = await ts.issue('u1', 'cli', ['*'])

    expect(await ts.verify('nope.whatever')).toBeNull() // unknown id
    expect(await ts.verify(`${id}.wrongsecret`)).toBeNull() // right id, wrong secret
    expect(await ts.verify('no-dot-here')).toBeNull() // malformed
    expect(await ts.verify('')).toBeNull()
    expect(await ts.verify(`.${token}`)).toBeNull() // empty id half
    expect(await ts.verify(`${id}.`)).toBeNull() // empty secret half
  })

  it('rejects an expired token and stamps last_used_at on success', async () => {
    const handle = memoryHandle()
    let t = 1000
    const ts = store(handle, () => t)
    await migrate(handle, ts.migrationSql())
    const { id, token } = await ts.issue('u1', 'cli', ['*'], { expiresInSeconds: 60 })

    t = 1000 + 59_000
    expect(await ts.verify(token)).not.toBeNull() // still valid
    expect((await ts.list('u1'))[0]?.lastUsedAt).toBe(t) // stamped

    t = 1000 + 60_000
    expect(await ts.verify(token)).toBeNull() // now expired (expires_at <= now)
    void id
  })

  it('abilities are enforced, including the `*` wildcard', async () => {
    const handle = memoryHandle()
    const ts = store(handle, () => 1000)
    await migrate(handle, ts.migrationSql())

    const scoped = await ts.issue('u1', 'scoped', ['posts.read'])
    expect(await ts.can(scoped.token, 'posts.read')).toBe(true)
    expect(await ts.can(scoped.token, 'posts.write')).toBe(false)

    const admin = await ts.issue('u2', 'admin', ['*'])
    expect(await ts.can(admin.token, 'posts.read')).toBe(true)
    expect(await ts.can(admin.token, 'anything.at.all')).toBe(true)

    // can() also accepts a verified/summary record directly.
    const verified = await ts.verify(scoped.token)
    expect(verified).not.toBeNull()
    expect(await ts.can(verified as { abilities: string[] }, 'posts.read')).toBe(true)
    expect(await ts.can(verified as { abilities: string[] }, 'posts.write')).toBe(false)

    // can() on a bogus token is false, not a throw.
    expect(await ts.can('bogus.token', 'posts.read')).toBe(false)
  })

  it('revoke and revokeAll invalidate tokens; list never leaks hashes', async () => {
    const handle = memoryHandle()
    const ts = store(handle, () => 1000)
    await migrate(handle, ts.migrationSql())

    const a = await ts.issue('u1', 'a', ['*'])
    const b = await ts.issue('u1', 'b', ['*'])
    await ts.issue('u2', 'c', ['*'])

    const list = await ts.list('u1')
    expect(list.map((t) => t.name).sort()).toEqual(['a', 'b'])
    for (const summary of list) expect('hash' in summary).toBe(false)

    await ts.revoke(a.id)
    expect(await ts.verify(a.token)).toBeNull()
    expect(await ts.verify(b.token)).not.toBeNull()

    await ts.revokeAll('u1')
    expect(await ts.verify(b.token)).toBeNull()
    expect(await ts.list('u1')).toEqual([])
    expect((await ts.list('u2')).length).toBe(1) // other user untouched
  })
})

describe('password-reset / email-verify flow tokens', () => {
  function flows(handle: AuthzDbHandle, now: () => number) {
    let n = 0
    return createFlowTokens({
      handle,
      now,
      ttlSeconds: 3600,
      idFactory: seqIds('flow'),
      secretFactory: () => `flowsecret-${++n}-${'y'.repeat(48)}`,
    })
  }

  it('issue → consume once succeeds; a second consume of the same token fails (single-use)', async () => {
    const handle = memoryHandle()
    const ft = flows(handle, () => 1000)
    await migrate(handle, ft.migrationSql())

    const token = await ft.issue('password_reset', 'user@example.com')
    expect(await ft.consume('password_reset', 'user@example.com', token)).toBe(true)
    // Single-use: replay fails.
    expect(await ft.consume('password_reset', 'user@example.com', token)).toBe(false)
  })

  it('stores only a hash, never the plaintext secret', async () => {
    const handle = memoryHandle()
    const ft = flows(handle, () => 1000)
    await migrate(handle, ft.migrationSql())
    const token = await ft.issue('email_verify', 'a@b.c')
    const secret = token.slice(token.indexOf('.') + 1)
    const row = rawRows(handle, 'auth_tokens')[0] as Record<string, unknown>
    expect(String(row.hash)).toMatch(/^[0-9a-f]{64}$/)
    expect(String(row.hash)).not.toContain(secret)
    expect(JSON.stringify(row)).not.toContain(secret)
  })

  it('rejects an expired token', async () => {
    const handle = memoryHandle()
    let t = 1000
    const ft = flows(handle, () => t)
    await migrate(handle, ft.migrationSql())
    const token = await ft.issue('password_reset', 'user@example.com')

    t = 1000 + 3600_000 + 1 // just past ttl
    expect(await ft.consume('password_reset', 'user@example.com', token)).toBe(false)
  })

  it('rejects a wrong secret, wrong kind, wrong subject, and garbage — never throws', async () => {
    const handle = memoryHandle()
    const ft = flows(handle, () => 1000)
    await migrate(handle, ft.migrationSql())
    const token = await ft.issue('password_reset', 'user@example.com')
    const id = token.slice(0, token.indexOf('.'))

    expect(await ft.consume('password_reset', 'user@example.com', `${id}.wrong`)).toBe(false)
    expect(await ft.consume('email_verify', 'user@example.com', token)).toBe(false) // wrong kind
    expect(await ft.consume('password_reset', 'someone@else.com', token)).toBe(false) // wrong subject
    expect(await ft.consume('password_reset', 'user@example.com', 'garbage')).toBe(false)
    expect(await ft.consume('password_reset', 'user@example.com', 'unknown.secret')).toBe(false)

    // A wrong-kind attempt must NOT have burned the token — the correct consume still works.
    expect(await ft.consume('password_reset', 'user@example.com', token)).toBe(true)
  })

  it('email_verify and password_reset are independent flows for the same subject', async () => {
    const handle = memoryHandle()
    const ft = flows(handle, () => 1000)
    await migrate(handle, ft.migrationSql())
    const reset = await ft.issue('password_reset', 'user@example.com')
    const verify = await ft.issue('email_verify', 'user@example.com')

    expect(await ft.consume('email_verify', 'user@example.com', verify)).toBe(true)
    // Consuming the verify token did not consume the reset token.
    expect(await ft.consume('password_reset', 'user@example.com', reset)).toBe(true)
  })
})
