package site.apexjs.shell

import android.os.Bundle
import android.webkit.CookieManager
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import kotlinx.coroutines.launch
import androidx.lifecycle.lifecycleScope

// Installed at document-start (before any page script) so the app's fetch() calls — which
// carry a request BODY the native interceptor can't see — route through the ApexBridge JS
// interface to the on-device engine. Same-origin only; anything else falls back to real fetch.
private const val FETCH_PATCH = """
(function(){
  if (window.__apexFetchPatched) return; window.__apexFetchPatched = true;
  var orig = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function(input, init){
    return new Promise(function(resolve, reject){
      try {
        init = init || {};
        var url = typeof input === 'string' ? input : (input && input.url);
        var abs = new URL(url, location.href);
        if (abs.origin !== location.origin || !window.__ApexNative) {
          if (orig) { resolve(orig(input, init)); return; } throw new Error('no fetch');
        }
        var method = (init.method || (typeof input !== 'string' && input && input.method) || 'GET').toUpperCase();
        var headers = {};
        var ih = init.headers || (typeof input !== 'string' && input && input.headers);
        if (ih) { if (typeof ih.forEach === 'function') ih.forEach(function(v,k){ headers[k]=v; }); else for (var k in ih) headers[k]=ih[k]; }
        if (!headers.origin && !headers.Origin) headers.origin = location.origin;
        var body = init.body != null ? (typeof init.body === 'string' ? init.body : JSON.stringify(init.body)) : null;
        var resStr = window.__ApexNative.handle(JSON.stringify({ url: abs.href, method: method, headers: headers, body: body }));
        var res = JSON.parse(resStr);
        resolve(new Response(res.body, { status: res.status || 200, headers: res.headers || {} }));
      } catch (e) { if (orig) resolve(orig(input, init)); else reject(e); }
    });
  };
})();
"""

/**
 * The Apex native shell. Boots the embedded JS engine (which runs the on-device Apex server
 * bundle), points a WebView at the app root, and intercepts every request to serve it from
 * that engine — offline, no server, no port.
 *
 * Splash: the native cold-start splash (Theme.Apex.Splash) bridges process start; the WebView
 * then loads the `pages/splash.alpine` route (your animated intro, SSR-rendered instantly),
 * which navigates to `/` when it signals ready.
 */
class MainActivity : ComponentActivity() {
  private lateinit var engine: ApexEngine

  override fun onCreate(savedInstanceState: Bundle?) {
    val splash = installSplashScreen() // native cold-start splash (androidx.core:core-splashscreen)
    super.onCreate(savedInstanceState)

    val webView = WebView(this)
    setContentView(webView)
    webView.settings.javaScriptEnabled = true
    webView.settings.domStorageEnabled = true

    // Cookies: the session is an HttpOnly cookie the bridge/interceptor manage via CookieManager.
    CookieManager.getInstance().setAcceptCookie(true)
    CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)

    lifecycleScope.launch {
      // 1) Start the engine + load the on-device server bundle from assets/.
      engine = ApexEngine.create(applicationContext)

      // 2) Intercept navigations/static → engine (assets served directly).
      webView.webViewClient = ApexInterceptor(applicationContext, engine)

      // 3) Bridge dynamic fetch() (with bodies) → engine. shouldInterceptRequest can't read a
      //    request body, so POST/login go through this JS interface + a document-start patch.
      webView.addJavascriptInterface(ApexBridge(engine), "__ApexNative")
      if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
        WebViewCompat.addDocumentStartJavaScript(webView, FETCH_PATCH, setOf("*"))
      }

      // 4) Load the app. Start at the animated splash route; it navigates to '/' when ready.
      //    (Any origin — every request is intercepted; the host is ignored.)
      webView.loadUrl("https://localhost/splash")

      // Keep the native splash until the first paint, then let the .alpine splash take over.
      splash.setKeepOnScreenCondition { false }
    }
  }

  override fun onDestroy() {
    if (::engine.isInitialized) engine.close()
    super.onDestroy()
  }
}
