// ApexDbStore.swift — persistence for the on-device database (Approach A: native file bridge).
//
// 1:1 port of android/ApexDbStore.kt. The on-device SQLite lives inside the JS engine as
// in-memory bytes; to survive a cold start we persist those bytes (base64 of `db.export()`) to a
// private app file. ApexEngine reads it at boot and injects `__APEX_DB_SNAPSHOT__`; the scheme
// handler writes it back after a mutating request.
//
// ── Where this diverges from Android ──────────────────────────────────────────────────────
//  • Android writes to `context.filesDir` (app-private) and does an atomic `renameTo`.
//  • iOS writes to the app's Application Support directory (app-private, backed up, not purgeable
//    like Caches) and uses `FileManager.replaceItemAt` for the atomic swap — the documented
//    Foundation primitive for "write tmp, then atomically replace destination".

import Foundation

enum ApexDbStore {
  private static let fileName = "apex-db.b64"

  /// Application Support dir (created on first use). App-private, included in backups, and — unlike
  /// Caches — not eligible for eviction under storage pressure, so the DB snapshot is durable.
  private static func directory() throws -> URL {
    let fm = FileManager.default
    let base = try fm.url(
      for: .applicationSupportDirectory,
      in: .userDomainMask,
      appropriateFor: nil,
      create: true
    )
    if !fm.fileExists(atPath: base.path) {
      try fm.createDirectory(at: base, withIntermediateDirectories: true)
    }
    return base
  }

  private static func fileURL() throws -> URL {
    try directory().appendingPathComponent(fileName)
  }

  /// The saved snapshot (base64), or nil if none yet / empty. Mirrors `read()` on Android.
  static func read() -> String? {
    guard
      let url = try? fileURL(),
      FileManager.default.fileExists(atPath: url.path),
      let text = try? String(contentsOf: url, encoding: .utf8),
      !text.isEmpty
    else {
      return nil
    }
    return text
  }

  /// Persist the snapshot (base64). A blank value (app has no DB) is ignored. Atomic: write a tmp
  /// file then swap it into place so a crash mid-write can't corrupt the DB file. Mirrors
  /// `write()` on Android.
  static func write(_ base64: String) {
    guard !base64.isEmpty else { return }
    do {
      let fm = FileManager.default
      let dest = try fileURL()
      let tmp = try directory().appendingPathComponent("\(fileName).tmp")
      try base64.data(using: .utf8)?.write(to: tmp, options: .atomic)

      if fm.fileExists(atPath: dest.path) {
        // Atomic replace of an existing file.
        _ = try fm.replaceItemAt(dest, withItemAt: tmp)
      } else {
        // First write — nothing to replace, just move it into place.
        try fm.moveItem(at: tmp, to: dest)
      }
    } catch {
      print("[ApexJS] ApexDbStore.write failed: \(error)")
    }
  }
}
