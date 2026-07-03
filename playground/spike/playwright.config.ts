import { defineConfig, devices } from '@playwright/test'

const PORT = 3199

export default defineConfig({
  testDir: './e2e',
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
    command: `node ../../packages/apexjs/dist/cli.js dev --port ${PORT}`,
    port: PORT,
    reuseExistingServer: false,
    timeout: 30_000,
  },
})
