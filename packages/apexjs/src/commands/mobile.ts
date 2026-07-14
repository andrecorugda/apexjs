import { defineCommand } from 'citty'

/**
 * `apex mobile <platform>` — package the app as a native mobile app that runs Apex's full
 * SSR + API pipeline on-device (offline, no server). `android` builds an APK end to end;
 * `ios` scaffolds a WKWebView + JavaScriptCore shell (project generated with XcodeGen — the
 * build/sign step needs a Mac + Xcode).
 */
export const mobileCommand = defineCommand({
  meta: {
    name: 'mobile',
    description: 'Package the app as a native mobile app (on-device Apex engine)',
  },
  subCommands: {
    android: () => import('./mobile-android.js').then((m) => m.mobileAndroidCommand),
    ios: () => import('./mobile-ios.js').then((m) => m.mobileIosCommand),
  },
})
