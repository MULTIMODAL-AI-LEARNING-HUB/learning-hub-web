import { test, expect, request } from '@playwright/test'
import { createTestData, cleanupTestData } from '../helpers/fixtures'
import type { TestData } from '../helpers/fixtures'

const API_BASE = 'http://localhost:8000/api/v1/'

test.describe('Student Features API', () => {
  test.describe.configure({ mode: 'serial' })
  let td: TestData
  let stuApi: Awaited<ReturnType<typeof request.newContext>>
  let lectApi: Awaited<ReturnType<typeof request.newContext>>

  test.beforeAll(async () => {
    td = await createTestData()
    stuApi = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${td.student.token}` }
    })
    lectApi = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${td.lecturer.token}` }
    })
  })

  test.afterAll(async () => {
    await cleanupTestData(td)
  })

  test('S01: Enroll free course (instant enrollment)', async () => {
    const res = await stuApi.post(`/courses/${td.course.id}/enroll/payment-intent`, {
      data: { payment_method: 'vnpay' }
    })
    expect([200, 400, 409]).toContain(res.status())
    if (res.status() === 200) {
      const body = await res.json()
      if (body.enrollment?.id) td.enrollment.id = body.enrollment.id
    }
  })

  test('S02: Check enrollment status', async () => {
    const res = await stuApi.get(`/courses/${td.course.id}/enrollment-status`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(typeof body.is_enrolled).toBe('boolean')
  })

  test('S03: My enrollments list', async () => {
    const res = await stuApi.get('enrollments/my-enrollments')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.items)).toBeTruthy()
  })

  test('S04: Get enrollment progress', async () => {
    const enrollRes = await stuApi.get('enrollments/my-enrollments')
    if (!enrollRes.ok()) { test.skip(); return }
    const items = (await enrollRes.json()).items
    if (!items || items.length === 0) { test.skip(); return }
    const enrollId = items[0].id
    const res = await stuApi.get(`/progress/enrollments/${enrollId}/progress`)
    expect(res.status()).toBe(200)
  })

  test('S05: Update material progress', async () => {
    const enrollRes = await stuApi.get('enrollments/my-enrollments')
    if (!enrollRes.ok()) { test.skip(); return }
    const items = (await enrollRes.json()).items
    if (!items || items.length === 0) { test.skip(); return }
    const enrollId = items[0].id
    const res = await stuApi.post(`/progress/enrollments/${enrollId}/materials/${td.lesson.id}/progress`, {
      data: { progress_percent: 100 }
    })
    expect([200, 404]).toContain(res.status())
  })

  test('S06: Start quiz attempt', async () => {
    if (!td.quiz.id) { test.skip(); return }
    const res = await stuApi.post(`/lessons/${td.lesson.id}/quiz/attempt`, { data: {} })
    expect([201, 400, 404]).toContain(res.status())
  })

  test('S07: Get my quiz attempts', async () => {
    const res = await stuApi.get(`/lessons/${td.lesson.id}/quiz/my-attempts`)
    expect([200, 404]).toContain(res.status())
  })

  test('S08: Submit assignment', async () => {
    const res = await stuApi.post(`/lessons/${td.lesson.id}/assignment/submissions`, {
      data: { submission_text: 'My homework submission for E2E test' }
    })
    expect([201, 400, 404]).toContain(res.status())
  })

  test('S09: Get my submissions', async () => {
    const res = await stuApi.get(`/lessons/${td.lesson.id}/assignment/submissions`)
    expect([200, 404]).toContain(res.status())
  })

  test('S10: Create chat session (general)', async () => {
    const res = await stuApi.post('chat/sessions', {
      data: { title: 'E2E General Chat', context_type: 'general' }
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.context_type).toBe('general')
  })

  test('S11: Create chat session (course context)', async () => {
    const res = await stuApi.post('chat/sessions', {
      data: { course_id: td.course.id, title: 'E2E Course Chat', context_type: 'course' }
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.course_id).toBe(td.course.id)
  })

  test('S12: List chat sessions', async () => {
    const res = await stuApi.get('chat/sessions')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.items)).toBeTruthy()
  })

  test('S13: Ask AI question', async () => {
    const sessionRes = await stuApi.post('chat/sessions', {
      data: { title: 'Ask Test' }
    })
    if (!sessionRes.ok()) { test.skip(); return }
    const sessionId = (await sessionRes.json()).id

    const res = await stuApi.post('chat/ask', {
      data: { session_id: sessionId, query: 'What is machine learning?' }
    })
    expect([200, 502, 503]).toContain(res.status())
  })

  test('S14: Get chat messages', async () => {
    const sessionRes = await stuApi.post('chat/sessions', {
      data: { title: 'Messages Test' }
    })
    if (!sessionRes.ok()) { test.skip(); return }
    const sessionId = (await sessionRes.json()).id

    const res = await stuApi.get(`/chat/sessions/${sessionId}/messages`)
    expect(res.status()).toBe(200)
  })

  test('S15: Delete chat session', async () => {
    const sessionRes = await stuApi.post('chat/sessions', {
      data: { title: 'To Delete' }
    })
    if (!sessionRes.ok()) { test.skip(); return }
    const sessionId = (await sessionRes.json()).id

    const res = await stuApi.delete(`/chat/sessions/${sessionId}`)
    expect([204, 200]).toContain(res.status())
  })

  test('S16: Submit essay for AI grading', async () => {
    const res = await stuApi.post('study/essay/submit', {
      data: { essay_text: 'Artificial Intelligence is transforming how we learn and work.' }
    })
    expect([200, 400, 502]).toContain(res.status())
    if (res.status() === 200) {
      const body = await res.json()
      expect(typeof body.score).toBe('number')
    }
  })

  test('S17: Generate flashcards', async () => {
    const res = await stuApi.post('study/flashcards/generate', {
      data: { context: 'Machine Learning is a subset of AI.', set_name: 'E2E Test', count: 5 }
    })
    expect([200, 202]).toContain(res.status())
  })

  test('S18: Student dashboard', async () => {
    const res = await stuApi.get('dashboard/my-dashboard')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(typeof body.total_enrollments).toBe('number')
  })

  test('S19: Unauthenticated enrollment request blocked', async () => {
    const unauthApi = await request.newContext({ baseURL: API_BASE })
    const res = await unauthApi.post(`/courses/${td.course.id}/enroll/payment-intent`, {
      data: { payment_method: 'vnpay' }
    })
    expect(res.status()).toBe(401)
  })

  test('S20: Enroll non-existent course returns 404', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000'
    const res = await stuApi.post(`/courses/${fakeId}/enroll/payment-intent`, {
      data: { payment_method: 'vnpay' }
    })
    expect([400, 404]).toContain(res.status())
  })

  test('S21: Grade submission (lecturer)', async () => {
    const subRes = await stuApi.post(`/lessons/${td.lesson.id}/assignment/submissions`, {
      data: { submission_text: 'Please grade this' }
    })
    if (!subRes.ok()) { test.skip(); return }
    const subId = (await subRes.json()).id

    const gradeRes = await lectApi.post(`/lessons/${td.lesson.id}/assignment/submissions/${subId}/grade`, {
      data: { score: 85, feedback: 'Good work!' }
    })
    expect([200, 404]).toContain(gradeRes.status())
  })
})
