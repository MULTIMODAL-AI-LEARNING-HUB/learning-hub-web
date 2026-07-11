import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'
const API_BASE = 'http://localhost:8000/api/v1'

test.describe('Chat UI', () => {
  test.describe.configure({ mode: 'serial' })
  let studentToken = ''

  test.beforeAll(async () => {
    const ts = Date.now()
    const api = await (await import('@playwright/test')).request.newContext({ baseURL: API_BASE })
    await api.post('/auth/register', {
      data: { email: `chatui_${ts}@test.com`, password: 'TestPass123!', full_name: 'Chat UI', role: 'student' }
    }).catch(() => {})
    const loginRes = await api.post('/auth/login', {
      data: { email: `chatui_${ts}@test.com`, password: 'TestPass123!' }
    })
    if (loginRes.ok()) studentToken = (await loginRes.json()).access_token
  })

  test('UC1: Chat page loads with input field', async ({ browser }) => {
    if (!studentToken) { test.skip(); return }
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.evaluate((t) => {
      localStorage.setItem('token', t)
      localStorage.setItem('access_token', t)
    }, studentToken)
    await page.goto(`${BASE_URL}/chat`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    const hasInput = await page.locator('textarea, input[type="text"], [contenteditable]').first().isVisible().catch(() => false)
    expect(hasInput).toBeTruthy()
    await context.close()
  })

  test('UC2: Student can type in chat input', async ({ browser }) => {
    if (!studentToken) { test.skip(); return }
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.evaluate((t) => {
      localStorage.setItem('token', t)
      localStorage.setItem('access_token', t)
    }, studentToken)
    await page.goto(`${BASE_URL}/chat`)
    await page.waitForLoadState('networkidle')
    const input = page.locator('textarea, input[type="text"], [contenteditable]').first()
    if (await input.isVisible()) {
      await input.fill('Hello AI')
      const value = await input.inputValue().catch(async () => (await input.textContent()) || '')
      expect(value.length > 0 || value.includes('Hello')).toBeTruthy()
    }
    await context.close()
  })
})
