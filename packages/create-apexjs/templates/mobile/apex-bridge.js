// apex-bridge.js — the JS side of the native shell.
//
// Load order in the embedded engine (Hermes / JSC / QuickJS):
//   1) server.mjs   (from `apex build --mobile` — sets globalThis.APEX = { run })
//   2) this file
//
// The native interceptor (iOS WKURLSchemeHandler / Android shouldInterceptRequest) calls
// __apexHandle(jsonRequest) → Promise<jsonResponse>. String-in/string-out keeps the FFI
// trivial across every engine.
//
// jsonRequest  = { "url": "...", "method": "GET", "headers": {..}, "body": "..."|null }
// jsonResponse = { "status": 200, "headers": {"content-type": "text/html", ...}, "body": "..." }

globalThis.__apexHandle = async function (jsonRequest) {
  const { url, method, headers, body } = JSON.parse(jsonRequest)
  const req = new Request(url, { method: method || 'GET', headers: headers || {}, body })
  const res = await globalThis.APEX.run(req) // { status, headers, body }
  return JSON.stringify(res)
}

// Optional: a synchronous readiness flag the native side can poll before the first request.
globalThis.__apexReady = typeof globalThis.APEX?.run === 'function'
