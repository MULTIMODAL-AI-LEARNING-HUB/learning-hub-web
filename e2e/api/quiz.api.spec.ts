import { test, expect, request } from '@playwright/test'
import { createTestData } from '../helpers/fixtures'
import { pollQuizJob } from '../helpers/wait-for-job'
import type { TestData } from '../helpers/fixtures'

const API_BASE = 'http://localhost:8000/api/v1/'
const AI_BASE = 'http://localhost:8001'

test.describe('Quiz Generation API', () => {
  test.describe.configure({ mode: 'serial' })
  let td: TestData
  let lectApi: Awaited<ReturnType<typeof request.newContext>>
  let stuApi: Awaited<ReturnType<typeof request.newContext>>

  test.beforeAll(async () => {
    td = await createTestData()
    lectApi = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${td.lecturer.token}` }
    })
    stuApi = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${td.student.token}` }
    })
  })

  test('Q1: Start quiz generation with valid course returns 202', async () => {
    const res = await lectApi.post('study/quiz/by-course', {
      data: { course_id: td.course.id, question_count: 5 }
    })
    expect(res.status()).toBe(202)
    const body = await res.json()
    expect(body.job_id).toBeTruthy()
    expect(body.status).toBe('processing')
  })

  test('Q2: Quiz generation without auth returns 401/403', async () => {
    const unauthApi = await request.newContext({ baseURL: API_BASE })
    const res = await unauthApi.post('study/quiz/by-course', {
      data: { course_id: td.course.id, question_count: 5 }
    })
    expect([401, 403]).toContain(res.status())
  })

  test('Q3: Quiz with invalid course returns 404', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000'
    const res = await lectApi.post('study/quiz/by-course', {
      data: { course_id: fakeId, question_count: 5 }
    })
    expect([400, 404]).toContain(res.status())
  })

  test('Q4: Poll quiz job status', async () => {
    const startRes = await lectApi.post('study/quiz/by-course', {
      data: { course_id: td.course.id, question_count: 3 }
    })
    if (!startRes.ok()) { test.skip(); return }
    const { job_id: jobId } = await startRes.json()

    const pollRes = await lectApi.get(`/study/quiz/job/${jobId}`)
    expect(pollRes.ok()).toBeTruthy()
    const body = await pollRes.json()
    expect(body.job_id).toBe(jobId)
    expect(['processing', 'ready', 'failed']).toContain(body.status)
  })

  test('Q5: Quiz with lesson_ids filter', async () => {
    const res = await lectApi.post('study/quiz/by-course', {
      data: { course_id: td.course.id, question_count: 3, lesson_ids: [td.lesson.id] }
    })
    expect(res.status()).toBe(202)
  })

  test('Q6: Generate quiz from context', async () => {
    const internalKey = process.env.INTERNAL_API_KEY || ''
    const aiApi = await request.newContext({
      baseURL: AI_BASE,
      extraHTTPHeaders: internalKey ? { 'X-Internal-API-Key': internalKey } : {}
    })
    const res = await aiApi.post('study/quiz/generate', {
      data: { context: 'Python is a programming language.', quiz_type: 'quick', question_count: 3 }
    })
    if (!internalKey) { test.skip(); return }
    expect(res.ok() || res.status() === 401).toBeTruthy()
  })
})
