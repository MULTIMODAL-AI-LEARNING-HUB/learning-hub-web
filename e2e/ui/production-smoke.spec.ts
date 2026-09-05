import { test, expect } from '@playwright/test'

const PROD_WEB_URL = process.env.PROD_WEB_URL ?? 'https://learninghubs.tech'
const PROD_API_URL = process.env.PROD_API_URL ?? 'https://learninghub-api-a89cebf8d45f.herokuapp.com'

test.describe('Production Deployed E2E Smoke Tests', () => {
  test('PROD-1: Deployed Backend API health check returns healthy', async ({ request }) => {
    const res = await request.get(`${PROD_API_URL}/health`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.status).toBe('healthy')
  })

  test('PROD-2: Deployed Backend API rejects invalid login credentials gracefully', async ({ request }) => {
    const res = await request.post(`${PROD_API_URL}/api/v1/auth/login`, {
      data: {
        email: 'nonexistent_user@example.com',
        password: 'wrong_password_123',
      },
    })
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.message).toContain('Invalid credentials')
  })

  test('PROD-3: Deployed Frontend Welcome page loads with branding and CTAs', async ({ page }) => {
    await page.goto(`${PROD_WEB_URL}/welcome`, { waitUntil: 'networkidle' })
    await expect(page.locator('body')).toBeVisible()
    await expect(page.getByRole('button', { name: /bắt đầu|start|sign in|đăng nhập/i }).first()).toBeVisible()
  })

  test('PROD-4: Deployed Frontend Login page renders form elements and handles validation', async ({ page }) => {
    await page.goto(`${PROD_WEB_URL}/login`, { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    await expect(page.getByText(/keep me signed in/i)).toBeVisible()

    await page.locator('input[type="email"]').fill('invalid_smoke@example.com')
    await page.locator('input[type="password"]').fill('WrongPass123!')
    await page.locator('button[type="submit"]').click()

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('alert')).toContainText(/Invalid credentials|sai|không chính xác/i)
  })

  test('PROD-5: Deployed Frontend Register page renders with role toggle and inputs', async ({ page }) => {
    await page.goto(`${PROD_WEB_URL}/register`, { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible()

    const studentBtn = page.getByRole('button', { name: /student/i })
    const lecturerBtn = page.getByRole('button', { name: /lecturer/i })
    await expect(studentBtn).toBeVisible()
    await expect(lecturerBtn).toBeVisible()

    await lecturerBtn.click()
    await expect(lecturerBtn).toBeVisible()

    await expect(page.locator('input[name="full_name"], input[placeholder*="Minh"]').first()).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('PROD-6: Protected route redirects unauthenticated user to login', async ({ page }) => {
    await page.goto(`${PROD_WEB_URL}/app/lecturer/dashboard`)
    await page.waitForTimeout(3000)
    const url = page.url()
    expect(url.includes('/login') || url.includes('/welcome') || url.includes('/auth')).toBeTruthy()
  })
})
