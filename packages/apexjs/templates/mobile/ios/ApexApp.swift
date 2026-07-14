// ApexApp.swift — SwiftUI entry point for the Apex iOS shell.
//
// Mirrors android/MainActivity.kt: boot the on-device JS engine, create a WKWebView whose
// `apex://` scheme is served by ApexSchemeHandler, and load `apex://localhost/splash`.
//
// ── Where this diverges from Android ──────────────────────────────────────────────────────
//  • Android boots the engine asynchronously (androidx.javascriptengine sandbox handshake) inside
//    lifecycleScope, then wires the WebView. On iOS, JSContext is synchronous, so we build the
//    engine up front (in ApexRuntime) — no async gate before the first load.
//  • Android's fetch()-with-body needs a JS bridge + document-start patch; iOS does NOT (the
//    scheme handler reads the body directly), so there is nothing extra to install on the WebView.
//  • Splash: iOS shows a native launch screen (configured via Info.plist `UILaunchScreen`, a solid
//    brand-colour screen — see ios/README.md) before JS runs, then the WebView loads the
//    `pages/splash.alpine` route (SSR-rendered instantly), which navigates to `/` when ready —
//    the same two-stage splash handoff as Android.

import SwiftUI
import WebKit

@main
struct ApexShellApp: App {
  /// The engine + scheme handler live for the whole app lifetime.
  @StateObject private var runtime = ApexRuntime()

  var body: some Scene {
    WindowGroup {
      ApexWebView(runtime: runtime)
        .ignoresSafeArea()          // full-bleed; the .alpine splash handles safe-area insets itself
    }
  }
}

/// Owns the singleton engine and scheme handler. Building the engine can fail only if the bundle
/// resources are missing (server.mjs / apex-bridge.js not copied in) — we surface that as an error
/// page rather than crashing, so a Mac tester sees a clear message.
final class ApexRuntime: ObservableObject {
  let engine: ApexEngine?
  let bootError: String?

  init() {
    do {
      // Restore the persisted DB snapshot (if any) BEFORE the bundle boots (see ApexDbStore).
      let engine = try ApexEngine(snapshot: ApexDbStore.read())
      self.engine = engine
      self.bootError = nil
    } catch {
      self.engine = nil
      self.bootError = "\(error)"
      print("[ApexJS] engine boot failed: \(error)")
    }
  }
}

/// Bridges a WKWebView into SwiftUI. Registers the `apex://` scheme handler on the configuration
/// (this MUST happen before the WebView is created — you can't add a scheme handler afterwards)
/// and loads the animated splash route.
struct ApexWebView: UIViewRepresentable {
  let runtime: ApexRuntime

  func makeUIView(context: Context) -> WKWebView {
    let configuration = WKWebViewConfiguration()

    // Enable JavaScript (needed for client hydration in the WebView).
    if #available(iOS 14.0, *) {
      configuration.defaultWebpagePreferences.allowsContentJavaScript = true
    } else {
      configuration.preferences.javaScriptEnabled = true
    }

    // Register the custom scheme → on-device engine. If the engine failed to boot we still create
    // the WebView but load an error page instead.
    if let engine = runtime.engine {
      configuration.setURLSchemeHandler(
        ApexSchemeHandler(engine: engine),
        forURLScheme: ApexSchemeHandler.scheme
      )
    }

    let webView = WKWebView(frame: .zero, configuration: configuration)
    webView.allowsBackForwardNavigationGestures = true
    // Match the native launch screen background so there's no flash before the .alpine splash.
    webView.isOpaque = false
    webView.backgroundColor = UIColor(red: 0x0b/255, green: 0x11/255, blue: 0x20/255, alpha: 1) // #0b1120
    webView.scrollView.backgroundColor = webView.backgroundColor

    if runtime.engine != nil {
      // Load the animated splash route first; it navigates to '/' when ready (same as Android).
      // Any host works — every request is intercepted; the host ("localhost") is ignored.
      if let url = URL(string: "\(ApexSchemeHandler.scheme)://localhost/splash") {
        webView.load(URLRequest(url: url))
      }
    } else {
      let message = runtime.bootError ?? "unknown error"
      webView.loadHTMLString(
        "<h1>Apex engine failed to start</h1><pre>\(message)</pre>"
          + "<p>Check that server.mjs and apex-bridge.js are in the app bundle Resources.</p>",
        baseURL: nil
      )
    }
    return webView
  }

  func updateUIView(_ webView: WKWebView, context: Context) {
    // Stateless — the engine drives everything through the scheme handler. Nothing to reconcile.
  }
}
