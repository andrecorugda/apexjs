import { describe, expect, it } from 'vitest'
import { isCsrfSafe } from './csrf.js'
import { securityHeaders } from './headers.js'
import { createRateLimiter } from './rateLimit.js'

describe('isCsrfSafe', () => {
  const base = { host: 'app.com', hasCookie: true, hasAuthHeader: false }
  it('allows all read methods', () => {
    expect(isCsrfSafe({ ...base, method: 'GET' })).toBe(true)
    expect(isCsrfSafe({ ...base, method: 'HEAD' })).toBe(true)
  })
  it('allows mutations that are not cookie-authenticated', () => {
    expect(isCsrfSafe({ ...base, method: 'POST', hasCookie: false })).toBe(true)
    expect(isCsrfSafe({ ...base, method: 'POST', hasAuthHeader: true })).toBe(true)
  })
  it('allows a cookie mutation from the same origin', () => {
    expect(isCsrfSafe({ ...base, method: 'POST', origin: 'https://app.com' })).toBe(true)
    expect(isCsrfSafe({ ...base, method: 'DELETE', referer: 'https://app.com/x' })).toBe(true)
  })
  it('rejects a cookie mutation from a foreign origin or with no origin', () => {
    expect(isCsrfSafe({ ...base, method: 'POST', origin: 'https://evil.com' })).toBe(false)
    expect(isCsrfSafe({ ...base, method: 'POST' })).toBe(false)
    expect(isCsrfSafe({ ...base, method: 'PATCH', origin: 'not a url' })).toBe(false)
  })
})

describe('createRateLimiter', () => {
  it('allows up to the limit then blocks, and resets after the window', () => {
    let t = 1000
    const rl = createRateLimiter({ limit: 2, windowMs: 100, now: () => t })
    expect(rl.allow('a')).toBe(true)
    expect(rl.allow('a')).toBe(true)
    expect(rl.allow('a')).toBe(false) // over limit
    expect(rl.allow('b')).toBe(true) // other key independent
    expect(rl.retryAfter('a')).toBe(100)
    t = 1100 // window elapsed
    expect(rl.allow('a')).toBe(true)
    expect(rl.retryAfter('a')).toBe(100)
  })
})

describe('securityHeaders', () => {
  it('returns conservative defaults and merges extras', () => {
    const h = securityHeaders({ 'Content-Security-Policy': "default-src 'self'" })
    expect(h['X-Content-Type-Options']).toBe('nosniff')
    expect(h['X-Frame-Options']).toBe('SAMEORIGIN')
    expect(h['Content-Security-Policy']).toBe("default-src 'self'")
  })
})
