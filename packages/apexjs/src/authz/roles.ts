// Roles + permissions — a Spatie-style RBAC layer over a passed DB handle. Roles and permissions are
// named rows with string ids; users are assigned roles and/or granted permissions directly, and a
// user's effective permission set is the UNION of role-granted and direct permissions.
//
// Everything persists through `handle` with `?` placeholders (see ./handle.ts). Joins are resolved
// in TypeScript over simple equality/IN queries rather than SQL JOINs — that keeps the query surface
// portable across drivers and trivial to reason about. Inject `idFactory` for deterministic ids.

import { randomId } from './crypto.js'
import { type AuthzDbHandle, placeholders, type SqlValue, tableName } from './handle.js'

/** Options for {@link createAccessControl}. */
export interface AccessControlOptions {
  /** The DB handle rows persist through. */
  handle: AuthzDbHandle
  /** Optional table-name prefix, e.g. `'app_'`. Validated as a SQL identifier. */
  tablePrefix?: string
  /** Injectable id generator for roles/permissions (default: random UUID). */
  idFactory?: () => string | Promise<string>
}

/** The access-control facade returned by {@link createAccessControl}. */
export interface AccessControl {
  /** DDL for the five RBAC tables (roles, permissions, and the three join tables). */
  migrationSql(): string
  /** Create (or fetch existing) a role by name → its id. Idempotent. */
  createRole(name: string): Promise<string>
  /** Create (or fetch existing) a permission by name → its id. Idempotent. */
  createPermission(name: string): Promise<string>
  /** Grant a permission to a role (both auto-created if absent). Idempotent. */
  grantPermissionToRole(role: string, perm: string): Promise<void>
  /** Assign a role to a user (role auto-created if absent). Idempotent. */
  assignRole(userId: string, role: string): Promise<void>
  /** Grant a permission directly to a user (perm auto-created if absent). Idempotent. */
  giveDirectPermission(userId: string, perm: string): Promise<void>
  /** The role names assigned to a user (sorted). */
  rolesOf(userId: string): Promise<string[]>
  /** A user's effective permissions: union of role-granted + direct (sorted, deduped). */
  permissionsOf(userId: string): Promise<string[]>
  /** Whether a user's effective permission set contains `perm`. */
  hasPermission(userId: string, perm: string): Promise<boolean>
  /** Whether a user is assigned `role`. */
  hasRole(userId: string, role: string): Promise<boolean>
  /** Remove a role assignment from a user. No-op if absent. */
  revokeRole(userId: string, role: string): Promise<void>
  /** Remove a direct permission grant from a user. No-op if absent. */
  revokePermission(userId: string, perm: string): Promise<void>
}

/**
 * Create an {@link AccessControl} bound to `handle`. Run {@link AccessControl.migrationSql} once to
 * create the tables. All writes use `?`-placeholder parameters — values are bound, never
 * string-concatenated.
 */
export function createAccessControl(opts: AccessControlOptions): AccessControl {
  const { handle } = opts
  const roles = tableName(opts.tablePrefix, 'roles')
  const permissions = tableName(opts.tablePrefix, 'permissions')
  const rolePermissions = tableName(opts.tablePrefix, 'role_permissions')
  const userRoles = tableName(opts.tablePrefix, 'user_roles')
  const userPermissions = tableName(opts.tablePrefix, 'user_permissions')

  const genId = opts.idFactory ?? randomId

  /** Look up the id of a named row, or null. */
  async function idByName(table: string, name: string): Promise<string | null> {
    const rows = await handle.query(`SELECT id FROM ${table} WHERE name = ?`, [name])
    const row = rows[0]
    return row ? String(row.id) : null
  }

  /** Get-or-create a named row (roles/permissions) → its id. Idempotent. */
  async function ensureNamed(table: string, name: string): Promise<string> {
    const existing = await idByName(table, name)
    if (existing !== null) return existing
    const id = await genId()
    await handle.exec(`INSERT INTO ${table} (id, name) VALUES (?, ?)`, [id, name])
    return id
  }

  /** Whether a (colA, colB) pair already exists in a join table. */
  async function pairExists(
    table: string,
    colA: string,
    valA: SqlValue,
    colB: string,
    valB: SqlValue,
  ): Promise<boolean> {
    const rows = await handle.query(
      `SELECT ${colA} FROM ${table} WHERE ${colA} = ? AND ${colB} = ?`,
      [valA, valB],
    )
    return rows.length > 0
  }

  /** The `id → name` values for a set of ids, deduped and sorted; [] for an empty id set. */
  async function namesForIds(table: string, ids: readonly string[]): Promise<string[]> {
    if (ids.length === 0) return []
    const rows = await handle.query(
      `SELECT name FROM ${table} WHERE id IN (${placeholders(ids.length)})`,
      ids,
    )
    const names = new Set(rows.map((r) => String(r.name)))
    return [...names].sort()
  }

  /** The distinct values of one column for rows matching `col = value`. */
  async function columnWhere(
    table: string,
    select: string,
    col: string,
    value: SqlValue,
  ): Promise<string[]> {
    const rows = await handle.query(`SELECT ${select} FROM ${table} WHERE ${col} = ?`, [value])
    return rows.map((r) => String(r[select]))
  }

  return {
    migrationSql(): string {
      return [
        `CREATE TABLE IF NOT EXISTS ${roles} (`,
        `  id TEXT PRIMARY KEY,`,
        `  name TEXT NOT NULL UNIQUE`,
        `);`,
        `CREATE TABLE IF NOT EXISTS ${permissions} (`,
        `  id TEXT PRIMARY KEY,`,
        `  name TEXT NOT NULL UNIQUE`,
        `);`,
        `CREATE TABLE IF NOT EXISTS ${rolePermissions} (`,
        `  role_id TEXT NOT NULL,`,
        `  permission_id TEXT NOT NULL,`,
        `  PRIMARY KEY (role_id, permission_id)`,
        `);`,
        `CREATE TABLE IF NOT EXISTS ${userRoles} (`,
        `  user_id TEXT NOT NULL,`,
        `  role_id TEXT NOT NULL,`,
        `  PRIMARY KEY (user_id, role_id)`,
        `);`,
        `CREATE TABLE IF NOT EXISTS ${userPermissions} (`,
        `  user_id TEXT NOT NULL,`,
        `  permission_id TEXT NOT NULL,`,
        `  PRIMARY KEY (user_id, permission_id)`,
        `);`,
      ].join('\n')
    },

    createRole(name) {
      return ensureNamed(roles, name)
    },

    createPermission(name) {
      return ensureNamed(permissions, name)
    },

    async grantPermissionToRole(role, perm) {
      const roleId = await ensureNamed(roles, role)
      const permId = await ensureNamed(permissions, perm)
      if (await pairExists(rolePermissions, 'role_id', roleId, 'permission_id', permId)) return
      await handle.exec(`INSERT INTO ${rolePermissions} (role_id, permission_id) VALUES (?, ?)`, [
        roleId,
        permId,
      ])
    },

    async assignRole(userId, role) {
      const roleId = await ensureNamed(roles, role)
      if (await pairExists(userRoles, 'user_id', userId, 'role_id', roleId)) return
      await handle.exec(`INSERT INTO ${userRoles} (user_id, role_id) VALUES (?, ?)`, [
        userId,
        roleId,
      ])
    },

    async giveDirectPermission(userId, perm) {
      const permId = await ensureNamed(permissions, perm)
      if (await pairExists(userPermissions, 'user_id', userId, 'permission_id', permId)) return
      await handle.exec(`INSERT INTO ${userPermissions} (user_id, permission_id) VALUES (?, ?)`, [
        userId,
        permId,
      ])
    },

    async rolesOf(userId) {
      const roleIds = await columnWhere(userRoles, 'role_id', 'user_id', userId)
      return namesForIds(roles, roleIds)
    },

    async permissionsOf(userId) {
      const roleIds = await columnWhere(userRoles, 'role_id', 'user_id', userId)
      const permIds = new Set<string>()
      if (roleIds.length > 0) {
        const rows = await handle.query(
          `SELECT permission_id FROM ${rolePermissions} WHERE role_id IN (${placeholders(roleIds.length)})`,
          roleIds,
        )
        for (const r of rows) permIds.add(String(r.permission_id))
      }
      for (const id of await columnWhere(userPermissions, 'permission_id', 'user_id', userId)) {
        permIds.add(id)
      }
      return namesForIds(permissions, [...permIds])
    },

    async hasPermission(userId, perm) {
      return (await this.permissionsOf(userId)).includes(perm)
    },

    async hasRole(userId, role) {
      return (await this.rolesOf(userId)).includes(role)
    },

    async revokeRole(userId, role) {
      const roleId = await idByName(roles, role)
      if (roleId === null) return
      await handle.exec(`DELETE FROM ${userRoles} WHERE user_id = ? AND role_id = ?`, [
        userId,
        roleId,
      ])
    },

    async revokePermission(userId, perm) {
      const permId = await idByName(permissions, perm)
      if (permId === null) return
      await handle.exec(`DELETE FROM ${userPermissions} WHERE user_id = ? AND permission_id = ?`, [
        userId,
        permId,
      ])
    },
  }
}

/**
 * A permission gate usable as a route/resource `access.can`. Returns a check that resolves a user's
 * id to a string and asks {@link AccessControl.hasPermission}. Anonymous (no user / no id) → false
 * (fail-closed).
 *
 * ```ts
 * defineResource({ access: { auth: true, can: permissionGate(ac, 'posts.edit') } })
 * ```
 */
export function permissionGate(
  ac: AccessControl,
  perm: string,
): (ctx: { user: { id?: unknown } | null }) => Promise<boolean> {
  return async (ctx) => {
    const id = ctx.user?.id
    if (id === null || id === undefined) return false
    return ac.hasPermission(String(id), perm)
  }
}
