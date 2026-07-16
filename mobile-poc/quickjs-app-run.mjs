import { getQuickJS } from 'quickjs-emscripten'
import { readFileSync } from 'node:fs'
const bundle = readFileSync('app.bundle.js', 'utf8')
const PRELUDE = `
globalThis.console = globalThis.console || { log(){}, error(){}, warn(){}, info(){}, debug(){} };
globalThis.require = function(n){
  if (n==='path') return { join(){return Array.prototype.join.call(arguments,'/').replace(/\\/+/g,'/')}, resolve(){return '/'+Array.prototype.join.call(arguments,'/').replace(/^\\/+/,'')}, dirname(p){return String(p).replace(/\\/[^/]*$/,'')||'/'}, basename(p){return String(p).replace(/.*\\//,'')}, extname(p){var m=/\\.[^.]*$/.exec(p);return m?m[0]:''}, sep:'/' };
  if (n==='url') return { pathToFileURL(p){return {href:'file://'+p}}, fileURLToPath(u){return String(u).replace(/^file:\\/\\//,'')}, URL: globalThis.URL };
  if (n==='http') return { createServer(){throw new Error('no http server on device')}, STATUS_CODES:{200:'OK',404:'Not Found',500:'Server Error'}, METHODS:['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS'] };
  if (n==='canvas') throw new Error('canvas: not needed');
  throw new Error('require('+n+') not shimmed');
};
// Minimal WHATWG fetch types (a bare engine lacks them; on-device the WebView/RN provides them).
class Headers { constructor(i){this._m={}; if(i){ if(typeof i.forEach==='function') i.forEach((v,k)=>this.set(k,v)); else for(var k in i) this.set(k,i[k]); } } get(k){return this._m[String(k).toLowerCase()] ?? null} set(k,v){this._m[String(k).toLowerCase()]=String(v)} has(k){return String(k).toLowerCase() in this._m} append(k,v){this.set(k,v)} delete(k){delete this._m[String(k).toLowerCase()]} forEach(f){for(var k in this._m)f(this._m[k],k)} entries(){return Object.entries(this._m)} [Symbol.iterator](){return Object.entries(this._m)[Symbol.iterator]()} }
class Request { constructor(u,o){o=o||{}; this.url=String(u); this.method=(o.method||'GET').toUpperCase(); this.headers=new Headers(o.headers); this._b=o.body} async text(){return this._b==null?'':String(this._b)} async json(){return JSON.parse(await this.text())} async arrayBuffer(){return new TextEncoder().encode(await this.text()).buffer} clone(){return this} }
class Response { constructor(b,o){o=o||{}; this._b=b==null?'':b; this.status=o.status||200; this.statusText=o.statusText||''; this.headers=new Headers(o.headers); this.ok=this.status>=200&&this.status<400} async text(){return typeof this._b==='string'?this._b:new TextDecoder().decode(this._b)} async json(){return JSON.parse(await this.text())} }
globalThis.Headers=Headers; globalThis.Request=Request; globalThis.Response=Response;
globalThis.fetch = globalThis.fetch || function(){ return Promise.reject(new Error('no network in PoC')) };
`
const QuickJS = await getQuickJS()
const vm = QuickJS.newContext()
try {
  let r = vm.evalCode(PRELUDE); if (r.error){console.log('PRELUDE ERROR:',vm.dump(r.error));r.error.dispose();process.exit(0)} r.value.dispose()
  r = vm.evalCode(bundle); if (r.error){console.log('LOAD ERROR:',vm.dump(r.error));r.error.dispose();process.exit(0)} r.value.dispose()
  const call = vm.evalCode(`APEX.run(globalThis.__P||'/')`); if (call.error){console.log('CALL ERROR:',vm.dump(call.error));call.error.dispose();process.exit(0)}
  const p = vm.resolvePromise(call.value); call.value.dispose()
  vm.runtime.executePendingJobs()
  const settled = await p
  if (settled.error){console.log('RENDER ERROR:',vm.dump(settled.error));settled.error.dispose()}
  else { const out = vm.dump(settled.value); settled.value.dispose(); console.log('\n=== FULL SHOWCASE ROUTE "/" RENDERED UNDER QUICKJS ===\nstatus:',out.status,'| html:',out.html.length,'bytes'); console.log('real SSR content?', /<!DOCTYPE|<main|Welcome|Showcase|Recent|Apex/i.test(out.html)); console.log('--- first 260 ---\n'+out.html.slice(0,260)) }
} catch(e){ console.log('HOST EXCEPTION:', e.message) } finally { vm.dispose() }
