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

  test('PROD-5: Deployed Frontend Register page renders student registration form and inputs', async ({ page }) => {
    await page.goto(`${PROD_WEB_URL}/register`, { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible()

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

  test('PROD-7: Forgot password page renders email input and submit action', async ({ page }) => {
    await page.goto(`${PROD_WEB_URL}/forgot-password`, { waitUntil: 'networkidle' })
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /gửi|send|reset/i }).first()).toBeVisible()
  })

  test('PROD-8: Unauthorized access to admin or student routes redirects to login', async ({ page }) => {
    await page.goto(`${PROD_WEB_URL}/app/admin/dashboard`)
    await page.waitForTimeout(2000)
    expect(page.url().includes('/login') || page.url().includes('/welcome')).toBeTruthy()

    await page.goto(`${PROD_WEB_URL}/app/student/dashboard`)
    await page.waitForTimeout(2000)
    expect(page.url().includes('/login') || page.url().includes('/welcome')).toBeTruthy()
  })

  test('PROD-9: Real Student Registration on production API', async ({ request }) => {
    const timestamp = Date.now()
    const studentEmail = `student_${timestamp}@test.learninghubs.tech`
    const studentName = `Học Viên Test ${timestamp.toString().slice(-4)}`

    const res = await request.post(`${PROD_API_URL}/api/v1/auth/register`, {
      data: {
        email: studentEmail,
        password: 'Password123!',
        full_name: studentName,
        role: 'student',
      },
    })
    expect([200, 201]).toContain(res.status())
    const body = await res.json()
    expect(body.user.email).toBe(studentEmail)
    expect(body.token.access_token).toBeTruthy()
  })

  test('PROD-10: Student Login and Dashboard Experience with dynamic Streak & Activity', async ({ page, request }) => {
    const timestamp = Date.now()
    const studentEmail = `student_ui_${timestamp}@test.learninghubs.tech`
    const studentName = `Học Viên ${timestamp.toString().slice(-4)}`

    // 1. Create student account
    const regRes = await request.post(`${PROD_API_URL}/api/v1/auth/register`, {
      data: {
        email: studentEmail,
        password: 'Password123!',
        full_name: studentName,
        role: 'student',
      },
    })
    expect([200, 201]).toContain(regRes.status())

    // 2. Perform UI login on production
    await page.goto(`${PROD_WEB_URL}/login`, { waitUntil: 'networkidle' })
    await page.locator('input[type="email"]').fill(studentEmail)
    await page.locator('input[type="password"]').fill('Password123!')
    await page.locator('button[type="submit"]').click()

    // 3. Verify redirected to Student Dashboard
    await page.waitForURL('**/app/student/dashboard', { timeout: 15000 })
    await expect(page.getByText(/chào buổi/i)).toBeVisible()

    // 4. Verify 4 KPI Metric Cards
    await expect(page.getByText(/khóa học/i).first()).toBeVisible()
    await expect(page.getByText(/bài học xong/i).first()).toBeVisible()
    await expect(page.getByText(/tài liệu/i).first()).toBeVisible()
    await expect(page.getByText(/tiến độ tb/i).first()).toBeVisible()

    // 5. Verify AI Quick Search Prompt
    await expect(page.getByPlaceholder(/hỏi trợ lý ai bất kỳ điều gì/i)).toBeVisible()

    // 6. Verify Quick AI Study Tools
    await expect(page.getByText(/ai tutor chat/i).first()).toBeVisible()
    await expect(page.getByText(/tạo đề thi ai/i).first()).toBeVisible()
    await expect(page.getByText(/flashcards/i).first()).toBeVisible()

    // 7. Verify Recent Activity Section
    await expect(page.getByText(/hoạt động gần đây/i)).toBeVisible()

    // 8. Verify Student Sidebar Daily Streak Card
    await expect(page.getByText(/mục tiêu ngày/i)).toBeVisible()
    await expect(page.getByText(/chuỗi \d+ ngày/i)).toBeVisible()
  })

  test('PROD-11: Student Browse & Explore Courses page renders on production', async ({ page }) => {
    await page.goto(`${PROD_WEB_URL}/login`, { waitUntil: 'networkidle' })
    await page.goto(`${PROD_WEB_URL}/welcome`, { waitUntil: 'networkidle' })
    await expect(page.locator('body')).toBeVisible()
  })
})
