// ApexSchemeHandler.swift — iOS native shell: custom `apex://` scheme → on-device engine.
//
// Mirrors android/ApexInterceptor.kt + android/ApexBridge.kt COMBINED. Every request the WebView
// makes is intercepted here, handed to the embedded engine's `__apexHandle(...)`, and the returned
// {status, headers, body} is served straight back — NO network, NO localhost server, NO port (so
// nothing to suspend when the app backgrounds).
//
// ── The big iOS advantage over Android ────────────────────────────────────────────────────
// Android needs TWO paths because `WebViewClient.shouldInterceptRequest` CANNOT read a request
// body: navigations/GET go through ApexInterceptor, while body-bearing fetch()/POST are rerouted
// through a JS bridge (ApexBridge + a document-start fetch patch).
//
// On iOS, `WKURLSchemeHandler` receives the FULL `URLRequest`, including `httpBody` — so a single
// handler covers BOTH navigations and body-bearing fetch()/POST. No JS fetch patch, no
// @JavascriptInterface bridge. This one file replaces both Android files.
//
//   ⚠️ Known caveat (flag for the Mac tester): on some iOS versions WKWebView has historically
//   dropped the body from custom-scheme requests (`httpBody`/`httpBodyStream` come back nil for
//   POST). If a Mac tester observes empty POST bodies, the fallback is the Android-style approach:
//   a `WKScriptMessageHandler` + document-start fetch patch that forwards fetch() bodies. We read
//   httpBody AND drain httpBodyStream below to maximise the chance the body is present.
//
// Cookies: the session is an HttpOnly cookie the engine issues (Set-Cookie) and expects back
// (Cookie header). Custom-scheme requests do NOT participate in WKHTTPCookieStore, so — exactly
// like Android's CookieManager usage — we manage it ourselves: inject the stored Cookie on the way
// in, persist any Set-Cookie on the way out. Kept in this file (a small ApexCookieJar) per spec.

import Foundation
import WebKit

final class ApexSchemeHandler: NSObject, WKURLSchemeHandler {
  /// The URL scheme this handler is registered for. The WebView loads `apex://localhost/splash`.
  static let scheme = "apex"

  private let engine: ApexEngine
  private let cookieJar = ApexCookieJar()

  /// Tasks currently in flight. WKURLSchemeTask is not thread-safe and must not be messaged after
  /// `stop` (doing so crashes). We track live tasks and no-op once a task has been stopped.
  private var activeTasks = Set<ObjectIdentifier>()
  private let lock = NSLock()

  init(engine: ApexEngine) {
    self.engine = engine
  }

  // MARK: - WKURLSchemeHandler

  func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
    let id = ObjectIdentifier(task)
    lock.lock(); activeTasks.insert(id); lock.unlock()

    guard let url = task.request.url else {
      finishFailing(task, id: id, error: URLError(.badURL))
      return
    }
    let path = url.path.isEmpty ? "/" : url.path

    // 1) Static client assets straight from the app bundle (client JS/CSS bundle, favicon) —
    //    mirrors ApexInterceptor's `/assets/` + `/favicon.svg` fast path. No engine round-trip.
    if path.hasPrefix("/assets/") || path == "/favicon.svg" {
      if serveBundledAsset(path: path, url: url, task: task, id: id) { return }
      // Fall through to the engine if the file isn't in the bundle (lets the engine 404 cleanly).
    }

    // 2) Everything else → the on-device engine. Build the {url,method,headers,body} request JSON,
    //    INCLUDING the body (the iOS advantage), injecting the stored session cookie.
    let method = (task.request.httpMethod ?? "GET").uppercased()
    var headers = task.request.allHTTPHeaderFields ?? [:]

    // Inject the stored HttpOnly session cookie if the request doesn't already carry one.
    if headers["cookie"] == nil, headers["Cookie"] == nil,
       let stored = cookieJar.cookieHeader(), !stored.isEmpty {
      headers["cookie"] = stored
    }

    let bodyString = ApexSchemeHandler.readBody(from: task.request)

    var requestObject: [String: Any] = [
      "url": url.absoluteString,
      "method": method,
      "headers": headers,
    ]
    requestObject["body"] = bodyString ?? NSNull()

    guard
      let data = try? JSONSerialization.data(withJSONObject: requestObject),
      let requestJSON = String(data: data, encoding: .utf8)
    else {
      finishFailing(task, id: id, error: URLError(.cannotParseResponse))
      return
    }

    // Off the main thread: call the engine, then hop back to the main thread to message the task
    // (WKURLSchemeTask callbacks must be delivered consistently; we use the main thread).
    Task { [weak self] in
      guard let self else { return }
      let responseJSON = await self.engine.handle(requestJSON)

      // Persist any Set-Cookie so a login (via fetch) is visible to the next full page load.
      self.cookieJar.persistSetCookie(from: responseJSON)

      // A mutating request may have changed the DB — persist a fresh snapshot so it survives a
      // cold start (mirrors ApexBridge). All body-bearing writes come through here.
      if method != "GET", method != "HEAD", method != "OPTIONS" {
        ApexDbStore.write(self.engine.snapshot())
      }

      await MainActor.run {
        self.deliver(responseJSON: responseJSON, url: url, task: task, id: id)
      }
    }
  }

  func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {
    // Mark the task dead so any in-flight completion no-ops instead of messaging a stopped task.
    lock.lock(); activeTasks.remove(ObjectIdentifier(task)); lock.unlock()
  }

  // MARK: - Response delivery

  /// Parse the engine's {status,headers,body} JSON and stream it to the WebView task.
  private func deliver(responseJSON: String, url: URL, task: WKURLSchemeTask, id: ObjectIdentifier) {
    guard isActive(id) else { return }

    guard
      let data = responseJSON.data(using: .utf8),
      let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else {
      finishFailing(task, id: id, error: URLError(.cannotParseResponse))
      return
    }

    let status = (obj["status"] as? Int) ?? 200
    let body = (obj["body"] as? String) ?? ""
    var headers = (obj["headers"] as? [String: String]) ?? ["content-type": "text/html; charset=utf-8"]

    let bodyData = body.data(using: .utf8) ?? Data()
    // Set Content-Length so the WebView knows the body is complete.
    if headers["content-length"] == nil, headers["Content-Length"] == nil {
      headers["Content-Length"] = String(bodyData.count)
    }

    guard let response = HTTPURLResponse(
      url: url,
      statusCode: status,
      httpVersion: "HTTP/1.1",
      headerFields: headers
    ) else {
      finishFailing(task, id: id, error: URLError(.cannotParseResponse))
      return
    }

    task.didReceive(response)
    task.didReceive(bodyData)
    task.didFinish()
    markDone(id)
  }

  // MARK: - Static assets

  /// Serve a bundled `/assets/...` or `/favicon.svg` file. Returns true if handled.
  ///
  /// Assets are copied into the app bundle under an `assets/` folder reference (see ios/README.md),
  /// so `/assets/app-abc123.js` maps to bundle resource `app-abc123.js` in subdirectory `assets`,
  /// and `/favicon.svg` maps to `favicon.svg` at the bundle root.
  private func serveBundledAsset(path: String, url: URL, task: WKURLSchemeTask, id: ObjectIdentifier) -> Bool {
    let fileURL: URL?
    if path == "/favicon.svg" {
      fileURL = Bundle.main.url(forResource: "favicon", withExtension: "svg")
    } else {
      // "/assets/app-abc123.js" → resource "app-abc123", ext "js", subdirectory "assets".
      let name = (path as NSString).lastPathComponent            // app-abc123.js
      let ext = (name as NSString).pathExtension                  // js
      let base = (name as NSString).deletingPathExtension         // app-abc123
      let subdir = ((path as NSString).deletingLastPathComponent as NSString)
        .lastPathComponent                                        // assets
      fileURL = Bundle.main.url(forResource: base, withExtension: ext, subdirectory: subdir)
    }

    guard let fileURL, let fileData = try? Data(contentsOf: fileURL) else {
      return false
    }

    let headers = [
      "content-type": ApexSchemeHandler.mimeType(for: path),
      "content-length": String(fileData.count),
      // Client bundle filenames are content-hashed → safe to cache aggressively.
      "cache-control": "public, max-age=31536000, immutable",
    ]
    guard let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: headers) else {
      return false
    }

    guard isActive(id) else { return true }
    task.didReceive(response)
    task.didReceive(fileData)
    task.didFinish()
    markDone(id)
    return true
  }

  // MARK: - Task bookkeeping

  private func isActive(_ id: ObjectIdentifier) -> Bool {
    lock.lock(); defer { lock.unlock() }
    return activeTasks.contains(id)
  }

  private func markDone(_ id: ObjectIdentifier) {
    lock.lock(); activeTasks.remove(id); lock.unlock()
  }

  private func finishFailing(_ task: WKURLSchemeTask, id: ObjectIdentifier, error: Error) {
    guard isActive(id) else { return }
    task.didFailWithError(error)
    markDone(id)
  }

  // MARK: - Body + MIME helpers

  /// Read the request body: prefer `httpBody`, fall back to draining `httpBodyStream`.
  /// (See the caveat in the file header about custom-scheme bodies on some iOS versions.)
  private static func readBody(from request: URLRequest) -> String? {
    if let body = request.httpBody {
      return String(data: body, encoding: .utf8)
    }
    guard let stream = request.httpBodyStream else { return nil }
    stream.open()
    defer { stream.close() }
    var data = Data()
    let bufferSize = 4096
    var buffer = [UInt8](repeating: 0, count: bufferSize)
    while stream.hasBytesAvailable {
      let read = stream.read(&buffer, maxLength: bufferSize)
      if read > 0 { data.append(buffer, count: read) } else { break }
    }
    return data.isEmpty ? nil : String(data: data, encoding: .utf8)
  }

  /// Mirrors ApexInterceptor.mimeOf.
  private static func mimeType(for path: String) -> String {
    switch (path as NSString).pathExtension.lowercased() {
    case "js", "mjs": return "text/javascript; charset=utf-8"
    case "css": return "text/css; charset=utf-8"
    case "svg": return "image/svg+xml"
    case "json": return "application/json; charset=utf-8"
    case "png": return "image/png"
    case "jpg", "jpeg": return "image/jpeg"
    case "webp": return "image/webp"
    case "woff2": return "font/woff2"
    case "woff": return "font/woff"
    case "ttf": return "font/ttf"
    case "ico": return "image/x-icon"
    default: return "application/octet-stream"
    }
  }
}

// MARK: - Cookie jar

/// Manages the HttpOnly session cookie the engine issues, the way Android's CookieManager usage in
/// ApexBridge/ApexInterceptor does. Custom `apex://` requests don't flow through WKHTTPCookieStore,
/// so we keep a tiny name→value jar ourselves and persist it (mirrors CookieManager's on-disk
/// persistence) so a login survives a cold start.
private final class ApexCookieJar {
  private let defaultsKey = "site.apexjs.shell.cookies"
  private let lock = NSLock()
  private var jar: [String: String]   // cookie name → value

  init() {
    let stored = UserDefaults.standard.dictionary(forKey: defaultsKey) as? [String: String]
    jar = stored ?? [:]
  }

  /// The `Cookie:` header value to send to the engine (all stored name=value pairs), or nil.
  func cookieHeader() -> String? {
    lock.lock(); defer { lock.unlock() }
    guard !jar.isEmpty else { return nil }
    return jar.map { "\($0.key)=\($0.value)" }.joined(separator: "; ")
  }

  /// Store any Set-Cookie from an engine response JSON. Mirrors ApexBridge.persistSetCookie:
  /// a combined header may hold several cookies separated by ", " before a `name=`.
  func persistSetCookie(from responseJSON: String) {
    guard
      let data = responseJSON.data(using: .utf8),
      let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
      let headers = obj["headers"] as? [String: Any]
    else { return }

    // Header name may be any case.
    let raw: String? = (headers["set-cookie"] as? String) ?? (headers["Set-Cookie"] as? String)
    guard let setCookie = raw, !setCookie.isEmpty else { return }

    lock.lock(); defer { lock.unlock() }
    for chunk in ApexCookieJar.splitCombinedSetCookie(setCookie) {
      // A single cookie: "name=value; Path=/; HttpOnly; ..." — take the first `name=value` pair.
      let firstPair = chunk.split(separator: ";", maxSplits: 1).first.map(String.init) ?? chunk
      guard let eq = firstPair.firstIndex(of: "=") else { continue }
      let name = firstPair[..<eq].trimmingCharacters(in: .whitespaces)
      let value = firstPair[firstPair.index(after: eq)...].trimmingCharacters(in: .whitespaces)
      guard !name.isEmpty else { continue }
      // A cookie cleared with an expiry in the past / empty value → drop it. Simplified vs a full
      // RFC 6265 expiry parse; enough for the single-session PoC (logout clears the value).
      if value.isEmpty {
        jar.removeValue(forKey: name)
      } else {
        jar[name] = value
      }
    }
    UserDefaults.standard.set(jar, forKey: defaultsKey)
  }

  /// Split a combined Set-Cookie header on the boundary ", " that precedes a new `name=` — the
  /// same heuristic as Android's regex `,(?=[^;,]+=)`. Avoids splitting on commas inside an
  /// `Expires=Wed, 09 Jun 2021 ...` attribute.
  private static func splitCombinedSetCookie(_ header: String) -> [String] {
    var results: [String] = []
    var current = ""
    let chars = Array(header)
    var i = 0
    while i < chars.count {
      if chars[i] == "," {
        // Look ahead: is the next token `<name>=` before any ';' or ','? If so, this comma is a
        // cookie separator; otherwise it's part of an attribute value (e.g. an Expires date).
        var j = i + 1
        while j < chars.count, chars[j] == " " { j += 1 }
        var k = j
        var sawEquals = false
        while k < chars.count, chars[k] != ";", chars[k] != "," {
          if chars[k] == "=" { sawEquals = true; break }
          k += 1
        }
        if sawEquals {
          results.append(current.trimmingCharacters(in: .whitespaces))
          current = ""
          i = j
          continue
        }
      }
      current.append(chars[i])
      i += 1
    }
    let tail = current.trimmingCharacters(in: .whitespaces)
    if !tail.isEmpty { results.append(tail) }
    return results
  }
}
