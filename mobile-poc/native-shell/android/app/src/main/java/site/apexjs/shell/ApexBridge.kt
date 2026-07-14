package site.apexjs.shell

import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import kotlinx.coroutines.runBlocking
import org.json.JSONObject

/**
 * JS -> native bridge for DYNAMIC requests (fetch/XHR) from the page.
 *
 * Android's WebViewClient.shouldInterceptRequest cannot read a request BODY, so POST/PUT/PATCH
 * from the app's fetch() calls (e.g. POST /api/messages, /api/login) are routed here instead —
 * see the document-start fetch patch installed in MainActivity — where the body IS available.
 *
 * It also owns the HttpOnly session cookie via CookieManager: the page can't read or set an
 * HttpOnly cookie itself, so the bridge injects the stored Cookie on the way in and persists
 * any Set-Cookie on the way out. Navigations (GET) go through ApexInterceptor, which does the
 * same, so a login made via fetch() is visible to the next full page load.
 *
 * @JavascriptInterface methods run on a WebView binder thread (not the UI thread), so blocking
 * on the engine coroutine here is fine. NOTE: avoid a slash-star sequence in KDoc.
 */
class ApexBridge(private val engine: ApexEngine) {
  @JavascriptInterface
  fun handle(requestJson: String): String {
    val req = JSONObject(requestJson)
    val url = req.optString("url")
    val headers = req.optJSONObject("headers") ?: JSONObject()

    // Attach the stored session cookie (the page can't read HttpOnly cookies).
    val cookie = CookieManager.getInstance().getCookie(url)
    if (!cookie.isNullOrBlank() && !headers.has("cookie")) headers.put("cookie", cookie)
    req.put("headers", headers)

    val resStr = runBlocking { engine.handle(req.toString()) }
    persistSetCookie(url, resStr)
    return resStr
  }

  companion object {
    /** Store any Set-Cookie from an engine response JSON into the CookieManager. */
    fun persistSetCookie(url: String, responseJson: String) {
      val setCookie = JSONObject(responseJson).optJSONObject("headers")?.optString("set-cookie").orEmpty()
      if (setCookie.isBlank()) return
      val cm = CookieManager.getInstance()
      // A combined header may hold several cookies separated by ", " before a `name=`.
      setCookie.split(Regex(",(?=[^;,]+=)")).forEach { cm.setCookie(url, it.trim()) }
      cm.flush()
    }
  }
}
