import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAction } from './action.js'

const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
  vi.restoreAllMocks()
})

describe('createAction', () => {
  it('POSTs, tracks pending→data, and calls onSuccess', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ id: 7 }), { status: 201 }))
    const onSuccess = vi.fn()
    const action = createAction('/api/messages', { onSuccess })

    expect(action.pending).toBe(false)
    const p = action.submit()
    expect(action.pending).toBe(true) // pending flips synchronously
    await p

    expect(action.pending).toBe(false)
    expect(action.data).toEqual({ id: 7 })
    expect(action.error).toBeNull()
    expect(onSuccess).toHaveBeenCalledWith({ id: 7 })
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/messages',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('captures a failed response into error + calls onError', async () => {
    globalThis.fetch = vi.fn(async () => new Response('nope', { status: 500 }))
    const onError = vi.fn()
    const action = createAction('/api/x', { onError })
    await action.submit()
    expect(action.error).toBe('Request failed (500)')
    expect(action.data).toBeNull()
    expect(onError).toHaveBeenCalledOnce()
  })

  it('prevents default on a submit event and reset() clears state', async () => {
    globalThis.fetch = vi.fn(async () => new Response('{}', { status: 200 }))
    const action = createAction('/api/x')
    const preventDefault = vi.fn()
    await action.submit({ preventDefault } as unknown as Event)
    expect(preventDefault).toHaveBeenCalledOnce()
    action.data = { a: 1 }
    action.error = 'x'
    action.reset()
    expect(action.data).toBeNull()
    expect(action.error).toBeNull()
    expect(action.pending).toBe(false)
  })
})
