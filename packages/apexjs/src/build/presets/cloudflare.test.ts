import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { collectCloudflareAssets, emitCloudflarePreset } from './cloudflare.js'
import { deployPresets, resolveDeployPreset } from './index.js'

// NOTE: These are output-SHAPE tests. They assert the Cloudflare preset emits the
// worker + manifest + wrangler config a real deploy needs. Full verification (an
// actual `wrangler deploy` on the edge) is out of scope for CI.

/** Lay down a minimal `apex build --server` output tree under a fresh temp root. */
function serverBuildFixture(): { root: string; outDirAbs: string; outDir: string } {
  const root = mkdtempSync(join(tmpdir(), 'apex-cf-'))
  const outDir = 'dist'
  const outDirAbs = join(root, outDir)
  mkdirSync(join(outDirAbs, 'assets'), { recursive: true })
  mkdirSync(join(outDirAbs, 'server'), { recursive: true })
  // Public static assets — should be routed to env.ASSETS.
  writeFileSync(join(outDirAbs, 'assets', 'app-abc123.js'), '// bundle')
  writeFileSync(join(outDirAbs, 'favicon.ico'), 'icon')
  writeFileSync(join(outDirAbs, 'index.html'), '<!doctype html>')
  // Server-only files — must NOT appear in the public asset manifest.
  writeFileSync(join(outDirAbs, 'apex-manifest.json'), '{}')
  writeFileSync(join(outDirAbs, 'server', 'index.mjs'), '// ssr module')
  return { root, outDirAbs, outDir }
}

describe('collectCloudflareAssets', () => {
  it('maps public static files to root-absolute URLs and skips server-only paths', () => {
    const { outDirAbs } = serverBuildFixture()
    const assets = collectCloudflareAssets(outDirAbs)
    expect(assets).toContain('/assets/app-abc123.js')
    expect(assets).toContain('/favicon.ico')
    expect(assets).toContain('/index.html')
    // Root index.html is also reachable at the bare path.
    expect(assets).toContain('/')
    // Server modules + run manifest are private to the SSR runtime.
    expect(assets).not.toContain('/apex-manifest.json')
    expect(assets.some((a) => a.startsWith('/server/'))).toBe(false)
  })

  it('returns an empty list for a missing output dir', () => {
    expect(collectCloudflareAssets(join(tmpdir(), 'apex-cf-does-not-exist-xyz'))).toEqual([])
  })
})

describe('emitCloudflarePreset', () => {
  it('emits _worker.js + apex-cf-assets.json + wrangler.toml with the expected shape', () => {
    const { root, outDirAbs, outDir } = serverBuildFixture()
    emitCloudflarePreset(root, outDir, outDirAbs)

    // 1) The three deploy files exist at the project root.
    expect(existsSync(join(root, '_worker.js'))).toBe(true)
    expect(existsSync(join(root, 'apex-cf-assets.json'))).toBe(true)
    expect(existsSync(join(root, 'wrangler.toml'))).toBe(true)

    // 2) Module worker: default export + fetch(request, env, ctx), fetch-style handler,
    //    static-asset short-circuit, and no node:http / node:url on the edge path.
    const worker = readFileSync(join(root, '_worker.js'), 'utf8')
    expect(worker).toContain('export default {')
    expect(worker).toContain('async fetch(request, env, ctx)')
    expect(worker).toContain("import { createProdWebHandler } from '@apex-stack/core/server'")
    expect(worker).toContain('env.ASSETS.fetch(request)')
    expect(worker).toContain(`createProdWebHandler({ dir: './${outDir}' })`)
    expect(worker).not.toContain('node:http')
    expect(worker).not.toContain('node:url')

    // 3) Asset manifest: valid JSON carrying the public assets, not the server files.
    const manifest = JSON.parse(readFileSync(join(root, 'apex-cf-assets.json'), 'utf8'))
    expect(manifest.outDir).toBe(outDir)
    expect(Array.isArray(manifest.assets)).toBe(true)
    expect(manifest.assets).toContain('/assets/app-abc123.js')
    expect(manifest.assets).not.toContain('/apex-manifest.json')

    // 4) wrangler.toml: module worker entry, static-asset binding, nodejs_compat.
    const wrangler = readFileSync(join(root, 'wrangler.toml'), 'utf8')
    expect(wrangler).toContain('main = "_worker.js"')
    expect(wrangler).toContain('[assets]')
    expect(wrangler).toContain(`directory = "./${outDir}"`)
    expect(wrangler).toContain('binding = "ASSETS"')
    expect(wrangler).toContain('compatibility_flags = ["nodejs_compat"]')
  })
})

describe('deploy preset registry', () => {
  it('registers cloudflare alongside the shipped presets', () => {
    expect(Object.keys(deployPresets).sort()).toEqual(['cloudflare', 'docker', 'netlify', 'vercel'])
    const cf = resolveDeployPreset('cloudflare')
    expect(cf?.name).toBe('cloudflare')
    expect(cf?.serverBuild).toBe(true)
    // Docker scaffolds inside the container — it does not consume a host-side server build.
    expect(resolveDeployPreset('docker')?.serverBuild).toBe(false)
    expect(resolveDeployPreset('nope')).toBeUndefined()
  })

  it('cloudflarePreset.build routes context through to the emitter', async () => {
    const { root, outDirAbs, outDir } = serverBuildFixture()
    await resolveDeployPreset('cloudflare')?.build({ root, outDir, outDirAbs })
    expect(existsSync(join(root, '_worker.js'))).toBe(true)
    expect(existsSync(join(root, 'wrangler.toml'))).toBe(true)
  })
})
