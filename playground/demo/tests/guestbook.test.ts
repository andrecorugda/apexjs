import { describe, expect, it } from 'vitest'
import { GuestbookService } from '../services/GuestbookService.js'

describe('GuestbookService', () => {
  const s = new GuestbookService()
  it('computes initials', () => {
    expect(s.initials('Ada Lovelace')).toBe('AL')
    expect(s.initials('cher')).toBe('C')
  })
  it('formats relative time', () => {
    const now = Date.parse('2026-01-01T00:10:00Z')
    expect(s.ago('2026-01-01 00:09:30', now)).toBe('just now')
    expect(s.ago('2026-01-01 00:05:00', now)).toBe('5m ago')
  })
  it('decorates a message', () => {
    const d = s.decorate({
      id: 1,
      author: 'Ada Lovelace',
      body: 'hi',
      createdAt: '2026-01-01 00:00:00',
    })
    expect(d.initials).toBe('AL')
    expect(typeof d.ago).toBe('string')
  })
})
