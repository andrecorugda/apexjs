import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import type { ProdManifest } from './server.js'

// Self-contained runtime shim (esbuild banner): pure-JS globals a bare on-device engine
// (Hermes/QuickJS) lacks. Regex-free so it embeds cleanly. On a real device the WebView/RN
// runtime already provides most of these — this is the belt-and-suspenders baseline.
const SHIM = `
globalThis.console=globalThis.console||{log(){},error(){},warn(){},info(){},debug(){}};
globalThis.__APEX_DEVICE__=true;
(function(){var C='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function b64(s){s=String(s);var o=[],bits=0,val=0;for(var i=0;i<s.length;i++){var c=s.charAt(i);if(c==='=')break;var idx=C.indexOf(c);if(idx<0)continue;val=(val<<6)|idx;bits+=6;if(bits>=8){bits-=8;o.push((val>>bits)&255);}}return new Uint8Array(o);}
if(typeof globalThis.TextEncoder==='undefined')globalThis.TextEncoder=class{encode(s){s=String(s);var b=[];for(var i=0;i<s.length;i++){var c=s.charCodeAt(i);if(c>=0xd800&&c<=0xdbff&&i+1<s.length){var c2=s.charCodeAt(i+1);if(c2>=0xdc00&&c2<=0xdfff){c=0x10000+((c-0xd800)<<10)+(c2-0xdc00);i++;}}if(c<128)b.push(c);else if(c<2048)b.push(192|(c>>6),128|(c&63));else if(c<65536)b.push(224|(c>>12),128|((c>>6)&63),128|(c&63));else b.push(240|(c>>18),128|((c>>12)&63),128|((c>>6)&63),128|(c&63));}return new Uint8Array(b);}};
if(typeof globalThis.TextDecoder==='undefined')globalThis.TextDecoder=class{decode(u){var a=u instanceof Uint8Array?u:new Uint8Array(u&&u.buffer?u.buffer:u||[]),s='';for(var i=0;i<a.length;){var c=a[i++];if(c>=240){c=((c&7)<<18)|((a[i++]&63)<<12)|((a[i++]&63)<<6)|(a[i++]&63);}else if(c>=224){c=((c&15)<<12)|((a[i++]&63)<<6)|(a[i++]&63);}else if(c>=192){c=((c&31)<<6)|(a[i++]&63);}if(c>1114111||(c>=55296&&c<=57343)||c<0)c=65533;s+=String.fromCodePoint(c);}return s;}};
if(typeof globalThis.Buffer==='undefined')globalThis.Buffer={from:function(d,e){var u;if(e==='base64')u=b64(d);else if(typeof d==='string')u=new globalThis.TextEncoder().encode(d);else u=new Uint8Array(d);u.toString=function(enc){if(enc==='base64'){var r='';for(var i=0;i<u.length;i+=3){var a=u[i],b=i+1<u.length?u[i+1]:0,c=i+2<u.length?u[i+2]:0;r+=C[a>>2]+C[((a&3)<<4)|(b>>4)]+(i+1<u.length?C[((b&15)<<2)|(c>>6)]:'=')+(i+2<u.length?C[c&63]:'=');}return r;}if(enc==='binary'||enc==='latin1'){var r2='';for(var j=0;j<u.length;j++)r2+=String.fromCharCode(u[j]);return r2;}return new globalThis.TextDecoder().decode(u);};return u;},isBuffer:function(x){return x instanceof Uint8Array;},alloc:function(n){return new Uint8Array(n);}};
if(typeof globalThis.atob==='undefined')globalThis.atob=function(s){var u=b64(s),r='';for(var i=0;i<u.length;i++)r+=String.fromCharCode(u[i]);return r;};
if(typeof globalThis.btoa==='undefined')globalThis.btoa=function(s){s=String(s);var u=new Uint8Array(s.length);for(var i=0;i<s.length;i++)u[i]=s.charCodeAt(i)&255;var r='';for(var i=0;i<u.length;i+=3){var a=u[i],b=i+1<u.length?u[i+1]:0,c=i+2<u.length?u[i+2]:0;r+=C[a>>2]+C[((a&3)<<4)|(b>>4)]+(i+1<u.length?C[((b&15)<<2)|(c>>6)]:'=')+(i+2<u.length?C[c&63]:'=');}return r;};
if(typeof globalThis.process==='undefined')globalThis.process={env:{},argv:[],platform:'',version:'v0',versions:{},cwd:function(){return '/';},nextTick:function(f){Promise.resolve().then(f);},stdout:{write:function(){}},stderr:{write:function(){}}};
if(typeof globalThis.crypto==='undefined')globalThis.crypto={subtle:{},getRandomValues:function(a){for(var i=0;i<a.length;i++)a[i]=(Math.imul(i+1,2654435761)>>>0)&255;return a;}};
if(typeof globalThis.URLSearchParams==='undefined')globalThis.URLSearchParams=class{constructor(init){this._p=[];var self=this;if(typeof init==='string'){var s=init.charAt(0)==='?'?init.slice(1):init;if(s)s.split('&').forEach(function(pair){if(!pair)return;var i=pair.indexOf('=');var k=i<0?pair:pair.slice(0,i);var v=i<0?'':pair.slice(i+1);self._p.push([decodeURIComponent(k.replace(/\\+/g,' ')),decodeURIComponent(v.replace(/\\+/g,' '))]);});}else if(init&&typeof init.forEach==='function'){init.forEach(function(v,k){self._p.push([k,String(v)]);});}else if(init){for(var k in init)self._p.push([k,String(init[k])]);}}get(k){for(var i=0;i<this._p.length;i++)if(this._p[i][0]===k)return this._p[i][1];return null;}getAll(k){return this._p.filter(function(e){return e[0]===k;}).map(function(e){return e[1];});}has(k){return this.get(k)!==null;}set(k,v){this.delete(k);this._p.push([k,String(v)]);}append(k,v){this._p.push([k,String(v)]);}delete(k){this._p=this._p.filter(function(e){return e[0]!==k;});}forEach(f){this._p.forEach(function(e){f(e[1],e[0]);});}keys(){return this._p.map(function(e){return e[0];})[Symbol.iterator]();}values(){return this._p.map(function(e){return e[1];})[Symbol.iterator]();}entries(){return this._p.slice()[Symbol.iterator]();}toString(){return this._p.map(function(e){return encodeURIComponent(e[0])+'='+encodeURIComponent(e[1]);}).join('&');}[Symbol.iterator](){return this.entries();}};
if(typeof globalThis.FormData==='undefined')globalThis.FormData=class{constructor(){this._d=[];}append(k,v){this._d.push([k,v]);}get(k){for(var i=0;i<this._d.length;i++)if(this._d[i][0]===k)return this._d[i][1];return null;}getAll(k){return this._d.filter(function(e){return e[0]===k;}).map(function(e){return e[1];});}has(k){return this.get(k)!==null;}set(k,v){this.delete(k);this._d.push([k,v]);}delete(k){this._d=this._d.filter(function(e){return e[0]!==k;});}forEach(f){this._d.forEach(function(e){f(e[1],e[0]);});}entries(){return this._d.slice()[Symbol.iterator]();}[Symbol.iterator](){return this.entries();}};
if(typeof globalThis.URL==='undefined')globalThis.URL=class{constructor(u,base){u=String(u);if(base!==undefined&&u.indexOf('://')<0){base=String(base);var bsi=base.indexOf('://');var bproto=bsi>=0?base.slice(0,bsi+3):'https://';var brest=bsi>=0?base.slice(bsi+3):base;var bsl=brest.indexOf('/');var bhost=bsl>=0?brest.slice(0,bsl):brest;u=bproto+bhost+(u.charAt(0)==='/'?u:'/'+u);}this.href=u;var si=u.indexOf('://');this.protocol=si>=0?u.slice(0,u.indexOf(':')+1):'https:';var afterProto=si>=0?u.slice(si+3):u;var q=afterProto.indexOf('?');this.search=q>=0?afterProto.slice(q):'';var hostAndPath=q>=0?afterProto.slice(0,q):afterProto;var hsh=hostAndPath.indexOf('#');if(hsh>=0)hostAndPath=hostAndPath.slice(0,hsh);var sl=hostAndPath.indexOf('/');this.host=sl>=0?hostAndPath.slice(0,sl):hostAndPath;this.hostname=this.host.split(':')[0];this.port=this.host.indexOf(':')>=0?this.host.split(':')[1]:'';this.pathname=sl>=0?hostAndPath.slice(sl):'/';this.origin=this.protocol+'//'+this.host;this.searchParams=new globalThis.URLSearchParams(this.search);}toString(){return this.href;}};
globalThis.require=function(n){
if(n==='path')return {join:function(){return Array.prototype.join.call(arguments,'/');},resolve:function(){return '/'+Array.prototype.join.call(arguments,'/');},dirname:function(p){p=String(p);var i=p.lastIndexOf('/');return i>0?p.slice(0,i):'/';},basename:function(p){p=String(p);return p.slice(p.lastIndexOf('/')+1);},extname:function(p){p=String(p);var i=p.lastIndexOf('.');return i>=0?p.slice(i):'';},sep:'/'};
if(n==='url')return {pathToFileURL:function(p){return {href:'file://'+p};},fileURLToPath:function(u){u=String(u);return u.indexOf('file://')===0?u.slice(7):u;},URL:globalThis.URL};
if(n==='http')return {createServer:function(){throw new Error('no http server on device');},STATUS_CODES:{},METHODS:['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS']};
if(n==='canvas')throw new Error('canvas not needed');
throw new Error('require('+n+') not available on the mobile runtime');
};
class Headers{constructor(i){this._m={};var self=this;if(i){if(Array.isArray(i))i.forEach(function(p){self.append(p[0],p[1]);});else if(typeof i.forEach==='function')i.forEach(function(v,k){self.set(k,v);});else for(var k in i)this.set(k,i[k]);}}get(k){var v=this._m[String(k).toLowerCase()];return v===undefined?null:v;}set(k,v){this._m[String(k).toLowerCase()]=String(v);}has(k){return String(k).toLowerCase() in this._m;}append(k,v){var lk=String(k).toLowerCase();if(lk in this._m)this._m[lk]=this._m[lk]+', '+String(v);else this._m[lk]=String(v);}delete(k){delete this._m[String(k).toLowerCase()];}forEach(f){for(var k in this._m)f(this._m[k],k);}entries(){return Object.entries(this._m);}keys(){return Object.keys(this._m)[Symbol.iterator]();}[Symbol.iterator](){return Object.entries(this._m)[Symbol.iterator]();}}
class Request{constructor(u,o){o=o||{};this.url=String(u);this.method=(o.method||'GET').toUpperCase();this.headers=new Headers(o.headers);this._b=o.body;this.body=o.body==null?null:o.body;}async text(){return this._b==null?'':String(this._b);}async json(){return JSON.parse(await this.text());}async arrayBuffer(){return new TextEncoder().encode(await this.text()).buffer;}clone(){return this;}}
class Response{constructor(b,o){o=o||{};this._b=b==null?'':b;this.status=o.status||200;this.statusText=o.statusText||'';this.headers=new Headers(o.headers);this.ok=this.status>=200&&this.status<400;}async text(){return typeof this._b==='string'?this._b:new TextDecoder().decode(this._b);}async json(){return JSON.parse(await this.text());}}
globalThis.Headers=Headers;globalThis.Request=Request;globalThis.Response=Response;
globalThis.fetch=globalThis.fetch||function(){return Promise.reject(new Error('no network in mobile runtime'));};
// Timers: a bare engine has none. Client code (<script client>) can end up in the server
// bundle and reference them at eval — no-op so that never crashes SSR (the real timers fire
// on the client, in the WebView, which has them). See #53.
if(typeof globalThis.setTimeout==='undefined'){globalThis.setTimeout=function(){return 0;};globalThis.clearTimeout=function(){};globalThis.setInterval=function(){return 0;};globalThis.clearInterval=function(){};globalThis.queueMicrotask=globalThis.queueMicrotask||function(f){Promise.resolve().then(f);};}
// Inert DOM/BOM stubs. Defense-in-depth ONLY: the compiler already strips <script client>
// side-effect STATEMENTS from the SSR module (#53), but a client-only side-effectful
// declaration initializer (e.g. \`const t = document.title\`) is kept (rootData may need the
// symbol) and would eval here. These no-ops keep one stray line from bricking the whole app's
// boot; the real behavior still runs client-side in the WebView, which has the real globals.
if(typeof globalThis.document==='undefined'){var __n=function(){};var __cl={add:__n,remove:__n,toggle:__n,contains:function(){return false;}};var __el={setAttribute:__n,getAttribute:function(){return null;},removeAttribute:__n,appendChild:__n,removeChild:__n,insertBefore:__n,querySelector:function(){return null;},querySelectorAll:function(){return [];},addEventListener:__n,removeEventListener:__n,getAttributeNames:function(){return [];},classList:__cl,style:{setProperty:__n},dataset:{},focus:__n,blur:__n,click:__n,textContent:'',innerHTML:''};globalThis.document={documentElement:__el,body:__el,head:__el,createElement:function(){return __el;},createTextNode:function(){return __el;},createComment:function(){return __el;},querySelector:function(){return null;},querySelectorAll:function(){return [];},getElementById:function(){return null;},getElementsByTagName:function(){return [];},getElementsByClassName:function(){return [];},addEventListener:__n,removeEventListener:__n,cookie:'',title:'',readyState:'complete'};}
globalThis.navigator=globalThis.navigator||{userAgent:'ApexMobile',language:'en',languages:['en']};
if(typeof globalThis.localStorage==='undefined')globalThis.localStorage={getItem:function(){return null;},setItem:function(){},removeItem:function(){},clear:function(){},key:function(){return null;},length:0};
globalThis.sessionStorage=globalThis.sessionStorage||globalThis.localStorage;
if(typeof globalThis.location==='undefined')globalThis.location={href:'',pathname:'/',search:'',hash:'',host:'',hostname:'',protocol:'https:',origin:'',assign:function(){},replace:function(){},reload:function(){}};
if(typeof globalThis.window==='undefined'){globalThis.window=globalThis;globalThis.matchMedia=globalThis.matchMedia||function(){return {matches:false,media:'',addEventListener:function(){},removeEventListener:function(){},addListener:function(){},removeListener:function(){}};};globalThis.addEventListener=globalThis.addEventListener||function(){};globalThis.removeEventListener=globalThis.removeEventListener||function(){};globalThis.scrollTo=globalThis.scrollTo||function(){};globalThis.requestAnimationFrame=globalThis.requestAnimationFrame||function(f){return globalThis.setTimeout(f,0);};globalThis.cancelAnimationFrame=globalThis.cancelAnimationFrame||function(){};}
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

// `fs/promises` shim. sql.js's (dead-on-device) Node branch imports it, so esbuild must
// resolve it at build time; it's never called at runtime (the engine isn't Node).
const FSP_SHIM = `const nope=async function(){throw new Error('fs/promises not available on the mobile runtime')}
export const readFile=nope,writeFile=nope,readdir=nope,stat=nope,mkdir=nope
export default {readFile,writeFile,readdir,stat,mkdir}
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

// A module we still can't run on a bare engine offline: a NETWORK-only database/cache
// driver imported directly (postgres/mysql/redis) — there's no server to reach offline.
// DB via @apex-stack/data (libsql → on-device sql.js WASM) and sealed-cookie sessions
// (pure-JS HMAC, no crypto.subtle) now run on-device, so they are NOT flagged.
function needsDeviceDriver(src: string): boolean {
  return /\bfrom\s+['"](postgres|pg|mysql|mysql2|ioredis|redis)['"]/.test(src)
}

// Does any included server module use the data layer? Only then do we pay the ~900 KB
// to bundle the sql.js WASM (base64) into the app — DB-less apps stay lean.
function usesDataLayer(src: string): boolean {
  return /@apex-stack\/data|\bcreateDb\b/.test(src)
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
  // Sessions run on-device now, so keep middleware + auth (dropping only entries whose
  // module was excluded above).
  const middlewareKeep = (manifest.middleware ?? []).filter((m) => included.includes(m.serverFile))
  const authKeep =
    manifest.auth && included.includes(manifest.auth.serverFile) ? manifest.auth : undefined
  const usesDb = included.some((f) => usesDataLayer(readSrc(f)))

  const gen = join(dir, 'mobile', '_gen')
  mkdirSync(gen, { recursive: true })

  const vfs: Record<string, string> = {
    '/apex-manifest.json': JSON.stringify({
      ...manifest,
      api: apiKeep,
      routes: routesKeep,
      middleware: middlewareKeep,
      auth: authKeep,
    }),
  }
  for (const loc of manifest.i18n?.locales ?? []) {
    const p = join(dir, 'locales', `${loc}.json`)
    if (existsSync(p)) vfs[`/locales/${loc}.json`] = readFileSync(p, 'utf8')
  }
  writeFileSync(join(gen, 'vfs.mjs'), `export const VFS=${JSON.stringify(vfs)}\n`)
  writeFileSync(join(gen, 'fs.mjs'), FS_SHIM)
  writeFileSync(join(gen, 'fsp.mjs'), FSP_SHIM)

  // On-device DB (@apex-stack/data) uses sql.js's asm.js build — pure JS, no WASM (the sandboxed
  // V8 in androidx.javascriptengine can't compile WebAssembly). esbuild bundles it directly from
  // the dynamic import in the data layer; nothing to inject here. `usesDb` only informs the log.
  void usesDb

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
    alias: {
      'node:fs/promises': join(gen, 'fsp.mjs'),
      'fs/promises': join(gen, 'fsp.mjs'),
      'node:fs': join(gen, 'fs.mjs'),
      fs: join(gen, 'fs.mjs'),
    },
    external: ['node:*', ...NODE_BUILTINS, '@libsql/client'],
    banner: { js: SHIM },
    // Minify: the asm.js SQLite build is large; the engine loads server.mjs as one
    // evaluateJavaScript string, so keep it small. asm.js still runs correctly minified
    // (the bare engine executes it as ordinary JS, not via the "use asm" fast path).
    minify: true,
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
