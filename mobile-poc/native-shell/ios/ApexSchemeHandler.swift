// ApexSchemeHandler.swift — iOS native shell (reference stub).
//
// Registers an `apex://` custom scheme on a WKWebView. Every request the WebView makes is
// intercepted here, handed to the embedded JS engine's __apexHandle(...), and the returned
// {status, headers, body} is served straight back — NO network, NO localhost server, NO port
// (so nothing to suspend when the app backgrounds).
//
// Engine: use your RN Hermes runtime, JavaScriptCore (JSContext), or an embedded QuickJS.
// This stub shows the WKURLSchemeHandler wiring; `ApexEngine` is your engine wrapper that has
// loaded server.mjs + apex-bridge.js and exposes callHandle(_ requestJSON:) async -> String.

import WebKit

final class ApexSchemeHandler: NSObject, WKURLSchemeHandler {
  let engine: ApexEngine            // your Hermes/JSC/QuickJS wrapper (loaded server.mjs + apex-bridge.js)
  init(engine: ApexEngine) { self.engine = engine }

  func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
    guard let url = task.request.url else { task.didFailWithError(URLError(.badURL)); return }

    // Read the request body (POST/PATCH) if any.
    let bodyString = task.request.httpBody.flatMap { String(data: $0, encoding: .utf8) }
    let headers = task.request.allHTTPHeaderFields ?? [:]
    let reqJSON = try! String(data: JSONSerialization.data(withJSONObject: [
      "url": url.absoluteString,
      "method": task.request.httpMethod ?? "GET",
      "headers": headers,
      "body": bodyString as Any,
    ]), encoding: .utf8)!

    Task {
      // Call the JS engine: __apexHandle(reqJSON) → {status, headers, body}
      let resJSON = await engine.callHandle(reqJSON)
      guard
        let data = resJSON.data(using: .utf8),
        let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
        let status = obj["status"] as? Int,
        let body = obj["body"] as? String
      else { task.didFailWithError(URLError(.cannotParseResponse)); return }

      let headers = (obj["headers"] as? [String: String]) ?? ["Content-Type": "text/html"]
      let response = HTTPURLResponse(url: url, statusCode: status, httpVersion: "HTTP/1.1", headerFields: headers)!
      task.didReceive(response)
      task.didReceive(body.data(using: .utf8) ?? Data())
      task.didFinish()
    }
  }

  func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) { /* cancel if you track tasks */ }
}

// Wiring (in your view controller / RN native module):
//
//   let engine = ApexEngine()                 // loads server.mjs + apex-bridge.js into JSC/Hermes/QuickJS
//   let config = WKWebViewConfiguration()
//   config.setURLSchemeHandler(ApexSchemeHandler(engine: engine), forURLScheme: "apex")
//   let webView = WKWebView(frame: .zero, configuration: config)
//   webView.load(URLRequest(url: URL(string: "apex://localhost/")!))
//
// Static assets (client JS/CSS from dist/assets) are also `apex://…` requests — serve them
// from the bundled files instead of the engine (check the path prefix before calling __apexHandle).
