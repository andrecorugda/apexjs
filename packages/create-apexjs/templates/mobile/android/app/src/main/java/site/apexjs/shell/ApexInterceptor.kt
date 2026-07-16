package site.apexjs.shell

import android.content.Context
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import java.io.ByteArrayInputStream

/**
 * Serves every WebView request from the on-device Apex engine — offline, no network.
 * Static client assets (the built client bundle under assets, favicon) are served straight from
 * the APK; everything else goes to `__apexHandle` (SSR pages + /api). shouldInterceptRequest runs
 * off the UI thread, so blocking on the engine coroutine here is fine.
 * NOTE: avoid a slash-star sequence in KDoc — Kotlin block comments nest and it won't close.
 */
class ApexInterceptor(
  private val context: Context,
  private val engine: ApexEngine,
) : WebViewClient() {

  override fun shouldInterceptRequest(
    view: WebView,
    request: WebResourceRequest,
  ): WebResourceResponse? {
    val path = request.url.path ?: "/"

    // 1) Any static file bundled into the APK (public/) — the client JS/CSS under /assets/,
    //    the favicon, AND sprites / audio / images / fonts / manifest / etc. A file request
    //    has an extension in its last segment; extensionless paths (/, /guestbook, /api/…) are
    //    SSR/API routes and fall through to the engine below. Serve whatever actually exists in
    //    the bundle; a miss (not an asset) falls through too.
    if (path.substringAfterLast('/').contains('.')) {
      val assetPath = path.removePrefix("/")
      try {
        val asset = context.assets.open(assetPath)
        val encoding = if (isTextAsset(path)) "utf-8" else null
        return WebResourceResponse(mimeOf(path), encoding, asset)
      } catch (e: Exception) {
        // Not a bundled file (or a directory) → fall through to the SSR engine.
      }
    }

    // 2) Dynamic routes (SSR pages) → the engine. shouldInterceptRequest can't read a request
    //    body, so these are effectively GET/navigation; POST/fetch with a body goes through the
    //    ApexBridge JS interface instead. We inject the stored session cookie so a login made via
    //    fetch() is visible to the next full page load.
    val url = request.url.toString()
    val reqHeaders = JSONObject(request.requestHeaders as Map<*, *>)
    val cookie = android.webkit.CookieManager.getInstance().getCookie(url)
    if (!cookie.isNullOrBlank() && !reqHeaders.has("cookie") && !reqHeaders.has("Cookie")) {
      reqHeaders.put("cookie", cookie)
    }
    val reqJson = JSONObject().apply {
      put("url", url)
      put("method", request.method)
      put("headers", reqHeaders)
      put("body", JSONObject.NULL)
    }.toString()

    val resStr = try {
      runBlocking { engine.handle(reqJson) }
    } catch (e: Exception) {
      return WebResourceResponse("text/html", "utf-8", 500, "Server Error", emptyMap(),
        ByteArrayInputStream("<h1>Apex engine error</h1><pre>${e.message}</pre>".toByteArray()))
    }
    ApexBridge.persistSetCookie(url, resStr)
    val res = JSONObject(resStr)

    val headers = res.optJSONObject("headers") ?: JSONObject()
    val contentType = headers.optString("content-type", "text/html")
    return WebResourceResponse(
      contentType.substringBefore(";").ifBlank { "text/html" },
      "utf-8",
      res.optInt("status", 200),
      "OK",
      headers.keys().asSequence().associateWith { headers.getString(it) },
      ByteArrayInputStream(res.optString("body", "").toByteArray(Charsets.UTF_8)),
    )
  }

  private fun mimeOf(path: String) = when (path.substringAfterLast('.').lowercase()) {
    "js", "mjs" -> "text/javascript"; "css" -> "text/css"; "svg" -> "image/svg+xml"
    "json", "map" -> "application/json"; "html", "htm" -> "text/html"; "txt" -> "text/plain"
    "wasm" -> "application/wasm"
    // images
    "png" -> "image/png"; "jpg", "jpeg" -> "image/jpeg"; "gif" -> "image/gif"
    "webp" -> "image/webp"; "avif" -> "image/avif"; "ico" -> "image/x-icon"
    // audio / video
    "mp3" -> "audio/mpeg"; "wav" -> "audio/wav"; "ogg", "oga" -> "audio/ogg"
    "m4a" -> "audio/mp4"; "mp4" -> "video/mp4"; "webm" -> "video/webm"
    // fonts
    "woff2" -> "font/woff2"; "woff" -> "font/woff"; "ttf" -> "font/ttf"; "otf" -> "font/otf"
    else -> "application/octet-stream"
  }

  private fun isTextAsset(path: String) = when (path.substringAfterLast('.').lowercase()) {
    "js", "mjs", "css", "svg", "json", "map", "html", "htm", "txt", "xml" -> true
    else -> false
  }
}
