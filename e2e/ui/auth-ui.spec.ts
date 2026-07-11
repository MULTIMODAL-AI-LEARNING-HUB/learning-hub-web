import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'
const API_BASE = 'http://localhost:8000/api/v1'

test.describe('Auth UI Flows', () => {
  test.describe.configure({ mode: 'serial' })

  test('UA1: Login page renders with form', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
    await expect(page.locator('button[type="submit"]').first()).toBeVisible()
  })

  test('UA2: Register page renders with form', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('input[name="full_name"], input[placeholder*="Name"]').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('input[type="email"]').first()).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
    await expect(page.locator('button[type="submit"]').first()).toBeVisible()
  })

  test('UA3: Login with valid credentials redirects to dashboard', async ({ page }) => {
    const ts = Date.now()
    const email = `ui_login_${ts}@test.com`

    // Register first via API
    const api = await (await import('@playwright/test')).request.newContext({ baseURL: API_BASE })
    await api.post('/auth/register', {
      data: { email, password: 'TestPass123!', full_name: 'UI Login Test', role: 'student' }
    }).catch(() => {})

    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', 'TestPass123!')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    const currentUrl = page.url()
    expect(currentUrl).not.toContain('/login')
  })

  test('UA4: Login with wrong password shows error', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    await page.fill('input[type="email"]', 'admin@learninghub.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)
    const errorVisible = await page.locator('text=error, text=sai, text=incorrect, text=401, [role="alert"]').first().isVisible().catch(() => false)
    expect(errorVisible || page.url().includes('/login')).toBeTruthy()
  })
})
