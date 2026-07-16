// Single-use flow tokens — the token-lifecycle half of password-reset and email-verification.
//
// Scope is deliberately narrow: this module ONLY issues and consumes opaque single-use tokens keyed
// by (kind, subject). It does NOT own the user table, does NOT hash passwords, and does NOT send
// mail. The app owns all of that:
//
//   - Password reset:  app calls `issue('password_reset', userEmail)`, mails the returned token to
//                      the user, then on submit calls `consume('password_reset', userEmail, token)`;
//                      if true, the app sets the new password via `hashPassword` from ../auth/password.ts.
//   - Email verify:    app calls `issue('email_verify', userEmail)`, mails it, and on click calls
//                      `consume('email_verify', userEmail, token)`; if true, the app marks the email
//                      verified.
//
// Sending the mail is the APP's job — `issue` just RETURNS the plaintext token so the app can mail
// it. As with API tokens, only a SHA-256 hash is persisted; the token is `<id>.<secret>`, verified by
// a constant-time compare; expired tokens are rejected; and a token is single-use — a successful
// `consume` stamps `used_at`, so a second `consume` of the same token fails.

import { randomId, randomSecret, sha256Hex, timingSafeEqualHex } from './crypto.js'
import { type AuthzDbHandle, type SqlValue, tableName } from './handle.js'

/** The flows this store issues tokens for. */
export type FlowKind = 'password_reset' | 'email_verify'

/** Options for {@link createFlowTokens}. */
export interface FlowTokensOptions {
  /** The DB handle rows persist through. */
  handle: AuthzDbHandle
  /** Optional table-name prefix. Validated as a SQL identifier. */
  tablePrefix?: string
  /** Token lifetime in seconds. Default: 3600 (1 hour). */
  ttlSeconds?: number
  /** Injectable clock (epoch-ms). Default: `Date.now`. */
  now?: () => number
  /** Injectable token id generator. Default: random UUID. */
  idFactory?: () => string | Promise<string>
  /** Injectable secret generator (base64url). Default: 32 random bytes. */
  secretFactory?: () => string | Promise<string>
}

/** The flow-token store facade returned by {@link createFlowTokens}. */
export interface FlowTokens {
  /** DDL for the auth_tokens table. */
  migrationSql(): string
  /** Issue a single-use token for `(kind, subject)` → the plaintext for the app to mail. */
  issue(kind: FlowKind, subject: string): Promise<string>
  /** Consume a token: true if valid+unused+unexpired (and marks it used), else false. */
  consume(kind: FlowKind, subject: string, token: string): Promise<boolean>
}

/** Split a `<id>.<secret>` token, or null if malformed. */
function splitToken(token: string): { id: string; secret: string } | null {
  const dot = token.indexOf('.')
  if (dot <= 0) return null
  const id = token.slice(0, dot)
  const secret = token.slice(dot + 1)
  if (id === '' || secret === '') return null
  return { id, secret }
}

/** Coerce a nullable epoch-ms column to number | null (Postgres BIGINT may arrive as a string). */
function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  return typeof value === 'number' ? value : Number(value)
}

/**
 * Create a {@link FlowTokens} store bound to `handle`. Run {@link FlowTokens.migrationSql} once.
 * Inject `now`/`idFactory`/`secretFactory` for deterministic tests; hashing and the consume-time
 * compare always use real `node:crypto`.
 */
export function createFlowTokens(opts: FlowTokensOptions): FlowTokens {
  const { handle } = opts
  const table = tableName(opts.tablePrefix, 'auth_tokens')
  const ttlSeconds = opts.ttlSeconds ?? 3600
  const now = opts.now ?? (() => Date.now())
  const genId = opts.idFactory ?? randomId
  const genSecret = opts.secretFactory ?? (() => randomSecret(32))

  return {
    migrationSql(): string {
      return [
        `CREATE TABLE IF NOT EXISTS ${table} (`,
        `  id TEXT PRIMARY KEY,`,
        `  kind TEXT NOT NULL,`,
        `  subject TEXT NOT NULL,`,
        `  hash TEXT NOT NULL,`,
        `  expires_at BIGINT NOT NULL,`,
        `  used_at BIGINT,`,
        `  created_at BIGINT NOT NULL`,
        `);`,
      ].join('\n')
    },

    async issue(kind, subject) {
      const id = await genId()
      const secret = await genSecret()
      const hash = await sha256Hex(secret)
      const createdAt = now()
      const expiresAt = createdAt + ttlSeconds * 1000
      const params: SqlValue[] = [id, kind, subject, hash, expiresAt, null, createdAt]
      await handle.exec(
        `INSERT INTO ${table} (id, kind, subject, hash, expires_at, used_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        params,
      )
      return `${id}.${secret}`
    },

    async consume(kind, subject, token) {
      const parts = splitToken(token)
      if (!parts) return false
      const rows = await handle.query(
        `SELECT id, kind, subject, hash, expires_at, used_at, created_at
         FROM ${table} WHERE id = ?`,
        [parts.id],
      )
      const row = rows[0]
      if (!row) return false
      // Constant-time hash compare FIRST — an attacker learns nothing about the secret from timing.
      const presentedHash = await sha256Hex(parts.secret)
      if (!(await timingSafeEqualHex(presentedHash, String(row.hash)))) return false
      // Bind the token to the exact (kind, subject) the caller claims — a reset token can't be
      // replayed against the verify flow, or against a different subject.
      if (String(row.kind) !== kind || String(row.subject) !== subject) return false
      // Single-use: a token already consumed is dead.
      if (toNullableNumber(row.used_at) !== null) return false
      // Expiry.
      const expiresAt = toNullableNumber(row.expires_at)
      if (expiresAt === null || expiresAt <= now()) return false
      // Mark used — the second consume of this token will fail the used_at check above.
      await handle.exec(`UPDATE ${table} SET used_at = ? WHERE id = ?`, [now(), parts.id])
      return true
    },
  }
}
