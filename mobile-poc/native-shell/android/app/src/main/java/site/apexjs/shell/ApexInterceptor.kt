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
 * Static client assets (dist/assets/**, favicon) are served straight from the APK; everything
 * else goes to `__apexHandle` (SSR pages + /api). shouldInterceptRequest runs off the UI
 * thread, so blocking on the engine coroutine here is fine.
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

    // 1) Static client assets from the APK (client JS/CSS bundle, favicon).
    if (path.startsWith("/assets/") || path == "/favicon.svg") {
      return try {
        val asset = context.assets.open(path.removePrefix("/"))
        WebResourceResponse(mimeOf(path), "utf-8", asset)
      } catch (e: Exception) {
        null
      }
    }

    // 2) Dynamic routes (SSR pages + /api) → the engine.
    val reqJson = JSONObject().apply {
      put("url", request.url.toString())
      put("method", request.method)
      put("headers", JSONObject(request.requestHeaders as Map<*, *>))
      put("body", JSONObject.NULL)
    }.toString()

    val res = try {
      JSONObject(runBlocking { engine.handle(reqJson) })
    } catch (e: Exception) {
      return WebResourceResponse("text/html", "utf-8", 500, "Server Error", emptyMap(),
        ByteArrayInputStream("<h1>Apex engine error</h1><pre>${e.message}</pre>".toByteArray()))
    }

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

  private fun mimeOf(path: String) = when (path.substringAfterLast('.')) {
    "js", "mjs" -> "text/javascript"; "css" -> "text/css"; "svg" -> "image/svg+xml"
    "json" -> "application/json"; "png" -> "image/png"; "woff2" -> "font/woff2"
    else -> "application/octet-stream"
  }
}
