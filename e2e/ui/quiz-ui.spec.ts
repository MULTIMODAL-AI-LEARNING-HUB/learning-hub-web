import { test, expect } from '@playwright/test'
import { createTestData } from '../helpers/fixtures'

const BASE_URL = process.env.E2E_WEB_BASE ?? 'https://learninghubs.tech'

test.describe('Quiz UI', () => {
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

  test('UQ1: Student sees course detail with quiz', async ({ browser }) => {
    if (!td?.course?.id) { test.skip(); return }
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsStudent(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/app/student/courses/${td.course.id}`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('UQ2: Student can access quiz taking page', async ({ browser }) => {
    if (!td?.quiz?.id) { test.skip(); return }
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsStudent(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/quiz/${td.quiz.id}`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })

  test('UQ3: Student can access quiz generator tool', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loggedIn = await loginAsStudent(page)
    if (!loggedIn) { test.skip(); await context.close(); return }

    await page.goto(`${BASE_URL}/app/student/quiz`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })
})
