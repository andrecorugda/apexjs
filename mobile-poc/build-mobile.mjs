// apex build --mobile (reference implementation).
// Turns an `apex build --server` dist into ONE self-contained bundle that runs Apex's
// SSR + API pipeline on a bare JS engine (Hermes/QuickJS). Auto-excludes routes that need
// on-device drivers (@apex-stack/data/@libsql → WASM; auth → crypto.subtle) and reports them.
import { build } from './node_modules/esbuild/lib/main.js'
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const DIST = resolve(process.argv[2] || '../examples/showcase/dist')
const OUT = join(DIST, 'mobile')
const SC = resolve('../examples/showcase/node_modules'), RN = resolve('../node_modules')
const manifest = JSON.parse(readFileSync(join(DIST, 'apex-manifest.json'), 'utf8'))

// A module needs on-device drivers if it imports the DB layer or uses sessions (crypto.subtle).
const src = (f) => { try { return readFileSync(join(DIST, 'server', f), 'utf8') } catch { return '' } }
const needsDriver = (f) => /@apex-stack\/data|@libsql|useSession|sessionAuth/.test(src(f))

const allServer = readdirSync(join(DIST, 'server')).filter((f) => f.endsWith('.mjs'))
const excluded = allServer.filter(needsDriver)
const included = allServer.filter((f) => !needsDriver(f))
const apiKeep = manifest.api.filter((a) => included.includes(a.serverFile))
const routesKeep = manifest.routes.filter((r) => included.includes(r.serverFile))

const imports = included.map((f, i) => `import * as m${i} from '${join(DIST, 'server', f)}'`).join('\n')
const reg = included.map((f, i) => `  ${JSON.stringify(f)}: m${i},`).join('\n')
const trimmed = { ...manifest, api: apiKeep, routes: routesKeep, middleware: [], auth: undefined }

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, '_vfs.mjs'), `export const VFS=${JSON.stringify({
  '/apex-manifest.json': JSON.stringify(trimmed),
  ...Object.fromEntries((manifest.i18n?.locales || []).map((l) => [`/locales/${l}.json`, readFileSync(join(DIST, 'locales', `${l}.json`), 'utf8')])),
})}`)
writeFileSync(join(OUT, '_fs.mjs'), `import {VFS} from './_vfs.mjs'
const n=p=>String(p).replace(/\\\\/g,'/').replace(/^.*?(\\/apex-manifest|\\/locales)/,'$1')
export const readFileSync=p=>{const k=n(p);if(k in VFS)return VFS[k];const e=new Error('ENOENT '+k);e.code='ENOENT';throw e}
export const existsSync=p=>n(p) in VFS
export const statSync=p=>({isFile:()=>n(p) in VFS,isDirectory:()=>false})
export const readdirSync=()=>[]
export default {readFileSync,existsSync,statSync,readdirSync}`)
writeFileSync(join(OUT, '_entry.mjs'), `${imports}
import { createProdWebHandler } from '@apex-stack/core/server'
const registry={\n${reg}\n}
let _h; async function h(){return (_h ??= await createProdWebHandler({dir:'/',loadModule:async f=>registry[f]}))}
export async function run(path){const res=await (await h())(new Request('http://localhost'+(path||'/')));return {status:res.status,body:await res.text()}}
`)

// The self-contained runtime shim (banner): pure-JS globals a bare engine lacks.
const SHIM = readFileSync('polyfills.js', 'utf8') + '\n' + readFileSync('prelude.gen.js', 'utf8')
const NB = ['assert','buffer','child_process','crypto','events','http','https','net','os','path','stream','string_decoder','tls','tty','url','util','v8','vm','worker_threads','zlib','module','perf_hooks']
await build({
  entryPoints: [join(OUT, '_entry.mjs')], bundle: true, format: 'iife', globalName: 'APEX',
  platform: 'neutral', mainFields: ['module','browser','main'], conditions: ['import','module','browser','default'],
  nodePaths: [SC, RN], alias: { 'node:fs': join(OUT, '_fs.mjs'), fs: join(OUT, '_fs.mjs') },
  external: ['node:*', ...NB, '@libsql/client'], banner: { js: SHIM }, outfile: join(OUT, 'server.mjs'), logLevel: 'error',
})
const size = (readFileSync(join(OUT, 'server.mjs'), 'utf8').length / 1024).toFixed(0)
console.log(`\n  apex build --mobile → ${OUT}/server.mjs  (${size} KB, self-contained)`)
console.log(`  included: ${routesKeep.length} route(s) + ${apiKeep.length} API on-engine`)
if (excluded.length) console.log(`  device-driver routes (need @libsql/client/web + crypto.subtle): ${excluded.join(', ')}`)
