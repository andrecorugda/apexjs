// Tests for the `.alpine` Vite plugin's HMR classification in `handleHotUpdate`:
// a style-only edit hot-swaps CSS, a template-markup edit ships an `apex:template`
// morph message (NOT a full reload), and an unsafe change (root x-data / script
// body) falls back to `full-reload`. Mirrors the structure of `compile.test.ts`.
//
// NOTE: this covers the SERVER-side decision + payload only. Verifying that the
// browser actually morphs the DOM on that message needs a running dev server +
// browser (out of scope for unit tests — see morph.test.ts / client/hmr.test.ts).
import { describe, expect, it, vi } from 'vitest'
import { apex } from './index.js'

const FILE = '/pages/index.alpine'

/** Compose a `.alpine` source from its parts. */
function sfc(opts: {
  tpl?: string
  xdata?: string
  style?: string
  server?: string
  client?: string
}): string {
  const { tpl = '<p>hi</p>', xdata = '{ n: 0 }', style = 'p { color: red }', server, client } = opts
  return [
    server ? `<script server>\n${server}\n</script>` : '',
    client ? `<script client>\n${client}\n</script>` : '',
    `<template x-data="${xdata}">${tpl}</template>`,
    `<style scoped>${style}</style>`,
  ]
    .filter(Boolean)
    .join('\n')
}

// The plugin's transform/handleHotUpdate are declared as plain methods on the returned
// object; call them directly with minimal shims.
type AnyPlugin = any

function makeCtx(file: string, nextSource: string) {
  const send = vi.fn()
  const ctx = {
    file,
    read: async () => nextSource,
    server: {
      ws: { send },
      moduleGraph: {
        getModulesByFile: () => new Set(),
        invalidateModule: () => {},
      },
    },
  }
  return { ctx, send }
}

/** Register the plugin's per-file structure snapshot by running `transform` once. */
async function seed(plugin: AnyPlugin, source: string) {
  await plugin.transform(source, FILE, { ssr: false })
}

async function hotUpdate(plugin: AnyPlugin, file: string, nextSource: string) {
  const { ctx, send } = makeCtx(file, nextSource)
  await plugin.handleHotUpdate(ctx)
  return send
}

/** The single message passed to `ws.send` (throws if it was never called). */
function sentMessage(send: ReturnType<typeof vi.fn>): AnyPlugin {
  const call = send.mock.calls[0]
  if (!call) throw new Error('ws.send was not called')
  return call[0]
}

describe('apex plugin — handleHotUpdate HMR classification', () => {
  it('style-only edit → apex:css hot-swap, no reload', async () => {
    const plugin = apex() as AnyPlugin
    await seed(plugin, sfc({ style: 'p { color: red }' }))
    const send = await hotUpdate(plugin, FILE, sfc({ style: 'p { color: blue }' }))

    expect(send).toHaveBeenCalledTimes(1)
    const msg = sentMessage(send)
    expect(msg.type).toBe('custom')
    expect(msg.event).toBe('apex:css')
    expect(msg.data.css).toContain('blue')
  })

  it('template-markup edit (x-data + scripts unchanged) → apex:template morph, NOT full-reload', async () => {
    const plugin = apex() as AnyPlugin
    await seed(plugin, sfc({ tpl: '<p>hi</p>' }))
    const send = await hotUpdate(plugin, FILE, sfc({ tpl: '<p>bye</p>' }))

    expect(send).toHaveBeenCalledTimes(1)
    const msg = sentMessage(send)
    expect(msg.type).toBe('custom')
    expect(msg.event).toBe('apex:template')
    expect(msg.data.template).toContain('bye')
    expect(msg.data.componentId).toBeTruthy()
    expect(msg.data.scopeId).toMatch(/^data-apex-/)
    // Definitely not a reload.
    expect(msg.type).not.toBe('full-reload')
  })

  it('carries non-x-data root attrs in the morph payload', async () => {
    const plugin = apex() as AnyPlugin
    const before = '<template x-data="{ n: 0 }" x-init="a()"><p>hi</p></template>'
    const after = '<template x-data="{ n: 0 }" x-init="a()"><p>bye</p></template>'
    await seed(plugin, before)
    const send = await hotUpdate(plugin, FILE, after)

    const msg = sentMessage(send)
    expect(msg.event).toBe('apex:template')
    expect(msg.data.rootAttrs['x-init']).toBe('a()')
    expect(msg.data.rootAttrs['x-data']).toBeUndefined()
  })

  it('unsafe change — root x-data shape changed → full-reload', async () => {
    const plugin = apex() as AnyPlugin
    await seed(plugin, sfc({ xdata: '{ n: 0 }' }))
    const send = await hotUpdate(plugin, FILE, sfc({ xdata: '{ n: 0, open: false }' }))

    expect(send).toHaveBeenCalledTimes(1)
    expect(sentMessage(send)).toEqual({ type: 'full-reload' })
  })

  it('unsafe change — <script server> body changed → full-reload', async () => {
    const plugin = apex() as AnyPlugin
    await seed(plugin, sfc({ server: 'export const loader = () => ({ a: 1 })' }))
    const send = await hotUpdate(
      plugin,
      FILE,
      sfc({ server: 'export const loader = () => ({ a: 2 })' }),
    )

    expect(send).toHaveBeenCalledTimes(1)
    expect(sentMessage(send)).toEqual({ type: 'full-reload' })
  })

  it('fullReloadOnly (islands) forces a full-reload even for a template edit', async () => {
    const plugin = apex({ fullReloadOnly: true }) as AnyPlugin
    await seed(plugin, sfc({ tpl: '<p>hi</p>' }))
    const send = await hotUpdate(plugin, FILE, sfc({ tpl: '<p>bye</p>' }))

    expect(send).toHaveBeenCalledTimes(1)
    expect(sentMessage(send)).toEqual({ type: 'full-reload' })
  })

  it('no prior snapshot (file never transformed) → full-reload', async () => {
    const plugin = apex() as AnyPlugin
    const send = await hotUpdate(plugin, FILE, sfc({ tpl: '<p>bye</p>' }))

    expect(send).toHaveBeenCalledTimes(1)
    expect(sentMessage(send)).toEqual({ type: 'full-reload' })
  })

  it('ignores non-.alpine files', async () => {
    const plugin = apex() as AnyPlugin
    const send = await hotUpdate(plugin, '/pages/style.css', 'body{}')
    expect(send).not.toHaveBeenCalled()
  })
})
