import { parse } from 'devalue'
import { describe, expect, it } from 'vitest'
import { serializeState, stateIsland } from './island.js'

describe('state island', () => {
  it('round-trips plain data', () => {
    const data = { title: 'Hi', likes: 3, items: ['a', 'b'] }
    expect(parse(serializeState(data))).toEqual(data)
  })

  it('is XSS-safe: no raw </script> survives serialization', () => {
    const data = { evil: '</script><script>alert(1)</script>' }
    const island = stateIsland('c0', data)
    // The dangerous closing tag must be escaped inside the island.
    expect(island).not.toContain('</script><script>alert(1)')
    // And it must still round-trip to the original value.
    const json = island.replace(/^.*data-apex-state="c0">/, '').replace(/<\/script>$/, '')
    expect(parse(json)).toEqual(data)
  })

  it('round-trips Dates (which JSON would stringify to a string)', () => {
    const data = { when: new Date('2026-07-03T00:00:00.000Z') }
    const back = parse(serializeState(data)) as { when: Date }
    expect(back.when).toBeInstanceOf(Date)
    expect(back.when.toISOString()).toBe('2026-07-03T00:00:00.000Z')
  })

  it('wraps the island with the component id', () => {
    expect(stateIsland('c7', { n: 1 })).toContain('data-apex-state="c7"')
    expect(stateIsland('c7', { n: 1 })).toContain('type="application/json"')
  })
})
