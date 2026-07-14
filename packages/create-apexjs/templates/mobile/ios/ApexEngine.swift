// ApexEngine.swift — iOS embedded JS engine for the Apex on-device server bundle.
//
// Mirrors android/ApexEngine.kt, but built on **JavaScriptCore** (`JSContext`) instead of
// androidx.javascriptengine.
//
// ── Why this diverges from Android ────────────────────────────────────────────────────────
//  • Android uses Google's androidx.javascriptengine — an OUT-OF-PROCESS, WebView-backed JS
//    sandbox. Connecting to it is asynchronous (`createConnectedInstanceAsync(...).await()`),
//    which is why the Kotlin factory is a `suspend fun`.
//  • iOS uses JavaScriptCore's `JSContext`, which is IN-PROCESS and synchronous to create and
//    evaluate. So this initializer is a plain (throwing) init — no async boot handshake needed.
//  • JSContext ALSO supports host callbacks (Swift closures exposed as JS functions + an
//    exception handler). Android's sandbox does not; that's the capability we exploit both here
//    (console/exception bridging) and in the scheme handler (reading POST bodies directly).
//
// Load order inside the context (identical contract to Android):
//   1) restore persisted DB snapshot into `globalThis.__APEX_DB_SNAPSHOT__` (if any),
//   2) evaluate `server.mjs`   (from `apex build --mobile` — an IIFE that sets globalThis.APEX),
//   3) evaluate `apex-bridge.js` (defines globalThis.__apexHandle(json) -> Promise<json>).
//
// JavaScriptCore is a system framework (`import JavaScriptCore`) — no external dependency, the
// iOS analogue of Android needing the javascriptengine + coroutines-guava artifacts.

import Foundation
import JavaScriptCore

final class ApexEngine {

  /// `JSContext` and every JSValue derived from it are NOT thread-safe, so all engine work is
  /// funnelled through one dedicated thread. That thread has a LARGE stack on purpose:
  /// JavaScriptCore ties its JS-recursion limit to the native stack, and a normal DispatchQueue
  /// worker's ~512 KB stack overflows heavy JS ("Maximum call stack size exceeded") — notably the
  /// asm.js SQLite. 16 MB is plenty and matches what a WKWebView's JS thread gets.
  private let worker: ApexEngineThread
  private let context: JSContext

  // MARK: - Boot

  /// Build the engine: create the JSContext, wire host globals JSCore lacks, restore the DB
  /// snapshot, then evaluate the server bundle + bridge. Synchronous (see file header for why
  /// this is not async like the Kotlin version). Throws if the bundle resources are missing.
  init(snapshot: String?, bundle: Bundle = .main) throws {
    self.worker = ApexEngineThread(stackSize: 16 * 1024 * 1024)

    // Read the bundle resources on the calling thread (plain file I/O).
    let serverJS = try ApexEngine.bundledSource(resource: "server", ext: "mjs", bundle: bundle)
    let bridgeJS = try ApexEngine.bundledSource(resource: "apex-bridge", ext: "js", bundle: bundle)

    // Everything that touches the context happens on the high-stack worker thread.
    let created: JSContext? = worker.sync {
      guard let context = JSContext() else { return nil }

      // Surface JS errors instead of failing silently. JSCore has no default exception handler.
      context.exceptionHandler = { _, exception in
        let message = exception?.toString() ?? "unknown"
        let stack = exception?.objectForKeyedSubscript("stack")?.toString() ?? ""
        print("[ApexJS] uncaught JS exception: \(message)\n\(stack)")
      }

      // `console`: the mobile SHIM installs a NO-OP console via `globalThis.console || {…}`; JSCore
      // has none, so we set a REAL one first and the shim keeps ours. The only extra global we add
      // — everything else (Buffer/TextEncoder/URL/Request/Response/Headers/fetch/timers) is in the
      // bundle's own shim, so we do NOT re-shim it (see NATIVE_SHELL.md).
      ApexEngine.installConsole(into: context)

      // 1) Restore a persisted DB snapshot (base64 of a prior db.export()) BEFORE the bundle boots.
      if let snapshot, !snapshot.isEmpty {
        context.setObject(snapshot, forKeyedSubscript: "__APEX_DB_SNAPSHOT__" as NSString)
      }

      // 2) + 3) Evaluate the self-contained server bundle (sets globalThis.APEX) then the bridge.
      context.evaluateScript(serverJS, withSourceURL: URL(string: "apex-internal://server.mjs"))
      context.evaluateScript(bridgeJS, withSourceURL: URL(string: "apex-internal://apex-bridge.js"))

      let ready = context.evaluateScript("typeof globalThis.__apexHandle === 'function'")?.toBool() ?? false
      if !ready { print("[ApexJS] WARNING: __apexHandle not defined after loading bundle") }
      return context
    }

    guard let context = created else { throw ApexEngineError.contextCreationFailed }
    self.context = context
  }

  // MARK: - Request handling

  /// Handle one request. `requestJSON` = {"url","method","headers","body"}.
  /// Returns {"status","headers","body"} as JSON.
  ///
  /// `__apexHandle` returns a JS `Promise<string>`. JavaScriptCore has no built-in async/await
  /// bridge, so we resolve the promise by attaching `.then(onFulfilled, onRejected)` where both
  /// handlers are Swift closures exposed as JS functions — the JSContext host-callback capability
  /// Android's sandbox lacks. The continuation is resumed exactly once.
  func handle(_ requestJSON: String) async -> String {
    await withCheckedContinuation { (continuation: CheckedContinuation<String, Never>) in
      worker.async { [context] in
        guard
          let handleFn = context.objectForKeyedSubscript("__apexHandle"),
          !handleFn.isUndefined, !handleFn.isNull
        else {
          continuation.resume(returning: ApexEngine.errorResponseJSON("__apexHandle is not defined"))
          return
        }

        guard let promise = handleFn.call(withArguments: [requestJSON]), promise.isObject else {
          continuation.resume(returning: ApexEngine.errorResponseJSON("__apexHandle did not return a Promise"))
          return
        }

        // Guard single resumption. Safe as a plain var: every access happens on the worker thread
        // (the .then callbacks fire during microtask drain on that same thread).
        var resumed = false
        let finish: (String) -> Void = { value in
          if resumed { return }
          resumed = true
          continuation.resume(returning: value)
        }

        let onFulfilled: @convention(block) (JSValue?) -> Void = { value in
          finish(value?.toString() ?? "")
        }
        let onRejected: @convention(block) (JSValue?) -> Void = { error in
          finish(ApexEngine.errorResponseJSON(error?.toString() ?? "promise rejected"))
        }

        // Attach both handlers in one `.then(f, r)` call. JavaScriptCore drains the promise
        // microtask queue at the end of this JS turn; our pipeline is fully synchronous in-memory
        // (no real I/O), so the promise settles and the callback runs before invokeMethod returns.
        promise.invokeMethod(
          "then",
          withArguments: [
            JSValue(object: onFulfilled, in: context) as Any,
            JSValue(object: onRejected, in: context) as Any,
          ]
        )
      }
    }
  }

  // MARK: - Persistence seam

  /// Current DB bytes (base64) for persistence, or "" if the app has no on-device DB.
  /// Mirrors `ApexEngine.snapshot()` on Android — evaluated synchronously (the export function is
  /// synchronous; if it were a Promise this would return "[object Promise]", same as Android).
  func snapshot() -> String {
    worker.sync {
      let result = context.evaluateScript(
        "(typeof __APEX_DB_EXPORT__==='function')?__APEX_DB_EXPORT__():''"
      )
      return result?.toString() ?? ""
    }
  }

  // MARK: - Helpers

  private static func installConsole(into context: JSContext) {
    // Uses JSContext.currentArguments() so variadic console.log(a, b, c) is captured, not just
    // the first arg. A debug aid only; production can leave the shim's no-op console in place.
    let log: @convention(block) () -> Void = {
      let args = (JSContext.currentArguments() as? [JSValue]) ?? []
      let line = args.map { $0.toString() ?? "" }.joined(separator: " ")
      print("[ApexJS] " + line)
    }
    guard let console = JSValue(newObjectIn: context) else { return }
    for method in ["log", "error", "warn", "info", "debug"] {
      console.setObject(log, forKeyedSubscript: method as NSString)
    }
    context.setObject(console, forKeyedSubscript: "console" as NSString)
  }

  /// Read a bundled JS resource from the app bundle Resources as UTF-8 text.
  private static func bundledSource(resource: String, ext: String, bundle: Bundle) throws -> String {
    guard let url = bundle.url(forResource: resource, withExtension: ext) else {
      throw ApexEngineError.missingResource("\(resource).\(ext)")
    }
    return try String(contentsOf: url, encoding: .utf8)
  }

  /// A well-formed {status,headers,body} JSON string so the scheme handler can always render
  /// something (a 500 page) instead of failing to parse.
  static func errorResponseJSON(_ message: String) -> String {
    let body = "<h1>Apex engine error</h1><pre>\(message)</pre>"
    let payload: [String: Any] = [
      "status": 500,
      "headers": ["content-type": "text/html; charset=utf-8"],
      "body": body,
    ]
    if let data = try? JSONSerialization.data(withJSONObject: payload),
       let json = String(data: data, encoding: .utf8) {
      return json
    }
    return #"{"status":500,"headers":{"content-type":"text/html"},"body":"Apex engine error"}"#
  }
}

enum ApexEngineError: Error, CustomStringConvertible {
  case contextCreationFailed
  case missingResource(String)

  var description: String {
    switch self {
    case .contextCreationFailed: return "Failed to create JSContext"
    case .missingResource(let name): return "Missing bundle resource: \(name)"
    }
  }
}

/// A single long-lived thread with a LARGE stack that runs a run loop, so all JSContext work has
/// enough native stack for heavy JS. JavaScriptCore derives its JS call-stack limit from the
/// native thread stack; the default GCD worker stack (~512 KB) overflows the asm.js SQLite with
/// "Maximum call stack size exceeded". Work is marshalled on with `perform(_:on:...)`.
final class ApexEngineThread: NSObject {
  private let thread: Thread

  init(stackSize: Int) {
    let ready = DispatchSemaphore(value: 0)
    let t = Thread {
      // Keep the run loop alive with a dummy port source, then run it forever.
      let runLoop = RunLoop.current
      runLoop.add(NSMachPort(), forMode: .default)
      ready.signal()
      runLoop.run()
    }
    t.stackSize = stackSize
    t.name = "site.apexjs.shell.engine"
    self.thread = t
    super.init()
    t.start()
    ready.wait() // ensure the run loop is up before we schedule work
  }

  /// Boxes a closure so it can ride across `perform(_:on:with:)` (which takes an object).
  private final class Work {
    let block: () -> Void
    init(_ block: @escaping () -> Void) { self.block = block }
  }

  @objc private func run(_ box: Any) { (box as? Work)?.block() }

  /// Run asynchronously on the engine thread.
  func async(_ block: @escaping () -> Void) {
    perform(#selector(run(_:)), on: thread, with: Work(block), waitUntilDone: false)
  }

  /// Run synchronously on the engine thread and return its result. `waitUntilDone: true` executes
  /// the block before returning, so the non-escaping closure is safe via `withoutActuallyEscaping`.
  func sync<T>(_ block: () -> T) -> T {
    var result: T!
    withoutActuallyEscaping(block) { escapable in
      perform(#selector(run(_:)), on: thread, with: Work({ result = escapable() }), waitUntilDone: true)
    }
    return result
  }
}
