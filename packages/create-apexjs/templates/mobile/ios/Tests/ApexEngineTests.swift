// ApexEngineTests — runs on the iOS Simulator in CI (GitHub Actions macOS runner), no Mac needed
// locally. This is the highest-value iOS check: it proves the `apex build --mobile` bundle — the
// SHIM, the whole SSR + API pipeline, and the **asm.js SQLite** DB — actually runs under
// **JavaScriptCore** (iOS's engine, different from Android's V8). It drives ApexEngine directly, so
// it does NOT depend on WKURLSchemeHandler (the one remaining device-only unknown — POST bodies on
// a custom scheme — still needs a real device/UI test).
import JavaScriptCore
import XCTest

@testable import ApexShell

final class ApexEngineTests: XCTestCase {
  /// server.mjs + apex-bridge.js are copied into the TEST bundle by CI (see project.yml resources).
  private func makeEngine(snapshot: String? = nil) throws -> ApexEngine {
    try ApexEngine(snapshot: snapshot, bundle: Bundle(for: Self.self))
  }

  private func request(_ url: String, method: String = "GET", body: String? = nil) -> String {
    let obj: [String: Any] = [
      "url": url,
      "method": method,
      "headers": ["content-type": "application/json"],
      "body": body as Any? ?? NSNull(),
    ]
    let data = try! JSONSerialization.data(withJSONObject: obj)
    return String(data: data, encoding: .utf8)!
  }

  /// SSR of a DB-backed page renders the seeded rows — proves JSContext runs the bundle + asm.js DB.
  func testGuestbookRendersSeededRowsOnJavaScriptCore() async throws {
    let engine = try makeEngine()
    let res = await engine.handle(request("apex://localhost/guestbook"))
    XCTAssertTrue(res.contains("Ada Lovelace"), "seeded row missing — bundle/DB didn't run on JSCore. Got: \(res.prefix(400))")
    XCTAssertTrue(res.contains("Alan Turing"))
  }

  /// POST inserts through the Drizzle deferred proxy on asm.js SQLite, and it persists across a
  /// simulated cold start via the snapshot seam.
  func testPostInsertsAndSurvivesSnapshotRestore() async throws {
    let engine = try makeEngine()
    _ = await engine.handle(request("apex://localhost/guestbook")) // lazy-init + seed the DB

    let post = await engine.handle(
      request(
        "apex://localhost/api/messages",
        method: "POST",
        body: #"{"author":"iOS CI","body":"runs on JavaScriptCore"}"#
      )
    )
    XCTAssertTrue(post.contains("iOS CI"), "POST /api/messages did not echo the created row: \(post.prefix(400))")

    let after = await engine.handle(request("apex://localhost/guestbook"))
    XCTAssertTrue(after.contains("iOS CI"), "new message not visible after POST")

    // Cold-start persistence: export bytes, boot a fresh engine with them, data survives.
    let snap = engine.snapshot()
    XCTAssertFalse(snap.isEmpty, "snapshot export returned empty")
    let restored = try makeEngine(snapshot: snap)
    let restoredBody = await restored.handle(request("apex://localhost/guestbook"))
    XCTAssertTrue(restoredBody.contains("iOS CI"), "message did not survive snapshot restore")
  }

  /// Sealed-cookie auth works on JSCore (HMAC, no WebCrypto): login sets a cookie, whoami is gated.
  func testAuthLoginOnJavaScriptCore() async throws {
    let engine = try makeEngine()
    let anon = await engine.handle(request("apex://localhost/api/whoami"))
    XCTAssertTrue(anon.contains("401"), "gated whoami should be 401 when anonymous: \(anon.prefix(200))")

    let login = await engine.handle(
      request("apex://localhost/api/login", method: "POST", body: #"{"name":"Ada"}"#)
    )
    XCTAssertTrue(login.contains("apex-session"), "login should set a session cookie: \(login.prefix(300))")
  }
}
