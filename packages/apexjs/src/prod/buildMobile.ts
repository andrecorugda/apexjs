import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import type { ProdManifest } from './server.js'

// Self-contained runtime shim (esbuild banner): pure-JS globals a bare on-device engine
// (Hermes/QuickJS) lacks. Regex-free so it embeds cleanly. On a real device the WebView/RN
// runtime already provides most of these — this is the belt-and-suspenders baseline.
const SHIM = `
globalThis.console=globalThis.console||{log(){},error(){},warn(){},info(){},debug(){}};
(function(){var C='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function b64(s){s=String(s);var o=[],bits=0,val=0;for(var i=0;i<s.length;i++){var c=s.charAt(i);if(c==='=')break;var idx=C.indexOf(c);if(idx<0)continue;val=(val<<6)|idx;bits+=6;if(bits>=8){bits-=8;o.push((val>>bits)&255);}}return new Uint8Array(o);}
if(typeof globalThis.TextEncoder==='undefined')globalThis.TextEncoder=class{encode(s){s=String(s);var b=[];for(var i=0;i<s.length;i++){var c=s.charCodeAt(i);if(c>=0xd800&&c<=0xdbff&&i+1<s.length){var c2=s.charCodeAt(i+1);if(c2>=0xdc00&&c2<=0xdfff){c=0x10000+((c-0xd800)<<10)+(c2-0xdc00);i++;}}if(c<128)b.push(c);else if(c<2048)b.push(192|(c>>6),128|(c&63));else if(c<65536)b.push(224|(c>>12),128|((c>>6)&63),128|(c&63));else b.push(240|(c>>18),128|((c>>12)&63),128|((c>>6)&63),128|(c&63));}return new Uint8Array(b);}};
if(typeof globalThis.TextDecoder==='undefined')globalThis.TextDecoder=class{decode(u){var a=u instanceof Uint8Array?u:new Uint8Array(u&&u.buffer?u.buffer:u||[]),s='';for(var i=0;i<a.length;){var c=a[i++];if(c>=240){c=((c&7)<<18)|((a[i++]&63)<<12)|((a[i++]&63)<<6)|(a[i++]&63);}else if(c>=224){c=((c&15)<<12)|((a[i++]&63)<<6)|(a[i++]&63);}else if(c>=192){c=((c&31)<<6)|(a[i++]&63);}if(c>1114111||(c>=55296&&c<=57343)||c<0)c=65533;s+=String.fromCodePoint(c);}return s;}};
if(typeof globalThis.Buffer==='undefined')globalThis.Buffer={from:function(d,e){var u;if(e==='base64')u=b64(d);else if(typeof d==='string')u=new globalThis.TextEncoder().encode(d);else u=new Uint8Array(d);u.toString=function(enc){if(enc==='base64'){var r='';for(var i=0;i<u.length;i+=3){var a=u[i],b=i+1<u.length?u[i+1]:0,c=i+2<u.length?u[i+2]:0;r+=C[a>>2]+C[((a&3)<<4)|(b>>4)]+(i+1<u.length?C[((b&15)<<2)|(c>>6)]:'=')+(i+2<u.length?C[c&63]:'=');}return r;}if(enc==='binary'||enc==='latin1'){var r2='';for(var j=0;j<u.length;j++)r2+=String.fromCharCode(u[j]);return r2;}return new globalThis.TextDecoder().decode(u);};return u;},isBuffer:function(x){return x instanceof Uint8Array;},alloc:function(n){return new Uint8Array(n);}};
if(typeof globalThis.atob==='undefined')globalThis.atob=function(s){var u=b64(s),r='';for(var i=0;i<u.length;i++)r+=String.fromCharCode(u[i]);return r;};
if(typeof globalThis.btoa==='undefined')globalThis.btoa=function(s){s=String(s);var u=new Uint8Array(s.length);for(var i=0;i<s.length;i++)u[i]=s.charCodeAt(i)&255;var r='';for(var i=0;i<u.length;i+=3){var a=u[i],b=i+1<u.length?u[i+1]:0,c=i+2<u.length?u[i+2]:0;r+=C[a>>2]+C[((a&3)<<4)|(b>>4)]+(i+1<u.length?C[((b&15)<<2)|(c>>6)]:'=')+(i+2<u.length?C[c&63]:'=');}return r;};
if(typeof globalThis.process==='undefined')globalThis.process={env:{},argv:[],platform:'',version:'v0',versions:{},cwd:function(){return '/';},nextTick:function(f){Promise.resolve().then(f);},stdout:{write:function(){}},stderr:{write:function(){}}};
if(typeof globalThis.crypto==='undefined')globalThis.crypto={subtle:{},getRandomValues:function(a){for(var i=0;i<a.length;i++)a[i]=(Math.imul(i+1,2654435761)>>>0)&255;return a;}};
if(typeof globalThis.URL==='undefined')globalThis.URL=class{constructor(u){this.href=String(u);var h=this.href;var q=h.indexOf('?');this.search=q>=0?h.slice(q):'';var pathPart=q>=0?h.slice(0,q):h;var si=pathPart.indexOf('://');var rest=si>=0?pathPart.slice(si+3):pathPart;var sl=rest.indexOf('/');this.host=sl>=0?rest.slice(0,sl):rest;this.pathname=sl>=0?rest.slice(sl):'/';this.searchParams={get:function(){return null;},has:function(){return false;}};}};
globalThis.require=function(n){
if(n==='path')return {join:function(){return Array.prototype.join.call(arguments,'/');},resolve:function(){return '/'+Array.prototype.join.call(arguments,'/');},dirname:function(p){p=String(p);var i=p.lastIndexOf('/');return i>0?p.slice(0,i):'/';},basename:function(p){p=String(p);return p.slice(p.lastIndexOf('/')+1);},extname:function(p){p=String(p);var i=p.lastIndexOf('.');return i>=0?p.slice(i):'';},sep:'/'};
if(n==='url')return {pathToFileURL:function(p){return {href:'file://'+p};},fileURLToPath:function(u){u=String(u);return u.indexOf('file://')===0?u.slice(7):u;},URL:globalThis.URL};
if(n==='http')return {createServer:function(){throw new Error('no http server on device');},STATUS_CODES:{},METHODS:['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS']};
if(n==='canvas')throw new Error('canvas not needed');
throw new Error('require('+n+') not available on the mobile runtime');
};
class Headers{constructor(i){this._m={};if(i){if(typeof i.forEach==='function')i.forEach((v,k)=>this.set(k,v));else for(var k in i)this.set(k,i[k]);}}get(k){var v=this._m[String(k).toLowerCase()];return v===undefined?null:v;}set(k,v){this._m[String(k).toLowerCase()]=String(v);}has(k){return String(k).toLowerCase() in this._m;}append(k,v){this.set(k,v);}delete(k){delete this._m[String(k).toLowerCase()];}forEach(f){for(var k in this._m)f(this._m[k],k);}entries(){return Object.entries(this._m);}[Symbol.iterator](){return Object.entries(this._m)[Symbol.iterator]();}}
class Request{constructor(u,o){o=o||{};this.url=String(u);this.method=(o.method||'GET').toUpperCase();this.headers=new Headers(o.headers);this._b=o.body;}async text(){return this._b==null?'':String(this._b);}async json(){return JSON.parse(await this.text());}async arrayBuffer(){return new TextEncoder().encode(await this.text()).buffer;}clone(){return this;}}
class Response{constructor(b,o){o=o||{};this._b=b==null?'':b;this.status=o.status||200;this.statusText=o.statusText||'';this.headers=new Headers(o.headers);this.ok=this.status>=200&&this.status<400;}async text(){return typeof this._b==='string'?this._b:new TextDecoder().decode(this._b);}async json(){return JSON.parse(await this.text());}}
globalThis.Headers=Headers;globalThis.Request=Request;globalThis.Response=Response;
globalThis.fetch=globalThis.fetch||function(){return Promise.reject(new Error('no network in mobile runtime'));};
})();
`

const FS_SHIM = `import {VFS} from './vfs.mjs'
function n(p){p=String(p);var i=p.lastIndexOf('/apex-manifest');if(i<0)i=p.lastIndexOf('/locales');return i>=0?p.slice(i):p}
export const readFileSync=function(p){var k=n(p);if(k in VFS)return VFS[k];var e=new Error('ENOENT '+k);e.code='ENOENT';throw e}
export const existsSync=function(p){return n(p) in VFS}
export const statSync=function(p){return {isFile:function(){return n(p) in VFS},isDirectory:function(){return false}}}
export const readdirSync=function(){return []}
export default {readFileSync,existsSync,statSync,readdirSync}
`

const NODE_BUILTINS = [
  'assert',
  'buffer',
  'child_process',
  'crypto',
  'events',
  'http',
  'https',
  'net',
  'os',
  'path',
  'stream',
  'string_decoder',
  'tls',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'worker_threads',
  'zlib',
  'module',
  'perf_hooks',
]

// A route/module needs on-device capabilities we can't run on a bare engine: the DB layer
// (@apex-stack/data / @libsql → device WASM driver) or sessions (crypto.subtle).
function needsDeviceDriver(src: string): boolean {
  return /@apex-stack\/data|@libsql|useSession|sessionAuth|\blogin\(|\blogout\(|getSession/.test(
    src,
  )
}

export interface BuildMobileResult {
  bundlePath: string
  sizeKB: number
  routes: number
  api: number
  /** Server modules excluded from the on-engine bundle (need device crypto/DB). */
  deviceModules: string[]
}

/**
 * Bundle a `apex build --server` output dir into ONE self-contained `mobile/server.mjs` that
 * runs Apex's SSR + API pipeline on a bare JS engine (Hermes/QuickJS) — static module registry
 * (no dynamic import), a VFS over the manifest + locales, and the runtime shim baked in as a
 * banner. Load it in a WebView/RN shell and call `APEX.run(request)`. Routes needing on-device
 * drivers (DB/sessions) are detected and reported.
 */
export async function buildMobile(dir: string): Promise<BuildMobileResult> {
  // esbuild ships with Vite — resolve it via Vite's location so it need not be a direct dep.
  const require = createRequire(import.meta.resolve('vite'))
  const esbuild = require('esbuild') as {
    build: (opts: Record<string, unknown>) => Promise<unknown>
  }

  const manifest = JSON.parse(readFileSync(join(dir, 'apex-manifest.json'), 'utf8')) as ProdManifest
  const serverDir = join(dir, 'server')
  const readSrc = (f: string) => {
    try {
      return readFileSync(join(serverDir, f), 'utf8')
    } catch {
      return ''
    }
  }
  const allServer = readdirSync(serverDir).filter((f) => f.endsWith('.mjs'))
  const deviceModules = allServer.filter((f) => needsDeviceDriver(readSrc(f)))
  const included = allServer.filter((f) => !deviceModules.includes(f))
  const apiKeep = manifest.api.filter((a) => included.includes(a.serverFile))
  const routesKeep = manifest.routes.filter((r) => included.includes(r.serverFile))

  const gen = join(dir, 'mobile', '_gen')
  mkdirSync(gen, { recursive: true })

  const vfs: Record<string, string> = {
    '/apex-manifest.json': JSON.stringify({
      ...manifest,
      api: apiKeep,
      routes: routesKeep,
      middleware: [],
      auth: undefined,
    }),
  }
  for (const loc of manifest.i18n?.locales ?? []) {
    const p = join(dir, 'locales', `${loc}.json`)
    if (existsSync(p)) vfs[`/locales/${loc}.json`] = readFileSync(p, 'utf8')
  }
  writeFileSync(join(gen, 'vfs.mjs'), `export const VFS=${JSON.stringify(vfs)}\n`)
  writeFileSync(join(gen, 'fs.mjs'), FS_SHIM)

  const imports = included
    .map((f, i) => `import * as m${i} from ${JSON.stringify(join(serverDir, f))}`)
    .join('\n')
  const reg = included.map((f, i) => `  ${JSON.stringify(f)}: m${i},`).join('\n')
  writeFileSync(
    join(gen, 'entry.mjs'),
    `${imports}
import { createProdWebHandler } from '@apex-stack/core/server'
const registry = {
${reg}
}
let _h
async function handler() { return (_h ??= await createProdWebHandler({ dir: '/', loadModule: async (f) => registry[f] })) }
// APEX.run(pathOrRequest) → { status, headers, body }. Drive it from the native shell.
export async function run(input) {
  const req = typeof input === 'string' ? new Request('http://localhost' + (input || '/')) : input
  const res = await (await handler())(req)
  const headers = {}
  res.headers.forEach((v, k) => { headers[k] = v })
  return { status: res.status, headers, body: await res.text() }
}
`,
  )

  const out = join(dir, 'mobile', 'server.mjs')
  await esbuild.build({
    entryPoints: [join(gen, 'entry.mjs')],
    bundle: true,
    format: 'iife',
    globalName: 'APEX',
    platform: 'neutral',
    mainFields: ['module', 'browser', 'main'],
    conditions: ['import', 'module', 'browser', 'default'],
    alias: { 'node:fs': join(gen, 'fs.mjs'), fs: join(gen, 'fs.mjs') },
    external: ['node:*', ...NODE_BUILTINS, '@libsql/client'],
    banner: { js: SHIM },
    outfile: out,
    logLevel: 'error',
  })

  return {
    bundlePath: out,
    sizeKB: Math.round(readFileSync(out, 'utf8').length / 1024),
    routes: routesKeep.length,
    api: apiKeep.length,
    deviceModules,
  }
}
