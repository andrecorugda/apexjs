import { describe, expect, it } from 'vitest'
import { virtualFilesForAlpine, virtualToAlpine } from './alpineVirtual.js'

const SFC = `<script server lang="ts">
export function loader() { return { n: 1 } }
</script>
<script client lang="ts">
const x: number = 2
</script>
<template x-data>
  <p x-text="n"></p>
</template>`

describe('virtualFilesForAlpine', () => {
  const files = virtualFilesForAlpine(SFC, '/app/pages/index.alpine')

  it('emits one virtual .ts per script block, named off the .alpine path', () => {
    expect(files.map((f) => f.path)).toEqual([
      '/app/pages/index.alpine.server.ts',
      '/app/pages/index.alpine.client.ts',
    ])
  })

  it('is line-preserving — same line count, block content on its original lines', () => {
    for (const f of files) {
      expect(f.content.split('\n').length).toBe(SFC.split('\n').length)
    }
    const server = files[0]?.content ?? ''
    const client = files[1]?.content ?? ''
    // Server code sits on line 2; client code on line 5 (1-indexed).
    expect(server.split('\n')[1]).toContain('export function loader()')
    expect(client.split('\n')[4]).toContain('const x: number = 2')
  })

  it('isolates the blocks — server file omits client code and vice-versa', () => {
    const server = files[0]?.content ?? ''
    const client = files[1]?.content ?? ''
    expect(server).not.toContain('const x: number')
    expect(client).not.toContain('loader()')
    // Template markup never leaks into either virtual file.
    expect(server).not.toContain('x-text')
    expect(client).not.toContain('x-text')
  })

  it('emits nothing for a template-only component', () => {
    expect(virtualFilesForAlpine('<template x-data></template>', '/a/b.alpine')).toEqual([])
  })

  it('normalizes Windows backslash paths to POSIX (TS host queries forward slashes)', () => {
    // Regression: a backslash-keyed virtual map misses TS's forward-slash lookups on
    // Windows, silently skipping every .alpine file. Emitted paths must be POSIX.
    const win = virtualFilesForAlpine(SFC, 'C:\\app\\pages\\index.alpine')
    expect(win.map((f) => f.path)).toEqual([
      'C:/app/pages/index.alpine.server.ts',
      'C:/app/pages/index.alpine.client.ts',
    ])
    for (const f of win) expect(f.path).not.toContain('\\')
  })
})

describe('virtualToAlpine', () => {
  it('maps a virtual path back to its .alpine', () => {
    expect(virtualToAlpine('/app/x.alpine.server.ts')).toBe('/app/x.alpine')
    expect(virtualToAlpine('/app/x.alpine.client.ts')).toBe('/app/x.alpine')
  })
})
