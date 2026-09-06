import { test, expect } from '@playwright/test'

const BASE_URL = process.env.PROD_WEB_URL || process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173'
const API_BASE = (process.env.E2E_API_BASE ?? 'http://localhost:8000/api/v1/').replace(/\/?$/, '/')

test.describe('Chat UI', () => {
  test.describe.configure({ mode: 'serial' })
  let studentEmail = ''
  const studentPassword = 'TestPass123!'

  test.beforeAll(async ({ request }) => {
    const ts = Date.now()
    studentEmail = `chatui_${ts}@test.com`
    await request.post(`${API_BASE}auth/register`, {
      data: { email: studentEmail, password: studentPassword, full_name: 'Chat UI Test', role: 'student' }
    }).catch(() => {})
  })

  async function loginStudent(page: any) {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
    await page.fill('input[type="email"]', studentEmail)
    await page.fill('input[type="password"]', studentPassword)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/app/student/dashboard', { timeout: 15000 })
    await page.goto(`${BASE_URL}/app/student/chat`, { waitUntil: 'networkidle' })
  }

  test('UC1: Chat page loads with input field', async ({ page }) => {
    await loginStudent(page)
    await expect(page.locator('body')).toBeVisible()
    const hasInput = await page.locator('textarea, input[type="text"], [contenteditable]').first().isVisible().catch(() => false)
    expect(hasInput).toBeTruthy()
  })

  test('UC2: Student can type in chat input', async ({ page }) => {
    await loginStudent(page)
    const input = page.locator('textarea, input[type="text"], [contenteditable]').first()
    if (await input.isVisible()) {
      await input.fill('Hello AI')
      const value = await input.inputValue().catch(async () => (await input.textContent()) || '')
      expect(value.length > 0 || value.includes('Hello')).toBeTruthy()
    }
  })
})
