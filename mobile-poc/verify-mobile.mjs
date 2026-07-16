import { getQuickJS } from 'quickjs-emscripten'
import { readFileSync } from 'node:fs'
const bundle = readFileSync('../examples/showcase/dist/mobile/server.mjs', 'utf8')  // self-contained (shim in banner)
async function hit(path){
  const vm = (await getQuickJS()).newContext()
  try {
    let r = vm.evalCode(bundle); if(r.error){const e=vm.dump(r.error);r.error.dispose();return{err:e}} r.value.dispose()
    const c = vm.evalCode(`APEX.run(${JSON.stringify(path)})`); if(c.error){const e=vm.dump(c.error);c.error.dispose();return{err:e}}
    const p = vm.resolvePromise(c.value); c.value.dispose(); vm.runtime.executePendingJobs()
    const s = await p; if(s.error){const e=vm.dump(s.error);s.error.dispose();return{err:e}}
    const o = vm.dump(s.value); s.value.dispose(); return o
  } finally { vm.dispose() }
}
for (const path of ['/', '/api/posts']) {
  const o = await hit(path)
  console.log(path.padEnd(22), '→', o.err ? 'ERR '+JSON.stringify(o.err) : `${o.status}  ${o.body.length}b  ${o.body.slice(0,60).replace(/\n/g,' ')}`)
}
