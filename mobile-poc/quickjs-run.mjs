import { getQuickJS } from 'quickjs-emscripten'
import { readFileSync } from 'node:fs'

const bundle = readFileSync('render.bundle.js', 'utf8')
const PRELUDE = `
globalThis.console = globalThis.console || { log(){}, error(){}, warn(){}, info(){} };
globalThis.require = function(n){
  if (n==='path') return { join(){return Array.prototype.join.call(arguments,'/').replace(/\\/+/g,'/')}, resolve(){return Array.prototype.join.call(arguments,'/')}, dirname(p){return String(p).replace(/\\/[^/]*$/,'')}, basename(p){return String(p).replace(/.*\\//,'')}, extname(p){var m=/\\.[^.]*$/.exec(p);return m?m[0]:''}, sep:'/' };
  if (n==='url') return { pathToFileURL(p){return {href:'file://'+p}}, fileURLToPath(u){return String(u).replace(/^file:\\/\\//,'')}, URL: globalThis.URL };
  if (n==='fs') return { readFileSync(){return ''}, existsSync(){return false}, statSync(){return {isFile(){return false}}}, readdirSync(){return []} };
  if (n==='canvas') throw new Error('canvas: not needed for text SSR');
  throw new Error('require('+n+') not shimmed');
};
`

const QuickJS = await getQuickJS()
const vm = QuickJS.newContext()
try {
  console.log('QuickJS globals present?', vm.evalCode(`JSON.stringify({URL:typeof URL,TextEncoder:typeof TextEncoder,TextDecoder:typeof TextDecoder,Promise:typeof Promise,Map:typeof Map,Proxy:typeof Proxy,WeakMap:typeof WeakMap})`) && (()=>{const r=vm.evalCode(`JSON.stringify({URL:typeof URL,TextEncoder:typeof TextEncoder,TextDecoder:typeof TextDecoder,Promise:typeof Promise,Map:typeof Map,Proxy:typeof Proxy,WeakMap:typeof WeakMap})`);return vm.getString(vm.unwrapResult(r))})())

  const load = vm.evalCode(PRELUDE + '\n' + bundle)
  if (load.error) { console.log('LOAD ERROR:', vm.dump(load.error)); load.error.dispose(); process.exit(0) }
  load.value.dispose()

  const call = vm.evalCode(`APEX.run()`)
  if (call.error) { console.log('CALL ERROR:', vm.dump(call.error)); call.error.dispose(); process.exit(0) }
  const promise = vm.resolvePromise(call.value)
  call.value.dispose()
  vm.runtime.executePendingJobs()
  const settled = await promise
  if (settled.error) { console.log('RENDER ERROR:', vm.dump(settled.error)); settled.error.dispose() }
  else { const html = vm.getString(settled.value); settled.value.dispose(); console.log('\n=== HTML RENDERED UNDER QUICKJS ===\n' + html.slice(0,600)); console.log('\n--- proof:', /alpha[\s\S]*beta[\s\S]*gamma/.test(html) && /bare JS engine/.test(html) ? 'x-for + x-text rendered ON QUICKJS ✓' : 'partial') }
} catch (e) { console.log('HOST EXCEPTION:', e.message) } finally { vm.dispose() }
