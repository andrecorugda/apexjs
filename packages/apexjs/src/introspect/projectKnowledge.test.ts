import { describe, expect, it } from 'vitest'
import { mountedApiPath, parseModelInfo, parseRouteInfo } from './projectKnowledge.js'

describe('parseModelInfo', () => {
  it('extracts table, fields, and behaviors from a defineModel', () => {
    const src = `
      import { defineModel, timestamps, owned } from '@apex-stack/data'
      export const Message = defineModel('messages', {
        fields: {
          author: { type: 'string', notNull: true },
          body: { type: 'string', notNull: true },
          views: { type: 'integer', default: 0 },
        },
        use: [timestamps(), owned()],
      })`
    const info = parseModelInfo(src)
    expect(info.table).toBe('messages')
    expect(info.fields).toEqual([
      { name: 'author', type: 'string', notNull: true },
      { name: 'body', type: 'string', notNull: true },
      { name: 'views', type: 'integer', default: '0' },
    ])
    expect(info.behaviors).toEqual(['timestamps', 'owned'])
  })

  it('does not throw on a malformed / empty source', () => {
    expect(parseModelInfo('export const x = 1').fields).toEqual([])
    expect(parseModelInfo('').table).toBeUndefined()
  })
})

describe('parseRouteInfo', () => {
  it('reads method, mcp, auth, and mcpName from a defineApexRoute', () => {
    const src = `export default defineApexRoute({
      method: 'POST', description: 'x', mcp: true, auth: true, mcpName: 'add_thing',
      input: { a: z.number() }, handler: () => ({}) })`
    expect(parseRouteInfo(src)).toEqual({
      method: 'POST',
      mcp: true,
      auth: true,
      mcpName: 'add_thing',
      kind: 'route',
    })
  })

  it('defaults method to GET and detects a resource', () => {
    expect(parseRouteInfo('export default defineApexRoute({ mcp: false })')).toEqual({
      method: 'GET',
      mcp: false,
      kind: 'route',
    })
    const res = parseRouteInfo('export default Message.resource(handle)')
    expect(res.kind).toBe('resource')
    expect(res.method).toBe('ANY')
  })
})

describe('mountedApiPath', () => {
  it('maps file paths to mounted URLs', () => {
    expect(mountedApiPath('posts.ts')).toBe('/api/posts')
    expect(mountedApiPath('admin/users.ts')).toBe('/api/admin/users')
    expect(mountedApiPath('index.ts')).toBe('/api')
  })
})
