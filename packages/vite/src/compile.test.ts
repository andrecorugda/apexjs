import { parseAlpineFile } from '@apexjs/kit'
import { describe, expect, it } from 'vitest'
import { compileAlpine } from './compile.js'

const SRC = [
  '<script server lang="ts">',
  '  const SECRET = process.env.DB_PASSWORD',
  '  export async function loader() { return { n: 1 } }',
  '</script>',
  '<template x-data="{ count: 0 }">',
  '  <button @click="count++" x-text="count"></button>',
  '</template>',
  '<style scoped>button { color: red }</style>',
].join('\n')

describe('compileAlpine', () => {
  it('SSR module exports loader, template, ids and scoped css', () => {
    const d = parseAlpineFile(SRC, '/pages/index.alpine')
    const { code } = compileAlpine(d, '/pages/index.alpine', { ssr: true })
    expect(code).toContain('export async function loader')
    expect(code).toContain('export const template =')
    expect(code).toContain('export const componentId =')
    expect(code).toContain('export const scopeId =')
    // scoped css was rewritten with the scope attribute
    expect(code).toContain('button[data-apex-')
  })

  it('client module NEVER includes <script server> code (no secret leak)', () => {
    const d = parseAlpineFile(SRC, '/pages/index.alpine')
    const { code } = compileAlpine(d, '/pages/index.alpine', { ssr: false })
    expect(code).not.toContain('SECRET')
    expect(code).not.toContain('DB_PASSWORD')
    expect(code).not.toContain('loader')
    // It registers the component with the authored x-data inlined.
    expect(code).toContain('registerApexComponent')
    expect(code).toContain('{ count: 0 }')
    expect(code).toContain('import.meta.hot')
  })

  it('falls back to an empty loader when no <script server> is present', () => {
    const d = parseAlpineFile('<template x-data><p>hi</p></template>', '/pages/x.alpine')
    const { code } = compileAlpine(d, '/pages/x.alpine', { ssr: true })
    expect(code).toContain('export const loader = () => ({})')
  })

  it('uses a stable id derived from the file path', () => {
    const d = parseAlpineFile(SRC, '/pages/index.alpine')
    const a = compileAlpine(d, '/pages/index.alpine', { ssr: true }).code
    const b = compileAlpine(d, '/pages/index.alpine', { ssr: true }).code
    expect(a).toBe(b)
  })
})
