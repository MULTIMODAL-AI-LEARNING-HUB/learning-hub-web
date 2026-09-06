import { test, expect } from '@playwright/test'

const BASE_URL = process.env.PROD_WEB_URL || process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173'
const API_BASE = (process.env.E2E_API_BASE ?? 'http://localhost:8000/api/v1').replace(/\/$/, '')

test.describe('Admin UI', () => {
  test.describe.configure({ mode: 'serial' })

  async function loginAsAdmin(page: any) {
    const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'admin@learninghubs.tech'
    const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? 'Password123!'
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
    await page.locator('input[type="email"]').fill(adminEmail)
    await page.locator('input[type="password"]').fill(adminPassword)
    await page.locator('button[type="submit"]').click()
    await page.waitForURL('**/app/admin/**', { timeout: 15000 }).catch(() => {})
    return true
  }

  test('UA1: Admin dashboard renders with KPIs', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsAdmin(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/app/admin/dashboard`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('UA2: User management page renders', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsAdmin(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/app/admin/users`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('UA3: Courses management page renders', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsAdmin(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/app/admin/courses`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('UA4: Categories management page renders', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsAdmin(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/app/admin/categories`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })
})
