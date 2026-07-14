package site.apexjs.shell

import android.content.Context
import java.io.File

/**
 * Persistence for the on-device database (Approach A: native file bridge).
 *
 * The on-device SQLite lives in the JS engine as in-memory bytes. To survive a cold start we
 * persist those bytes (base64 of `db.export()`) to a private app file: ApexEngine reads it at
 * boot and injects `__APEX_DB_SNAPSHOT__`; ApexBridge writes it back after a mutating request.
 * Simple, atomic-enough for a single-user app, and no extra dependency.
 */
object ApexDbStore {
  private const val FILE = "apex-db.b64"

  private fun file(context: Context) = File(context.filesDir, FILE)

  /** The saved snapshot (base64), or null if none yet. */
  fun read(context: Context): String? =
    file(context).takeIf { it.exists() }?.readText()?.ifBlank { null }

  /** Persist the snapshot (base64). A blank value (app has no DB) is ignored. */
  fun write(context: Context, base64: String) {
    if (base64.isBlank()) return
    val f = file(context)
    val tmp = File(f.parentFile, "$FILE.tmp")
    tmp.writeText(base64)
    tmp.renameTo(f) // replace atomically so a crash mid-write can't corrupt the DB file
  }
}
