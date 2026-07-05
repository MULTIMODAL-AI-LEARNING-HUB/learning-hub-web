import { chromium, FullConfig } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CREDENTIALS = [
  { email: 'e2e_lecturer@test.com', password: 'TestPass123!', role: 'lecturer' },
  { email: 'e2e_student@test.com', password: 'TestPass123!', role: 'student' }
]

async function globalSetup(config: FullConfig) {
  // Put .auth at project root (one level above e2e/)
  const projectRoot = path.join(__dirname, '..')
  const stateDir = path.join(projectRoot, '.auth')
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true })
  }

  const baseURL = 'http://localhost:8000/api/v1'

  for (const cred of CREDENTIALS) {
    const browser = await chromium.launch()
    const context = await browser.newContext()
    const page = await context.newPage()

    try {
      await page.goto(`${baseURL}/auth/login`)
      await page.waitForLoadState('networkidle')

      await page.fill('input[name="email"], input[type="email"]', cred.email)
      await page.fill('input[name="password"]', cred.password)
      await page.click('button[type="submit"], button:has-text("Đăng nhập"), button:has-text("Login")')
      await page.waitForURL('**/app**', { timeout: 10000 }).catch(() => {})
    } catch {
      // Login might already exist, try direct register
      try {
        await page.goto(`${baseURL}/auth/register`)
        await page.fill('input[name="email"], input[type="email"]', cred.email)
        await page.fill('input[name="password"]', cred.password)
        await page.click('button[type="submit"]')
        await page.waitForURL('**/app**', { timeout: 10000 }).catch(() => {})
      } catch {
        // Ignore
      }
    }

    const storagePath = path.join(stateDir, `${cred.role}.json`)
    await context.storageState({ path: storagePath })
    await context.close()
    await browser.close()
  }
}

export default globalSetup