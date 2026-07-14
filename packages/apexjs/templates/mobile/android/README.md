# Apex Android shell

A native Android app that runs your Apex backend **on the device** (offline, no server) and
renders it in a WebView. Produced by `assemble-android.mjs` + `apex build --mobile`.

## What's here
```
android/
├─ settings.gradle.kts / build.gradle.kts / gradle.properties
├─ app/build.gradle.kts                 # androidx.javascriptengine + splashscreen + coroutines
└─ app/src/main/
   ├─ AndroidManifest.xml               # launcher activity, no INTERNET permission (offline)
   ├─ java/site/apexjs/shell/
   │   ├─ MainActivity.kt               # WebView + native splash → loads /splash
   │   ├─ ApexEngine.kt                 # loads server.mjs + apex-bridge.js, runs __apexHandle
   │   └─ ApexInterceptor.kt            # every request → engine (assets served from APK)
   ├─ assets/                           # ← server.mjs, apex-bridge.js, client assets (assembler fills)
   └─ res/                              # ← generated launcher icon, adaptive icon, splash color
```

## Build it
From your **Apex app root**:
```bash
node path/to/native-shell/assemble-android.mjs --icon public/icon.png --splash public/icon.png --bg '#0b1120'
```
That runs `apex build --mobile`, copies the bundle + client assets into `app/src/main/assets/`,
and generates the launcher/adaptive icons + native splash from your source image.

Then:
```bash
cd native-shell/android
./gradlew assembleDebug          # → app/build/outputs/apk/debug/app-debug.apk
# or open the folder in Android Studio and Run on the emulator
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

The installed app has your **launcher icon**, shows the **native splash** (icon on your bg),
then your **`pages/splash.alpine`** animated intro, then the app — all rendered by the Apex
server running inside the app on `androidx.javascriptengine`. Turn Wi-Fi off: it still works.

## Engine note
`ApexEngine` uses Google's **androidx.javascriptengine** (out-of-process JS sandbox, no JNI).
`__apexHandle` returns a `Promise<string>`; that resolves via the `PROMISE_RETURN` feature
(beta01+). Swap in an embedded QuickJS (JNI) or Hermes (in an RN shell) with the same shape.

## On-device drivers
`apex build --mobile` reports routes needing `crypto.subtle` (sessions) or `@libsql/client/web`
(DB). `androidx.javascriptengine` provides `crypto`; for DB, alias `@libsql/client` →
`@libsql/client/web` (WASM) before bundling, or bridge to Android's native SQLite.

## Verify (before a device)
`node ../verify-bundle.mjs ../../<app>/dist/mobile/server.mjs` renders the bundle under QuickJS
on your machine — proves the on-device path without building the APK.
