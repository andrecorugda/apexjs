import { describe, expect, it, vi } from 'vitest'
import type { NotificationDbHandle, SqlValue } from './databaseChannel.js'
import { databaseChannel } from './databaseChannel.js'
import { createNotifier, defineNotification } from './notifications.js'

/**
 * A hand-rolled in-memory {@link NotificationDbHandle} that honors the `?`-placeholder contract the
 * database channel relies on. Rows live in a Map; `created_at`/`read_at` come back as STRINGS to mimic
 * how Postgres BIGINT columns arrive over the wire — exercising the channel's numeric coercion.
 */
function fakeHandle(): NotificationDbHandle {
  type Stored = Record<string, unknown>
  const rows = new Map<string, Stored>()
  const p = (params: readonly SqlValue[] | undefined, i: number): SqlValue => {
    const v = params?.[i]
    return v === undefined ? null : v
  }
  return {
    async exec(sql, params) {
      const s = sql.trim().toUpperCase()
      if (s.startsWith('CREATE TABLE')) return
      if (s.startsWith('INSERT')) {
        rows.set(String(p(params, 0)), {
          id: p(params, 0),
          notifiable_id: p(params, 1),
          type: p(params, 2),
          data: p(params, 3),
          read_at: p(params, 4) === null ? null : String(p(params, 4)),
          created_at: String(p(params, 5)), // simulate BIGINT-as-string
        })
        return
      }
      if (s.startsWith('UPDATE')) {
        const row = rows.get(String(p(params, 1)))
        if (row) row.read_at = String(p(params, 0))
        return
      }
      throw new Error(`fakeHandle.exec: unhandled SQL: ${sql}`)
    },
    async query(sql, params) {
      const s = sql.trim().toUpperCase()
      if (s.includes('WHERE NOTIFIABLE_ID') && s.includes('READ_AT IS NULL')) {
        const id = String(p(params, 0))
        return [...rows.values()]
          .filter((r) => String(r.notifiable_id) === id && r.read_at === null)
          .sort((a, b) => Number(a.created_at) - Number(b.created_at))
          .map((r) => ({ ...r }))
      }
      throw new Error(`fakeHandle.query: unhandled SQL: ${sql}`)
    },
  }
}

interface InvoicePayload {
  invoiceId: number
  amount: number
}

describe('defineNotification + createNotifier — multi-channel dispatch', () => {
  it('dispatches a via: [database, mail] notification to BOTH registered channels', async () => {
    const clock = 1000
    const handle = fakeHandle()
    const db = databaseChannel({ handle, now: () => clock })
    await handle.exec(db.migrationSql())

    const mailSpy = vi.fn(async (_rendered: unknown) => {})

    const notifier = createNotifier({ channels: { database: db, mail: mailSpy } })

    const invoicePaid = defineNotification<InvoicePayload>({
      via: () => ['database', 'mail'],
      toDatabase: ({ payload }) => ({ type: 'invoice.paid', invoiceId: payload.invoiceId }),
      toMail: ({ payload }) => ({
        subject: `Invoice #${payload.invoiceId} paid`,
        amount: payload.amount,
      }),
    })

    await notifier.send({ id: 42 }, invoicePaid({ invoiceId: 7, amount: 250 }))

    // Mail channel (a spy) got the toMail() render.
    expect(mailSpy).toHaveBeenCalledTimes(1)
    expect(mailSpy).toHaveBeenCalledWith({ subject: 'Invoice #7 paid', amount: 250 })

    // Database channel persisted the toDatabase() render.
    const unread = await db.unread(42)
    expect(unread).toHaveLength(1)
    expect(unread[0]?.type).toBe('invoice.paid')
    expect(unread[0]?.data).toEqual({ type: 'invoice.paid', invoiceId: 7 })
    expect(unread[0]?.notifiableId).toBe('42')
    expect(unread[0]?.readAt).toBeNull()
    expect(unread[0]?.createdAt).toBe(1000)
  })

  it('renders the raw payload when a channel has no to<Channel> method', async () => {
    const handle = fakeHandle()
    const db = databaseChannel({ handle })
    await handle.exec(db.migrationSql())
    const notifier = createNotifier({ channels: { database: db } })

    const ping = defineNotification<{ type: string; note: string }>({ via: () => ['database'] })
    await notifier.send({ id: 'u1' }, ping({ type: 'ping', note: 'hi' }))

    const unread = await db.unread('u1')
    expect(unread).toHaveLength(1)
    expect(unread[0]?.type).toBe('ping')
    expect(unread[0]?.data).toEqual({ type: 'ping', note: 'hi' })
  })

  it('skips an unregistered channel with a warning instead of throwing', async () => {
    const handle = fakeHandle()
    const db = databaseChannel({ handle })
    await handle.exec(db.migrationSql())

    const warn = vi.fn()
    // Only `database` is registered; the notification also selects `sms`.
    const notifier = createNotifier({ channels: { database: db }, warn })

    const alert = defineNotification<{ type: string }>({
      via: () => ['database', 'sms'],
      toDatabase: ({ payload }) => ({ type: payload.type }),
    })

    await expect(notifier.send({ id: 9 }, alert({ type: 'alert' }))).resolves.toBeUndefined()

    // database still delivered...
    expect(await db.unread(9)).toHaveLength(1)
    // ...and the missing sms channel was warned about, not thrown.
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toContain('sms')
  })
})

describe('databaseChannel — persistence, unread() and markRead()', () => {
  it('persists notifications and markRead() removes them from unread()', async () => {
    let clock = 5000
    const handle = fakeHandle()
    let n = 0
    const db = databaseChannel({ handle, now: () => clock, id: () => `id-${n++}` })
    await handle.exec(db.migrationSql())

    await db.send({ id: 1 }, { type: 'a' })
    clock = 5001
    await db.send({ id: 1 }, { type: 'b' })
    await db.send({ id: 2 }, { type: 'c' }) // different recipient

    const before = await db.unread(1)
    expect(before.map((r) => r.type)).toEqual(['a', 'b']) // oldest first, scoped to recipient 1

    await db.markRead(before[0]?.id ?? '')

    const after = await db.unread(1)
    expect(after.map((r) => r.type)).toEqual(['b'])
    expect(await db.unread(2)).toHaveLength(1) // recipient 2 untouched
  })

  it('migrationSql() emits the expected columns and rejects a bad table name', () => {
    const db = databaseChannel({ handle: fakeHandle(), table: 'my_notifications' })
    const sql = db.migrationSql()
    for (const col of [
      'id TEXT PRIMARY KEY',
      'notifiable_id TEXT NOT NULL',
      'type TEXT NOT NULL',
      'data TEXT NOT NULL',
      'read_at BIGINT',
      'created_at BIGINT NOT NULL',
    ]) {
      expect(sql).toContain(col)
    }
    expect(sql).toContain('my_notifications')

    expect(() => databaseChannel({ handle: fakeHandle(), table: 'bad-name' })).toThrow()
    expect(() => databaseChannel({ handle: fakeHandle(), table: 'x; DROP TABLE y' })).toThrow()
  })
})
