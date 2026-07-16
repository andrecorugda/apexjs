import { readFileSync, writeFileSync } from 'node:fs'
const DIST = '../examples/showcase/dist'
const manifest = JSON.parse(readFileSync(`${DIST}/apex-manifest.json`, 'utf8'))

// Prove pages + a plain API route on the bare engine. Exclude DB routes (@libsql native →
// device-side WASM/native) and auth routes (h3 useSession → crypto.subtle → device-side).
const SAFE_API = ['ping']
const indexRoute = manifest.routes.find(r => r.pattern === '/')
const apiKeep = manifest.api.filter(a => SAFE_API.includes(a.name))
const toRegister = [
  ...Object.values(manifest.components),
  ...(manifest.layouts || []).map(l => l.serverFile),
  indexRoute.serverFile,
  ...apiKeep.map(a => a.serverFile),
]
const imports = toRegister.map((f, i) => `import * as m${i} from '${DIST}/server/${f}'`).join('\n')
const entries = toRegister.map((f, i) => `  ${JSON.stringify(f)}: m${i},`).join('\n')

const trimmed = { ...manifest, api: apiKeep, middleware: [], auth: undefined }
const vfs = {
  '/apex-manifest.json': JSON.stringify(trimmed),
  '/locales/en.json': readFileSync(`${DIST}/locales/en.json`, 'utf8'),
  '/locales/fr.json': readFileSync(`${DIST}/locales/fr.json`, 'utf8'),
}
writeFileSync('vfs.gen.mjs', `export const VFS = ${JSON.stringify(vfs)}\n`)
writeFileSync('entry.app.mjs', `${imports}
import { createProdWebHandler } from '@apex-stack/core/server'
const registry = {
${entries}
}
let _handler
async function handler() { return (_handler ??= await createProdWebHandler({ dir: '/', loadModule: async (f) => registry[f] })) }
export async function run(path) {
  const h = await handler()
  const res = await h(new Request('http://localhost' + (path || '/')))
  const body = await res.text()
  return { status: res.status, contentType: res.headers.get('content-type'), body }
}
`)
console.log('registered:', toRegister.join(', '))
console.log('api kept:', apiKeep.map(a=>a.name).join(', ') || '(none)')
