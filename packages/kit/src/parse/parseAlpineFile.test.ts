import { describe, expect, it } from 'vitest'
import { AlpineParseError, parseAlpineFile } from './parseAlpineFile.js'

describe('parseAlpineFile', () => {
  it('splits the three top-level blocks', () => {
    const src = [
      '<script server lang="ts">',
      '  export function loader() { return { n: 1 } }',
      '</script>',
      '',
      '<template x-data>',
      '  <h1 x-text="n"></h1>',
      '</template>',
      '',
      '<style scoped>',
      '  h1 { color: red; }',
      '</style>',
    ].join('\n')

    const d = parseAlpineFile(src, 'page.alpine')
    expect(d.filename).toBe('page.alpine')
    expect(d.script?.lang).toBe('ts')
    expect(d.script?.content).toContain('export function loader')
    expect(d.template?.attrs).toHaveProperty('x-data')
    expect(d.template?.content).toContain('<h1 x-text="n">')
    expect(d.styles).toHaveLength(1)
    expect(d.styles[0]?.scoped).toBe(true)
  })

  it('does NOT truncate at nested <template x-for> / x-if', () => {
    const src = [
      '<template x-data="{ items: [1,2,3] }">',
      '  <ul>',
      '    <template x-for="i in items">',
      '      <template x-if="i > 1">',
      '        <li x-text="i"></li>',
      '      </template>',
      '    </template>',
      '  </ul>',
      '</template>',
    ].join('\n')

    const d = parseAlpineFile(src)
    // Both nested templates and their closings must survive intact.
    expect(d.template?.content).toContain('x-for="i in items"')
    expect(d.template?.content).toContain('x-if="i > 1"')
    // Two inner closing tags preserved (the outer close is consumed as the delimiter).
    expect(d.template?.content.match(/<\/template>/g)).toHaveLength(2)
  })

  it('defaults script lang to ts', () => {
    const d = parseAlpineFile('<script server>const x = 1</script>')
    expect(d.script?.lang).toBe('ts')
  })

  it('collects multiple style blocks', () => {
    const d = parseAlpineFile('<style>a{}</style><style scoped lang="scss">b{}</style>')
    expect(d.styles).toHaveLength(2)
    expect(d.styles[0]?.scoped).toBe(false)
    expect(d.styles[1]?.scoped).toBe(true)
    expect(d.styles[1]?.lang).toBe('scss')
  })

  it('rejects a non-server <script>', () => {
    expect(() => parseAlpineFile('<script>alert(1)</script>')).toThrow(AlpineParseError)
  })

  it('is TypeScript-only: bare/ts scripts pass, lang="js" is rejected', () => {
    expect(parseAlpineFile('<script server>const x=1</script>').script?.lang).toBe('ts')
    expect(parseAlpineFile('<script client lang="ts">const x=1</script>').clientScript?.lang).toBe(
      'ts',
    )
    expect(() => parseAlpineFile('<script server lang="js">var z=1</script>')).toThrow(
      /must be TypeScript/,
    )
  })

  it('rejects duplicate <template>', () => {
    expect(() => parseAlpineFile('<template></template><template></template>')).toThrow(
      /only have one/,
    )
  })

  it('rejects duplicate <script server>', () => {
    expect(() => parseAlpineFile('<script server>1</script><script server>2</script>')).toThrow(
      /duplicate/,
    )
  })

  it('handles empty input', () => {
    const d = parseAlpineFile('')
    expect(d.script).toBeUndefined()
    expect(d.template).toBeUndefined()
    expect(d.styles).toHaveLength(0)
  })
})
