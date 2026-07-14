package site.apexjs.shell

import android.os.Bundle
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import kotlinx.coroutines.launch
import androidx.lifecycle.lifecycleScope

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

    lifecycleScope.launch {
      // 1) Start the engine + load the on-device server bundle from assets/.
      engine = ApexEngine.create(applicationContext)

      // 2) Intercept every WebView request → engine (assets served directly).
      webView.webViewClient = ApexInterceptor(applicationContext, engine)

      // 3) Load the app. Start at the animated splash route; it navigates to '/' when ready.
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
