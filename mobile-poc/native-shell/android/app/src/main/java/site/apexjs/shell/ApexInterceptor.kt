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

    // 1) Static client assets from the APK (client JS/CSS bundle, favicon).
    if (path.startsWith("/assets/") || path == "/favicon.svg") {
      return try {
        val asset = context.assets.open(path.removePrefix("/"))
        WebResourceResponse(mimeOf(path), "utf-8", asset)
      } catch (e: Exception) {
        null
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

  private fun mimeOf(path: String) = when (path.substringAfterLast('.')) {
    "js", "mjs" -> "text/javascript"; "css" -> "text/css"; "svg" -> "image/svg+xml"
    "json" -> "application/json"; "png" -> "image/png"; "woff2" -> "font/woff2"
    else -> "application/octet-stream"
  }
}
