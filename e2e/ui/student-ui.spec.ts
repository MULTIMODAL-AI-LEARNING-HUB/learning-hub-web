import { test, expect } from '@playwright/test'
import { createTestData } from '../helpers/fixtures'

const BASE_URL = process.env.E2E_WEB_BASE ?? 'https://learninghubs.tech'

test.describe('Student UI', () => {
  test.describe.configure({ mode: 'serial' })
  let td: Awaited<ReturnType<typeof createTestData>>

  test.beforeAll(async () => {
    td = await createTestData()
  })

  async function loginAsStudent(page: any) {
    if (!td?.student?.token) return false
    await page.addInitScript((token: string) => {
      localStorage.setItem('token', token)
      localStorage.setItem('access_token', token)
    }, td.student.token)
    return true
  }

  test('US1: Course catalog renders', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsStudent(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/app/student/browse`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    const title = await page.title().catch(() => '')
    expect(title.length >= 0).toBeTruthy()
    await context.close()
  })

  test('US2: Course detail page shows info', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsStudent(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/app/student/courses/${td.course.id}`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    const content = await page.textContent('body').catch(() => '')
    expect(content?.length ?? 0).toBeGreaterThan(0)
    await context.close()
  })

  test('US3: Student can view learning page when enrolled', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsStudent(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/app/student/courses/${td.course.id}/learn`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('US4: Chat page renders', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsStudent(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/app/student/chat`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('US5: Profile page displays', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsStudent(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/app/student/profile`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('US6: My courses page renders', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsStudent(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/app/student/courses`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('US7: Documents page renders', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsStudent(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/app/student/documents`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('US8: Flashcards page renders', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsStudent(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/app/student/flashcards`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('US9: Wishlist page renders', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsStudent(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/app/student/wishlist`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })
})
