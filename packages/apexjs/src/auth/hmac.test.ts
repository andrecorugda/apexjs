import { createHash, createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { hmacSha256, sealHmac, sha256, unsealHmac } from './hmac.js'

const enc = new TextEncoder()
const hex = (u: Uint8Array) => Buffer.from(u).toString('hex')

describe('pure-JS SHA-256 / HMAC (device session crypto)', () => {
  it('sha256 matches node:crypto for various inputs', () => {
    for (const s of [
      '',
      'abc',
      'The quick brown fox jumps over the lazy dog',
      'x'.repeat(1000),
      '✓ é 😀',
    ]) {
      const mine = hex(sha256(enc.encode(s)))
      const node = createHash('sha256').update(s).digest('hex')
      expect(mine).toBe(node)
    }
  })

  it('hmacSha256 matches node:crypto (incl. a >64-byte key)', () => {
    for (const [k, m] of [
      ['key', 'message'],
      ['a-32-char-minimum-session-password!!', '{"user":{"id":"ada"}}'],
      ['k'.repeat(200), 'long key gets hashed first'],
    ] as const) {
      const mine = hex(hmacSha256(enc.encode(k), enc.encode(m)))
      const node = createHmac('sha256', k).update(m).digest('hex')
      expect(mine).toBe(node)
    }
  })

  it('seals + unseals a session round-trip', () => {
    const pw = 'a-32-char-minimum-session-password!!'
    const token = sealHmac({ user: { id: 'ada', name: 'Ada' } }, pw)
    expect(unsealHmac(token, pw)).toEqual({ user: { id: 'ada', name: 'Ada' } })
  })

  it('rejects a tampered payload and a wrong password', () => {
    const pw = 'a-32-char-minimum-session-password!!'
    const token = sealHmac({ user: { id: 'ada' } }, pw)
    const [payload, sig] = token.split('.')
    // Flip the payload but keep the old signature → must fail (returns {}).
    const forged = `${payload}x.${sig}`
    expect(unsealHmac(forged, pw)).toEqual({})
    // Right token, wrong password → fail.
    expect(unsealHmac(token, 'different-32-char-session-password!!')).toEqual({})
    // Missing/garbage → {}.
    expect(unsealHmac(undefined, pw)).toEqual({})
    expect(unsealHmac('nodot', pw)).toEqual({})
  })
})
