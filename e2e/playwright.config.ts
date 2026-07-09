import { defineConfig, devices } from '@playwright/test'

// One consolidated e2e harness for the whole framework. It boots the
// examples/showcase app (which exercises every Apex feature) with the freshly
// built workspace CLI — NOT a globally installed apex — and drives it with a
// real browser. Replaces the old per-playground Playwright suites.
const PORT = 3199

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Run the built CLI directly against the showcase app — deterministic, and
    // immune to the .bin/apex shim resolving to a global install.
    command: `node ../packages/apexjs/dist/cli.js dev ../examples/showcase --port ${PORT}`,
    port: PORT,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
