import { createServer, type Server } from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { gracefulShutdown, onShutdown, runShutdownHooks } from './shutdown.js'

const HOOKS_KEY = '__APEX_SHUTDOWN_HOOKS__'
const clearHooks = () => {
  ;(globalThis as Record<string, unknown>)[HOOKS_KEY] = new Set()
}

afterEach(clearHooks)

describe('shutdown-hook registry', () => {
  it('runs every hook once (parallel), tolerates failures, then clears', async () => {
    const ran: string[] = []
    onShutdown(() => {
      ran.push('a')
    })
    onShutdown(async () => {
      ran.push('b')
      throw new Error('boom') // must not block the others
    })
    onShutdown(() => {
      ran.push('c')
    })
    await runShutdownHooks()
    expect(ran.sort()).toEqual(['a', 'b', 'c'])
    // Registry cleared — a second run is a no-op.
    await runShutdownHooks()
    expect(ran).toHaveLength(3)
  })
})

describe('gracefulShutdown', () => {
  let server: Server | undefined
  afterEach(() => {
    server?.closeAllConnections()
    server?.close()
    server = undefined
  })

  const listen = (s: Server) =>
    new Promise<number>((resolve) => {
      s.listen(0, '127.0.0.1', () => {
        const addr = s.address()
        resolve(typeof addr === 'object' && addr ? addr.port : 0)
      })
    })

  it('drains an in-flight request, refuses new connections, runs hooks once, idempotent', async () => {
    let releaseRequest!: () => void
    const gate = new Promise<void>((r) => {
      releaseRequest = r
    })
    server = createServer(async (_req, res) => {
      await gate // hold the request in flight until the test releases it
      res.end('done')
    })
    const port = await listen(server)

    let dbClosed = 0
    onShutdown(() => {
      dbClosed++
    })

    // Start an in-flight request (Connection: close so its socket isn't idle-culled).
    const inFlight = fetch(`http://127.0.0.1:${port}/slow`, {
      headers: { connection: 'close' },
    })
    await new Promise((r) => setTimeout(r, 50)) // let it reach the server

    const closing = gracefulShutdown(server, { timeoutMs: 5_000 })
    const closingAgain = gracefulShutdown(server) // idempotent — same promise
    expect(closingAgain).toBe(closing)

    // The in-flight request must still complete…
    await new Promise((r) => setTimeout(r, 50))
    releaseRequest()
    const res = await inFlight
    expect(await res.text()).toBe('done')

    await closing
    expect(dbClosed).toBe(1) // hooks ran exactly once, after the drain

    // …and NEW connections are refused after close.
    await expect(fetch(`http://127.0.0.1:${port}/`)).rejects.toThrow()
    server = undefined // already closed
  })

  it('force-closes a hung request after timeoutMs', async () => {
    server = createServer(() => {
      /* never responds */
    })
    const port = await listen(server)

    const hung = fetch(`http://127.0.0.1:${port}/hang`, {
      headers: { connection: 'close' },
    }).catch((e) => e)
    await new Promise((r) => setTimeout(r, 50))

    const started = Date.now()
    await gracefulShutdown(server, { timeoutMs: 200 })
    expect(Date.now() - started).toBeGreaterThanOrEqual(150) // waited for the window…
    expect(Date.now() - started).toBeLessThan(3_000) // …but did not hang forever
    expect(await hung).toBeInstanceOf(Error) // the socket was force-closed
    server = undefined
  })
})
