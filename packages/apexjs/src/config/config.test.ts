import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { renderPage } from '../dev/renderPage.js'
import { applyEnvToRuntimeConfig, loadDotenv, parseEnvFile, resolveApexConfig } from './resolve.js'
import { clientConfigScript, defineConfig, useRuntimeConfig } from './runtime.js'

const TOUCHED = [
  'APEX_API_SECRET',
  'APEX_PORT',
  'APEX_DEBUG',
  'APEX_PUBLIC_SITE_URL',
  'APEX_PUBLIC_APP_NAME',
  'APEX_UNDECLARED',
]
afterEach(() => {
  for (const k of TOUCHED) delete process.env[k]
})

describe('parseEnvFile', () => {
  it('parses key=value, comments, quotes and export prefix', () => {
    const env = parseEnvFile(
      [
        '# a comment',
        '',
        'APP_NAME=my-app',
        'export SECRET = shh ',
        'QUOTED="hello world"',
        "SINGLE='single'",
        'EMPTY=',
        'not a pair',
      ].join('\n'),
    )
    expect(env.APP_NAME).toBe('my-app')
    expect(env.SECRET).toBe('shh')
    expect(env.QUOTED).toBe('hello world')
    expect(env.SINGLE).toBe('single')
    expect(env.EMPTY).toBe('')
    expect('not a pair' in env).toBe(false)
  })
})

describe('applyEnvToRuntimeConfig', () => {
  it('overrides declared private + public keys with type coercion', () => {
    process.env.APEX_API_SECRET = 'from-env'
    process.env.APEX_PORT = '8080'
    process.env.APEX_DEBUG = 'true'
    process.env.APEX_PUBLIC_SITE_URL = 'https://prod.example'
    process.env.APEX_UNDECLARED = 'ignored' // not in defaults → must NOT appear

    const rc = applyEnvToRuntimeConfig(
      { apiSecret: '', port: 3000, debug: false, public: { siteUrl: 'http://localhost' } },
      tmpdir(), // no .env file here — uses process.env
    )

    expect(rc.apiSecret).toBe('from-env')
    expect(rc.port).toBe(8080) // coerced to number (matches default type)
    expect(rc.debug).toBe(true) // coerced to boolean
    expect((rc.public as Record<string, unknown>).siteUrl).toBe('https://prod.example')
    expect('undeclared' in rc).toBe(false)
    // Registered globally for useRuntimeConfig() on the server.
    expect(useRuntimeConfig().apiSecret).toBe('from-env')
  })

  it('leaves declared keys at their default when no env var is set', () => {
    const rc = applyEnvToRuntimeConfig({ apiSecret: 'default', public: {} }, tmpdir())
    expect(rc.apiSecret).toBe('default')
  })
})

describe('loadDotenv', () => {
  it('reads .env files from the project root without clobbering real env vars', () => {
    const dir = mkdtempSync(join(tmpdir(), 'apex-env-'))
    try {
      writeFileSync(join(dir, '.env'), 'APEX_PUBLIC_APP_NAME=from-dotenv\nAPEX_API_SECRET=base')
      writeFileSync(join(dir, '.env.local'), 'APEX_API_SECRET=local-wins')
      const env = loadDotenv(dir)
      expect(env.APEX_PUBLIC_APP_NAME).toBe('from-dotenv')
      expect(env.APEX_API_SECRET).toBe('local-wins') // later file wins
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('resolveApexConfig', () => {
  it('loads apex.config, merges env, and exposes full + public views', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'apex-cfg-'))
    try {
      writeFileSync(join(dir, 'apex.config.ts'), '// present so existsSync passes')
      process.env.APEX_PUBLIC_SITE_URL = 'https://deployed'
      const fakeLoad = async () => ({
        default: defineConfig({
          runtimeConfig: { apiSecret: '', public: { siteUrl: 'http://localhost', appName: 'x' } },
        }),
      })
      const { runtimeConfig, publicConfig } = await resolveApexConfig(dir, fakeLoad)
      expect((publicConfig as Record<string, unknown>).siteUrl).toBe('https://deployed')
      expect((publicConfig as Record<string, unknown>).appName).toBe('x')
      expect('apiSecret' in runtimeConfig).toBe(true)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('returns an empty public config when no apex.config exists', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'apex-nocfg-'))
    try {
      const { publicConfig } = await resolveApexConfig(dir, async () => ({}))
      expect(publicConfig).toEqual({})
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('clientConfigScript', () => {
  it('seeds window config and escapes </script> to prevent breakout', () => {
    const script = clientConfigScript({ evil: '</script><script>alert(1)' })
    expect(script).toContain('window.__APEX_CONFIG__=')
    expect(script).not.toContain('</script><script>alert(1)')
    expect(script).toContain('\\u003c/script>')
  })
})

describe('renderPage — runtime config', () => {
  it('passes config to the loader and seeds public config into the client shell', async () => {
    const html = await renderPage({
      loadModule: async () => ({
        loader: ({ config }) => ({ site: (config.public as Record<string, unknown>).siteUrl }),
        template: '<p x-text="site"></p>',
        rootXData: null,
        componentId: 'c0',
        scopeId: 'data-apex-x',
        css: '',
      }),
      pageId: '/pages/index.alpine',
      url: '/',
      runtimeConfig: { apiSecret: 'server-only', public: { siteUrl: 'https://apex.test' } },
      publicConfig: { siteUrl: 'https://apex.test' },
    })
    // Loader received config → value rendered in SSR HTML.
    expect(html).toContain('https://apex.test')
    // Public config seeded for the client…
    expect(html).toContain('window.__APEX_CONFIG__=')
    // …but the private key never reaches the client.
    expect(html).not.toContain('server-only')
  })
})
