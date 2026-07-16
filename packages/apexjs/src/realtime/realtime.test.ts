import { createApp, toWebHandler } from 'h3'
import { describe, expect, it, vi } from 'vitest'
import { createBroadcaster } from './broadcaster.js'
import { encodeSseComment, encodeSseFrame } from './frame.js'
import { sseHandler } from './sse.js'

describe('createBroadcaster — pub/sub hub', () => {
  it('delivers a published message to a subscriber of that channel', () => {
    const hub = createBroadcaster()
    const received: Array<[string, unknown]> = []
    hub.subscribe('room:1', (event, data) => received.push([event, data]))

    hub.publish('room:1', 'msg', { text: 'hi' })

    expect(received).toEqual([['msg', { text: 'hi' }]])
  })

  it('does NOT deliver to subscribers of other channels', () => {
    const hub = createBroadcaster()
    const other = vi.fn()
    hub.subscribe('room:2', other)

    hub.publish('room:1', 'msg', { text: 'hi' })

    expect(other).not.toHaveBeenCalled()
  })

  it('unsubscribe stops delivery (and is idempotent)', () => {
    const hub = createBroadcaster()
    const listener = vi.fn()
    const unsub = hub.subscribe('room:1', listener)

    hub.publish('room:1', 'a', 1)
    unsub()
    hub.publish('room:1', 'b', 2)
    unsub() // second call is a no-op

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith('a', 1)
    expect(hub.subscriberCount('room:1')).toBe(0)
    expect(hub.channels()).not.toContain('room:1')
  })

  it('fans out to every subscriber on one channel', () => {
    const hub = createBroadcaster()
    const a = vi.fn()
    const b = vi.fn()
    const c = vi.fn()
    hub.subscribe('room:1', a)
    hub.subscribe('room:1', b)
    hub.subscribe('room:1', c)

    expect(hub.subscriberCount('room:1')).toBe(3)
    hub.publish('room:1', 'ping', { n: 42 })

    for (const fn of [a, b, c]) expect(fn).toHaveBeenCalledWith('ping', { n: 42 })
  })

  it('isolates a throwing listener from the rest of the fan-out', () => {
    const hub = createBroadcaster()
    const good = vi.fn()
    hub.subscribe('room:1', () => {
      throw new Error('boom')
    })
    hub.subscribe('room:1', good)

    expect(() => hub.publish('room:1', 'e', 1)).not.toThrow()
    expect(good).toHaveBeenCalledWith('e', 1)
  })

  it('tracks live channels in its bookkeeping', () => {
    const hub = createBroadcaster()
    const off1 = hub.subscribe('a', vi.fn())
    hub.subscribe('b', vi.fn())

    expect(hub.channels().sort()).toEqual(['a', 'b'])
    off1()
    expect(hub.channels()).toEqual(['b'])
  })
})

describe('encodeSseFrame — SSE wire format', () => {
  it('encodes event + data as `event: x\\ndata: {...}\\n\\n`', () => {
    const frame = encodeSseFrame({ event: 'x', data: JSON.stringify({ a: 1 }) })
    expect(frame).toBe('event: x\ndata: {"a":1}\n\n')
  })

  it('encodes a bare data frame (no event field)', () => {
    expect(encodeSseFrame({ data: 'hello' })).toBe('data: hello\n\n')
  })

  it('emits id, event, retry in order before data', () => {
    const frame = encodeSseFrame({ id: '7', event: 'tick', retry: 3000, data: 'x' })
    expect(frame).toBe('id: 7\nevent: tick\nretry: 3000\ndata: x\n\n')
  })

  it('splits multi-line data into one data: line each', () => {
    expect(encodeSseFrame({ data: 'line1\nline2' })).toBe('data: line1\ndata: line2\n\n')
  })

  it('strips CR/LF from single-line fields (no injection)', () => {
    expect(encodeSseFrame({ event: 'a\nb', data: 'x' })).toBe('event: ab\ndata: x\n\n')
  })

  it('drops non-integer retry', () => {
    expect(encodeSseFrame({ retry: 1.5, data: 'x' })).toBe('data: x\n\n')
  })
})

describe('encodeSseComment', () => {
  it('formats a comment as `: text\\n\\n`', () => {
    expect(encodeSseComment('keep-alive')).toBe(': keep-alive\n\n')
    expect(encodeSseComment()).toBe(': \n\n')
  })
})

describe('sseHandler — h3 integration', () => {
  it('sets SSE headers and streams the opening comment then a published frame', async () => {
    const hub = createBroadcaster()
    const app = createApp()
    app.use(
      '/events',
      sseHandler(hub, { channels: () => ['room:1'], keepAliveMs: 0 }),
    )
    const handler = toWebHandler(app)

    const res = await handler(new Request('http://localhost/events'))
    expect(res.headers.get('Content-Type')).toBe('text/event-stream')
    expect(res.headers.get('Cache-Control')).toBe('no-cache')
    expect(res.headers.get('Connection')).toBe('keep-alive')

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()

    // First chunk: the opening keep-open comment.
    const first = await reader.read()
    expect(decoder.decode(first.value)).toBe(': connected\n\n')

    // A publish reaches the open stream as an event/data frame.
    hub.publish('room:1', 'greet', { hi: true })
    const second = await reader.read()
    expect(decoder.decode(second.value)).toBe('event: greet\ndata: {"hi":true}\n\n')

    await reader.cancel() // triggers stream cleanup (unsubscribe + close)
  })
})
