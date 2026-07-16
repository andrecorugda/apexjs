import { getQuickJS } from 'quickjs-emscripten'
import { readFileSync } from 'node:fs'
const bundle = readFileSync('app.bundle.js','utf8')
const PRELUDE = readFileSync('prelude.gen.js','utf8')
async function render(path){
  const QuickJS = await getQuickJS(); const vm = QuickJS.newContext()
  try {
    for (const code of [PRELUDE, bundle]) { const r=vm.evalCode(code); if(r.error){const e=vm.dump(r.error);r.error.dispose();return {err:e}} r.value.dispose() }
    const call = vm.evalCode(`APEX.run(${JSON.stringify(path)})`); if(call.error){const e=vm.dump(call.error);call.error.dispose();return {err:e}}
    const p = vm.resolvePromise(call.value); call.value.dispose(); vm.runtime.executePendingJobs()
    const s = await p; if(s.error){const e=vm.dump(s.error);s.error.dispose();return {err:e}}
    const out = vm.dump(s.value); s.value.dispose(); return out
  } finally { vm.dispose() }
}
const page = await render('/')
console.log('PAGE  GET /            →', page.err ? 'ERR '+JSON.stringify(page.err) : `${page.status} ${page.contentType} ${page.body.length}b · realHTML=${/<!DOCTYPE[\s\S]*<main/i.test(page.body)}`)
const api = await render('/api/ping?name=QuickJS')
console.log('API   GET /api/ping    →', api.err ? 'ERR '+JSON.stringify(api.err) : `${api.status} ${api.contentType} · body=${api.body}`)
