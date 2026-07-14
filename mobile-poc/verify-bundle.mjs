// Verify a `apex build --mobile` bundle renders on a bare engine (no Node) — on any machine.
//   npm i -D quickjs-emscripten  &&  node verify-bundle.mjs [path/to/dist/mobile/server.mjs]
//
// Disposes every QuickJS handle so vm.dispose() is clean (the earlier doc snippet leaked the
// unwrapResult handles → "Assertion failed: list_empty(&rt->gc_obj_list)" at JS_FreeRuntime).
import { readFileSync } from 'node:fs'
import { getQuickJS } from 'quickjs-emscripten'

const file = process.argv[2] || 'dist/mobile/server.mjs'
const vm = (await getQuickJS()).newContext()
try {
  vm.unwrapResult(vm.evalCode(readFileSync(file, 'utf8'))).dispose()
  for (const path of ['/', '/api/posts']) {
    const promise = vm.unwrapResult(vm.evalCode(`APEX.run(${JSON.stringify(path)})`))
    const settled = vm.resolvePromise(promise)
    promise.dispose()
    vm.runtime.executePendingJobs()
    const handle = vm.unwrapResult(await settled)
    const out = vm.dump(handle)
    handle.dispose()
    console.log(
      path.padEnd(12),
      '→',
      out.status,
      `${out.body.length}b`,
      /<!DOCTYPE|^\[|^\{/.test(out.body) ? '✓' : '?',
    )
  }
} finally {
  vm.dispose() // clean now — all handles disposed above
}
