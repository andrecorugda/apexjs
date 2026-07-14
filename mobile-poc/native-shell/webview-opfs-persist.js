// Persistence — Approach B (alternative to the native file bridge): store the DB snapshot in the
// WebView's Origin Private File System (OPFS), which both Chromium (Android WebView) and WKWebView
// (iOS) support. Runs in the WEBVIEW page context, not the engine.
//
// The DB lives in the engine, so the WebView still brokers bytes over the native bridge:
//   • at launch, read the snapshot from OPFS and hand it to the engine before it serves a request
//     (the shell must expose __ApexNative.setSnapshot(b64) → evaluates
//      `globalThis.__APEX_DB_SNAPSHOT__ = b64` in the engine BEFORE server.mjs boots);
//   • after a mutation, pull the current bytes (__ApexNative.getSnapshot() → engine
//     __APEX_DB_EXPORT__()) and write them back to OPFS.
//
// This is why Approach A (native file bridge) is simpler for the SSR-on-engine model: the engine
// already has the bytes, so writing a file next to it avoids this WebView round-trip entirely.
// B only wins if the DB is moved INTO the WebView (client-side).

const DB_FILE = 'apex-db.sqlite.b64'

async function opfsHandle(create) {
  const root = await navigator.storage.getDirectory()
  return root.getFileHandle(DB_FILE, { create })
}

/** Read the persisted snapshot (base64) from OPFS, or null if none. */
export async function loadSnapshot() {
  try {
    const file = await (await opfsHandle(false)).getFile()
    const text = await file.text()
    return text || null
  } catch {
    return null // not found → first launch
  }
}

/** Write the snapshot (base64) to OPFS (atomic via createWritable). */
export async function saveSnapshot(base64) {
  if (!base64) return
  const writable = await (await opfsHandle(true)).createWritable()
  await writable.write(base64)
  await writable.close()
}

/**
 * Wire persistence to the engine via the native bridge. Call once at startup, before the first
 * page render. Requires the shell to expose __ApexNative.setSnapshot / getSnapshot.
 */
export async function initOpfsPersistence(native = window.__ApexNative) {
  const saved = await loadSnapshot()
  if (saved && native?.setSnapshot) native.setSnapshot(saved)
  // After each mutation, the fetch patch can call this to persist the new state.
  return {
    async persist() {
      const bytes = native?.getSnapshot ? native.getSnapshot() : ''
      if (bytes) await saveSnapshot(bytes)
    },
  }
}
