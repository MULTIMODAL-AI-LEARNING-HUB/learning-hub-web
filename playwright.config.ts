import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'url'
import * as path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const shouldStartWebServer = process.env.E2E_START_WEB_SERVER === 'true'
const e2eApiUrl = process.env.VITE_API_URL ?? process.env.E2E_API_BASE ?? 'http://localhost:8000/api/v1'
const e2eWebBase = process.env.E2E_WEB_BASE ?? 'http://localhost:5173'
const e2eWebUrl = new URL(e2eWebBase)
const webServerCommand = process.platform === 'win32'
  ? `set VITE_API_URL=${e2eApiUrl}&& npm.cmd run dev -- --host ${e2eWebUrl.hostname} --port ${e2eWebUrl.port || '5173'} --strictPort`
  : `VITE_API_URL=${e2eApiUrl} npm run dev -- --host ${e2eWebUrl.hostname} --port ${e2eWebUrl.port || '5173'} --strictPort`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  timeout: 60000,
  globalSetup: path.resolve(__dirname, 'e2e', 'global-setup.ts'),
  globalTeardown: path.resolve(__dirname, 'e2e', 'global-teardown.ts'),
  reporter: [
    ['list'],
    ['html', { outputFolder: 'e2e/reports' }]
  ],
  use: {
    baseURL: e2eWebBase,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: shouldStartWebServer ? {
    command: webServerCommand,
    url: e2eWebBase,
    reuseExistingServer: false,
    timeout: 120000,
  } : undefined,
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      }
    }
  ]
})
