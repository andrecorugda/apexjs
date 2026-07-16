// Opaque API tokens — a Sanctum-style personal-access-token store over a passed DB handle.
//
// The plaintext token is `<id>.<secret>` and is shown EXACTLY ONCE, at issue time. Only a SHA-256
// hash of the `<secret>` half is ever persisted — the plaintext is never stored and cannot be
// recovered. On `verify`, the id half indexes the row and the presented secret's hash is compared to
// the stored hash with a constant-time compare (`crypto.timingSafeEqual`), defeating a timing
// oracle. Expired tokens are rejected; a successful verify stamps `last_used_at`.
//
// Abilities are a JSON string[] with a `'*'` wildcard meaning "all abilities".

import { randomId, randomSecret, sha256Hex, timingSafeEqualHex } from './crypto.js'
import { type AuthzDbHandle, type SqlValue, tableName } from './handle.js'

/** Options for {@link createTokenStore}. */
export interface TokenStoreOptions {
  /** The DB handle rows persist through. */
  handle: AuthzDbHandle
  /** Optional table-name prefix. Validated as a SQL identifier. */
  tablePrefix?: string
  /** Injectable clock (epoch-ms). Default: `Date.now`. */
  now?: () => number
  /** Injectable token id generator. Default: random UUID. */
  idFactory?: () => string | Promise<string>
  /** Injectable secret generator (base64url). Default: 48 random bytes. */
  secretFactory?: () => string | Promise<string>
}

/** The plaintext result of {@link TokenStore.issue}. `token` is shown ONCE and never re-derivable. */
export interface IssuedToken {
  id: string
  /** The full `<id>.<secret>` plaintext — hand to the client, then forget it. */
  token: string
}

/** A verified token's public claims (no hash). */
export interface VerifiedToken {
  id: string
  userId: string
  abilities: string[]
}

/** A stored token's public metadata (never includes the hash). */
export interface TokenSummary {
  id: string
  userId: string
  name: string
  abilities: string[]
  lastUsedAt: number | null
  expiresAt: number | null
  createdAt: number
}

/** Options for a single {@link TokenStore.issue} call. */
export interface IssueOptions {
  /** Token lifetime in seconds from now. Omit for a non-expiring token. */
  expiresInSeconds?: number
}

/** The token store facade returned by {@link createTokenStore}. */
export interface TokenStore {
  /** DDL for the tokens table. */
  migrationSql(): string
  /** Issue a new token → `{ id, token }`. `token` is the only time the plaintext exists. */
  issue(
    userId: string,
    name: string,
    abilities: string[],
    opts?: IssueOptions,
  ): Promise<IssuedToken>
  /** Verify a plaintext token → its claims, or null (unknown/mismatched/expired — never throws). */
  verify(token: string): Promise<VerifiedToken | null>
  /** Whether a token (plaintext) or a verified/summary record grants `ability` (`'*'` = all). */
  can(tokenOrRecord: string | { abilities: string[] }, ability: string): Promise<boolean>
  /** Revoke a single token by id. */
  revoke(id: string): Promise<void>
  /** Revoke every token belonging to a user. */
  revokeAll(userId: string): Promise<void>
  /** List a user's tokens (metadata only — no hashes). */
  list(userId: string): Promise<TokenSummary[]>
}

/** Does an abilities set grant `ability`? `'*'` is a wildcard matching everything. */
export function abilitiesGrant(abilities: readonly string[], ability: string): boolean {
  return abilities.includes('*') || abilities.includes(ability)
}

/** Split a `<id>.<secret>` token into its halves, or null if malformed. */
function splitToken(token: string): { id: string; secret: string } | null {
  const dot = token.indexOf('.')
  if (dot <= 0) return null
  const id = token.slice(0, dot)
  const secret = token.slice(dot + 1)
  if (id === '' || secret === '') return null
  return { id, secret }
}

/** Parse a stored abilities JSON column into a string[] (defensive: [] on anything unexpected). */
function parseAbilities(raw: unknown): string[] {
  if (typeof raw !== 'string') return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((a): a is string => typeof a === 'string') : []
  } catch {
    return []
  }
}

/** Coerce a nullable epoch-ms column (Postgres BIGINT may arrive as a string) to number | null. */
function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  return typeof value === 'number' ? value : Number(value)
}

/**
 * Create a {@link TokenStore} bound to `handle`. Run {@link TokenStore.migrationSql} once to create
 * the table. Inject `now`/`idFactory`/`secretFactory` for deterministic tests; hashing and the
 * verify-time compare always use real `node:crypto`.
 */
export function createTokenStore(opts: TokenStoreOptions): TokenStore {
  const { handle } = opts
  const tokens = tableName(opts.tablePrefix, 'tokens')
  const now = opts.now ?? (() => Date.now())
  const genId = opts.idFactory ?? randomId
  const genSecret = opts.secretFactory ?? (() => randomSecret(48))

  /** Fetch a raw row by id, or null. */
  async function rowById(id: string): Promise<Record<string, unknown> | null> {
    const rows = await handle.query(
      `SELECT id, user_id, name, hash, abilities, last_used_at, expires_at, created_at
       FROM ${tokens} WHERE id = ?`,
      [id],
    )
    return rows[0] ?? null
  }

  const store: TokenStore = {
    migrationSql(): string {
      return [
        `CREATE TABLE IF NOT EXISTS ${tokens} (`,
        `  id TEXT PRIMARY KEY,`,
        `  user_id TEXT NOT NULL,`,
        `  name TEXT NOT NULL,`,
        `  hash TEXT NOT NULL,`,
        `  abilities TEXT NOT NULL,`,
        `  last_used_at BIGINT,`,
        `  expires_at BIGINT,`,
        `  created_at BIGINT NOT NULL`,
        `);`,
      ].join('\n')
    },

    async issue(userId, name, abilities, issueOpts) {
      const id = await genId()
      const secret = await genSecret()
      const hash = await sha256Hex(secret)
      const createdAt = now()
      const expiresAt =
        issueOpts?.expiresInSeconds !== undefined
          ? createdAt + issueOpts.expiresInSeconds * 1000
          : null
      const params: SqlValue[] = [
        id,
        userId,
        name,
        hash,
        JSON.stringify(abilities),
        null,
        expiresAt,
        createdAt,
      ]
      await handle.exec(
        `INSERT INTO ${tokens}
           (id, user_id, name, hash, abilities, last_used_at, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        params,
      )
      return { id, token: `${id}.${secret}` }
    },

    async verify(token) {
      const parts = splitToken(token)
      if (!parts) return null
      const row = await rowById(parts.id)
      if (!row) return null
      const presentedHash = await sha256Hex(parts.secret)
      if (!(await timingSafeEqualHex(presentedHash, String(row.hash)))) return null
      const expiresAt = toNullableNumber(row.expires_at)
      if (expiresAt !== null && expiresAt <= now()) return null
      await handle.exec(`UPDATE ${tokens} SET last_used_at = ? WHERE id = ?`, [now(), parts.id])
      return {
        id: String(row.id),
        userId: String(row.user_id),
        abilities: parseAbilities(row.abilities),
      }
    },

    async can(tokenOrRecord, ability) {
      if (typeof tokenOrRecord === 'string') {
        const verified = await this.verify(tokenOrRecord)
        return verified ? abilitiesGrant(verified.abilities, ability) : false
      }
      return abilitiesGrant(tokenOrRecord.abilities, ability)
    },

    async revoke(id) {
      await handle.exec(`DELETE FROM ${tokens} WHERE id = ?`, [id])
    },

    async revokeAll(userId) {
      await handle.exec(`DELETE FROM ${tokens} WHERE user_id = ?`, [userId])
    },

    async list(userId) {
      const rows = await handle.query(
        `SELECT id, user_id, name, abilities, last_used_at, expires_at, created_at
         FROM ${tokens} WHERE user_id = ?`,
        [userId],
      )
      return rows.map((row) => ({
        id: String(row.id),
        userId: String(row.user_id),
        name: String(row.name),
        abilities: parseAbilities(row.abilities),
        lastUsedAt: toNullableNumber(row.last_used_at),
        expiresAt: toNullableNumber(row.expires_at),
        createdAt: Number(row.created_at),
      }))
    },
  }
  return store
}
