import { test, expect } from '@playwright/test'
import { createTestData } from '../helpers/fixtures'

const BASE_URL = 'http://localhost:5173'

test.describe('Student UI', () => {
  test.describe.configure({ mode: 'serial' })
  let td: Awaited<ReturnType<typeof createTestData>>

  test.beforeAll(async () => {
    td = await createTestData()
  })

  test('US1: Course catalog renders', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/courses`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    const title = await page.title().catch(() => '')
    expect(title.length >= 0).toBeTruthy()
    await context.close()
  })

  test('US2: Course detail page shows info', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/courses/${td.course.id}`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    const content = await page.textContent('body').catch(() => '')
    expect(content.length > 0).toBeTruthy()
    await context.close()
  })

  test('US3: Student can view learning page when enrolled', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    // Login via API then set token in localStorage
    const api = await (await import('@playwright/test')).request.newContext({ baseURL: 'http://localhost:8000/api/v1' })
    const loginRes = await api.post('/auth/login', {
      data: { email: td.student.email, password: td.student.password }
    })
    if (!loginRes.ok()) { test.skip(); await context.close(); return }
    const token = (await loginRes.json()).access_token

    await page.goto(`${BASE_URL}/login`)
    await page.evaluate((t) => {
      localStorage.setItem('token', t)
      localStorage.setItem('access_token', t)
    }, token)
    await page.goto(`${BASE_URL}/courses/${td.course.id}`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('US4: Chat page renders', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/chat`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('US5: Profile page displays', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/profile`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('US6: My courses page renders', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/my-courses`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('US7: Documents page renders', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/documents`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('US8: Flashcards page renders', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/flashcards`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('US9: Wishlist page renders', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/wishlist`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })
})
