import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { planComposable, resourceName } from './make.js'

function fixture(modelFile: string, source: string): string {
  const root = mkdtempSync(join(tmpdir(), 'apex-make-'))
  mkdirSync(join(root, 'models'), { recursive: true })
  writeFileSync(join(root, 'models', modelFile), source)
  return root
}

describe('make composable', () => {
  it('derives hook/type names, field types, and create-payload omissions from a model', () => {
    const root = fixture(
      'Post.ts',
      `import { defineModel } from '@apex-stack/data'
       import { timestamps } from '@apex-stack/data'
       export default defineModel('posts', {
         fields: {
           title: { type: 'string', notNull: true },
           views: 'int',
           published: 'boolean',
           meta: 'json',
         },
         use: [timestamps()],
       })`,
    )
    const [artifact] = planComposable('Post', root)
    expect(artifact?.path).toContain(join('composables', 'usePosts.ts'))
    const out = artifact?.contents ?? ''
    // Item interface: pk + declared fields + behavior fields, TS-typed.
    expect(out).toContain('export interface Post {')
    expect(out).toContain('  id: number')
    expect(out).toContain('  title: string')
    expect(out).toContain('  views: number')
    expect(out).toContain('  published: boolean')
    expect(out).toContain('  meta: unknown')
    expect(out).toContain('  created_at: string')
    expect(out).toContain('  updated_at: string')
    // Create payload omits server-stamped columns.
    expect(out).toContain("export type NewPost = Omit<Post, 'id' | 'created_at' | 'updated_at'>")
    // Typed hook wired to the resource.
    expect(out).toContain('export function usePosts(): ResourceClientState<Post, NewPost> {')
    expect(out).toContain("return createResourceClient<Post, NewPost>('posts')")
  })

  it('singularizes the item type and finds the model case-insensitively', () => {
    const root = fixture(
      'category.ts',
      `export default defineModel('categories', { fields: { name: 'string' } })`,
    )
    const [artifact] = planComposable('Category', root) // typed "Category", file is category.ts
    expect(artifact?.path).toContain('useCategories.ts')
    expect(artifact?.contents).toContain('export interface Category {')
  })

  it('throws a helpful error when no model exists', () => {
    const root = mkdtempSync(join(tmpdir(), 'apex-make-'))
    expect(() => planComposable('Ghost', root)).toThrow(/No model found/)
  })
})

describe('resourceName (model → REST/table resource)', () => {
  it('normalizes any casing/number to lowercase-plural', () => {
    expect(resourceName('Post')).toBe('posts')
    expect(resourceName('post')).toBe('posts')
    expect(resourceName('posts')).toBe('posts') // idempotent
    expect(resourceName('Category')).toBe('categories')
    expect(resourceName('categories')).toBe('categories')
    expect(resourceName('Box')).toBe('boxes')
  })

  it('handles irregular plurals in both directions (idempotent)', () => {
    expect(resourceName('Person')).toBe('people')
    expect(resourceName('people')).toBe('people') // plural input → same
    expect(resourceName('Child')).toBe('children')
    expect(resourceName('Datum')).toBe('data')
    expect(resourceName('Status')).toBe('statuses') // NOT stati
    expect(resourceName('Analysis')).toBe('analyses')
  })

  it('leaves uncountables alone', () => {
    expect(resourceName('Sheep')).toBe('sheep')
    expect(resourceName('Series')).toBe('series')
  })
})
