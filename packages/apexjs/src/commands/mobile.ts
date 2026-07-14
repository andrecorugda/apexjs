import { defineCommand } from 'citty'

/**
 * `apex mobile <platform>` — package the app as a native mobile app that runs Apex's full
 * SSR + API pipeline on-device (offline, no server). Currently: Android. iOS is a WKWebView
 * shell (see mobile-poc/native-shell/ios) pending a productized command.
 */
export const mobileCommand = defineCommand({
  meta: {
    name: 'mobile',
    description: 'Package the app as a native mobile app (on-device Apex engine)',
  },
  subCommands: {
    android: () => import('./mobile-android.js').then((m) => m.mobileAndroidCommand),
  },
})
