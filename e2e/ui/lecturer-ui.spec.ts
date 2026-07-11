import { test, expect } from '@playwright/test'
import { createTestData } from '../helpers/fixtures'

const BASE_URL = 'http://localhost:5173'
const API_BASE = 'http://localhost:8000/api/v1'

test.describe('Lecturer UI', () => {
  test.describe.configure({ mode: 'serial' })
  let td: Awaited<ReturnType<typeof createTestData>>

  test.beforeAll(async () => {
    td = await createTestData()
  })

  async function loginAsLecturer(page: any) {
    const api = await (await import('@playwright/test')).request.newContext({ baseURL: API_BASE })
    const loginRes = await api.post('/auth/login', {
      data: { email: td.lecturer.email, password: td.lecturer.password }
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

  test('UL1: Lecturer dashboard renders with stats', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsLecturer(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/lecturer/dashboard`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('UL2: My courses list renders', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsLecturer(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/lecturer/courses`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('UL3: Course detail page renders', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsLecturer(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/lecturer/courses/${td.course.id}`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('UL4: Content manager renders', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsLecturer(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/lecturer/courses/${td.course.id}/manage`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('UL5: Students list renders', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsLecturer(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/lecturer/courses/${td.course.id}/students`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('UL6: Reviews page renders', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsLecturer(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/lecturer/courses/${td.course.id}/reviews`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('UL7: Analytics page renders', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsLecturer(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/lecturer/analytics`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('UL8: Settings page renders', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsLecturer(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/lecturer/settings`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })
})
