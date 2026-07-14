package site.apexjs.shell

import android.content.Context
import androidx.javascriptengine.JavaScriptSandbox
import androidx.javascriptengine.JavaScriptIsolate
import kotlinx.coroutines.guava.await

/**
 * Embedded JS engine that runs the Apex on-device server bundle.
 *
 * Uses Google's official androidx.javascriptengine (a WebView-backed, out-of-process JS
 * sandbox — no JNI, no bundled engine). It loads `server.mjs` (from `apex build --mobile`)
 * and `apex-bridge.js` from assets, then evaluates `__apexHandle(requestJson)` per request.
 *
 * Alternative engines with the same shape: an embedded QuickJS (react-native-quick-js /
 * a QuickJS-Android JNI wrapper) or, in a React Native shell, Hermes directly.
 *
 * Gradle: implementation("androidx.javascriptengine:javascriptengine:1.0.0-beta01")
 *         implementation("org.jetbrains.kotlinx:kotlinx-coroutines-guava:<ver>")
 */
class ApexEngine private constructor(
  private val sandbox: JavaScriptSandbox,
  private val isolate: JavaScriptIsolate,
) {
  companion object {
    suspend fun create(context: Context): ApexEngine {
      val sandbox = JavaScriptSandbox.createConnectedInstanceAsync(context).await()
      val isolate = sandbox.createIsolate()
      // Load the self-contained server bundle (sets globalThis.APEX) then the bridge.
      isolate.evaluateJavaScriptAsync(context.assets.readText("server.mjs")).await()
      isolate.evaluateJavaScriptAsync(context.assets.readText("apex-bridge.js")).await()
      return ApexEngine(sandbox, isolate)
    }
  }

  /**
   * Handle one request. `requestJson` = {"url","method","headers","body"}.
   * Returns {"status","headers","body"} as JSON. __apexHandle returns a Promise<string>;
   * javascriptengine resolves it when the PROMISE_RETURN feature is supported (beta01+).
   */
  suspend fun handle(requestJson: String): String {
    val escaped = org.json.JSONObject.quote(requestJson) // safe JS string literal
    return isolate.evaluateJavaScriptAsync("__apexHandle($escaped)").await()
  }

  fun close() {
    isolate.close()
    sandbox.close()
  }
}

private fun android.content.res.AssetManager.readText(name: String): String =
  open(name).bufferedReader().use { it.readText() }
