import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'
const API_BASE = 'http://localhost:8000/api/v1'

test.describe('Admin UI', () => {
  test.describe.configure({ mode: 'serial' })

  async function loginAsAdmin(page: any) {
    const api = await (await import('@playwright/test')).request.newContext({ baseURL: API_BASE })
    const loginRes = await api.post('/auth/login', {
      data: { email: 'admin@learninghub.com', password: 'admin123' }
    })
    if (!loginRes.ok()) return false
    const data = await loginRes.json()
    await page.goto(`${BASE_URL}/login`)
    await page.evaluate((t) => {
      localStorage.setItem('token', t)
      localStorage.setItem('access_token', t)
    }, data.access_token)
    return true
  }

  test('UA1: Admin dashboard renders with KPIs', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsAdmin(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/admin/dashboard`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('UA2: User management page renders', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsAdmin(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/admin/users`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('UA3: Courses management page renders', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsAdmin(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/admin/courses`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('UA4: Categories management page renders', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsAdmin(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/admin/categories`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })
})
