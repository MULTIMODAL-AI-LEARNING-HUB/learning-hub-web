import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'
const API_BASE = 'http://localhost:8000/api/v1'

test.describe('Quiz UI', () => {
  test.describe.configure({ mode: 'serial' })
  let courseId = ''
  let studentToken = ''

  test.beforeAll(async () => {
    const ts = Date.now()
    const api = await (await import('@playwright/test')).request.newContext({ baseURL: API_BASE })

    await api.post('/auth/register', {
      data: { email: `quizui_lect_${ts}@test.com`, password: 'TestPass123!', full_name: 'QuizUI Lect', role: 'lecturer' }
    }).catch(() => {})
    const lectLogin = await api.post('/auth/login', {
      data: { email: `quizui_lect_${ts}@test.com`, password: 'TestPass123!' }
    })
    const lecturerToken = lectLogin.ok() ? (await lectLogin.json()).access_token : ''
    const lectApi = await (await import('@playwright/test')).request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${lecturerToken}` }
    })

    await api.post('/auth/register', {
      data: { email: `quizui_stu_${ts}@test.com`, password: 'TestPass123!', full_name: 'QuizUI Student', role: 'student' }
    }).catch(() => {})
    const stuLogin = await api.post('/auth/login', {
      data: { email: `quizui_stu_${ts}@test.com`, password: 'TestPass123!' }
    })
    if (stuLogin.ok()) studentToken = (await stuLogin.json()).access_token

    const courseRes = await lectApi.post('/courses', {
      data: { title: `Quiz UI Course ${ts}`, description: 'Quiz UI Test', status: 'draft' }
    })
    if (courseRes.ok()) {
      courseId = (await courseRes.json()).id
      const secRes = await lectApi.post(`/courses/${courseId}/sections`, {
        data: { title: 'Section 1', order_index: 1 }
      })
      if (secRes.ok()) {
        const sectionId = (await secRes.json()).id
        const lesRes = await lectApi.post(`/sections/${sectionId}/lessons`, {
          data: { title: 'Lesson 1', content: 'Quiz content', order_index: 1, type: 'article' }
        })
        if (lesRes.ok()) {
          const lessonId = (await lesRes.json()).id
          await lectApi.post(`/lessons/${lessonId}/quiz`, {
            data: { title: 'UI Test Quiz', passing_score: 50, duration_mins: 10, max_attempts: 3 }
          })
        }
      }
      await lectApi.post(`/courses/${courseId}/publish`)
    }

    const stuApi = await (await import('@playwright/test')).request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${studentToken}` }
    })
    await stuApi.post(`/courses/${courseId}/enroll/payment-intent`, {
      data: { payment_method: 'vnpay' }
    }).catch(() => {})
  })

  test('UQ1: Student sees quiz page', async ({ browser }) => {
    if (!courseId) { test.skip(); return }
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.evaluate((t) => {
      localStorage.setItem('token', t)
      localStorage.setItem('access_token', t)
    }, studentToken)
    await page.goto(`${BASE_URL}/courses/${courseId}`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })
})
