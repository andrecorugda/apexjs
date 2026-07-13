import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { defineApexRoute } from './defineRoute.js'
import { loadApiRoutes } from './routes.js'

// A route file's content is irrelevant here — the injected loadModule decides what each
// resolves to (or throws), mirroring how createTestApp loads via Vite's SSR loader.
function appWith(files: string[]): string {
  const root = mkdtempSync(join(tmpdir(), 'apex-routes-'))
  mkdirSync(join(root, 'server', 'api'), { recursive: true })
  for (const f of files) writeFileSync(join(root, 'server', 'api', f), '')
  return root
}

const goodRoute = { default: defineApexRoute({ method: 'GET', handler: () => ({ ok: true }) }) }
const load = async (id: string) => {
  if (id.endsWith('articles.ts'))
    throw new Error("Cannot find package '@apex-stack/data' imported from articles.ts")
  return goodRoute
}

describe('loadApiRoutes — an unresolvable route dep', () => {
  it('throws a clear, actionable error by default (names route + module + install hint)', async () => {
    const root = appWith(['good.ts', 'articles.ts'])
    await expect(loadApiRoutes(root, load as never)).rejects.toThrow(
      /server\/api\/articles\.ts.*@apex-stack\/data.*npm i @apex-stack\/data @libsql\/client/s,
    )
  })

  it('skips the unresolvable route and loads the rest when lenient', async () => {
    const root = appWith(['good.ts', 'articles.ts'])
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const entries = await loadApiRoutes(root, load as never, { lenient: true })
    expect(entries.length).toBeGreaterThan(0) // 'good' still mounted
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })
})
