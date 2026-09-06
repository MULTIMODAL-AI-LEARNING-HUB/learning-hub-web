import { test, expect } from '@playwright/test'

const PROD_WEB_URL = process.env.PROD_WEB_URL ?? 'https://learninghubs.tech'
const PROD_API_URL = process.env.PROD_API_URL ?? 'https://learninghub-api-a89cebf8d45f.herokuapp.com'

test.describe('Real-world User Journey: Registration, Payment Intent & Enrollment', () => {
  test('Complete Student Journey: Register -> Browse Courses -> Payment Intent -> Course Interaction', async ({ page, request }) => {
    const timestamp = Date.now()
    const studentEmail = `student.journey.${timestamp}@learninghubs.tech`
    const studentPassword = 'Password123!'
    const studentName = `Nguyễn Hoàng Nam ${timestamp.toString().slice(-4)}`

    // 1. User registers via Frontend UI Form
    await page.goto(`${PROD_WEB_URL}/register`, { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible()

    // Fill form
    await page.locator('input[name="full_name"], input[placeholder*="Minh"]').first().fill(studentName)
    await page.locator('input[type="email"]').fill(studentEmail)
    await page.locator('input[type="password"]').first().fill(studentPassword)
    if (await page.locator('input[name="confirmPassword"]').isVisible()) {
      await page.locator('input[name="confirmPassword"]').fill(studentPassword)
    }

    // Submit registration
    await page.locator('button[type="submit"]').click()

    // Wait for redirect to student dashboard
    await page.waitForURL('**/app/student/dashboard', { timeout: 20000 })
    await expect(page.getByText(/chào buổi/i)).toBeVisible()

    // Retrieve authentication token
    const token = await page.evaluate(() => localStorage.getItem('access_token'))
    expect(token).toBeTruthy()

    // 2. Student browses available published courses in the UI
    await page.goto(`${PROD_WEB_URL}/app/student/browse`, { waitUntil: 'networkidle' })
    await expect(page.locator('body')).toBeVisible()

    // 3. Fetch courses via API with the student's authenticated token
    const coursesRes = await request.get(`${PROD_API_URL}/api/v1/courses`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    expect(coursesRes.ok()).toBeTruthy()
    const coursesData = await coursesRes.json()
    const targetCourse = coursesData.items.find((c: any) => c.status === 'published' && c.price_vnd > 0) || coursesData.items[0]
    expect(targetCourse).toBeTruthy()

    // 4. Navigate directly to Course Detail Page
    await page.goto(`${PROD_WEB_URL}/app/student/courses/${targetCourse.id}`, { waitUntil: 'networkidle' })
    await expect(page.getByText(targetCourse.title)).toBeVisible()
    await expect(page.getByRole('button', { name: /thanh toán|đăng ký/i }).first()).toBeVisible()

    // 5. Create Payment Intent through production API with student's auth token
    const paymentIntentRes = await request.post(`${PROD_API_URL}/api/v1/courses/${targetCourse.id}/enroll/payment-intent`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        payment_method: 'vnpay',
      },
    })
    expect(paymentIntentRes.ok()).toBeTruthy()
    const paymentIntentData = await paymentIntentRes.json()
    expect(paymentIntentData.transaction_id).toBeTruthy()
    expect(paymentIntentData.payment_url).toBeTruthy()

    // 6. Reload Course Detail Page to verify stability
    await page.goto(`${PROD_WEB_URL}/app/student/courses/${targetCourse.id}`, { waitUntil: 'networkidle' })
    await expect(page.getByText(targetCourse.title)).toBeVisible()

    // 7. Student navigates back to Dashboard and sees greeting & active profile
    await page.goto(`${PROD_WEB_URL}/app/student/dashboard`, { waitUntil: 'networkidle' })
    await expect(page.getByText(/chào buổi/i)).toBeVisible()
  })
})
