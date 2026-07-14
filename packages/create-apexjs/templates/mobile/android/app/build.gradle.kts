plugins {
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
}
android {
  namespace = "site.apexjs.shell"
  compileSdk = 34
  defaultConfig {
    applicationId = "site.apexjs.shell"
    minSdk = 26           // adaptive icons + androidx.javascriptengine
    targetSdk = 34
    versionCode = 1
    versionName = "1.0"
  }
  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }
  kotlinOptions { jvmTarget = "17" }
}
dependencies {
  implementation("androidx.core:core-ktx:1.13.1")
  implementation("androidx.core:core-splashscreen:1.0.1")
  implementation("androidx.appcompat:appcompat:1.7.0")
  implementation("androidx.activity:activity-ktx:1.9.2")
  implementation("androidx.javascriptengine:javascriptengine:1.0.0-beta01")
  implementation("androidx.webkit:webkit:1.11.0") // WebViewCompat.addDocumentStartJavaScript
  implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
  implementation("org.jetbrains.kotlinx:kotlinx-coroutines-guava:1.8.1")
}
