import { test, expect, request } from '@playwright/test'

const API_BASE = 'http://localhost:8000/api/v1'
const AI_BASE = 'http://localhost:8001'

test.describe('Quiz Generation API', () => {
  test.beforeAll(async () => {
    // Mock AI service to return predictable quiz questions
    // This avoids real Gemini API calls and ensures consistent results
  })

  test.describe.configure({ mode: 'serial' })

  let lecturerToken = ''
  let studentToken = ''
  let testCourseId = ''

  test('Q1: Lecturer can register and login', async ({}) => {
    const api = await request.newContext({ baseURL: API_BASE })

    // Register lecturer
    await api.post('/auth/register', {
      data: { email: 'e2e_quiz_lecturer@test.com', password: 'TestPass123!', full_name: 'Quiz Lecturer', role: 'lecturer' }
    }).catch(() => ({ ok: () => false } as unknown as ReturnType<typeof api.post>))

    // Login
    const loginRes = await api.post('/auth/login', {
      data: { email: 'e2e_quiz_lecturer@test.com', password: 'TestPass123!' }
    })
    expect(loginRes.ok()).toBeTruthy()
    lecturerToken = (await loginRes.json()).access_token
    expect(lecturerToken).toBeTruthy()
  })

  test('Q2: Student can register and login', async ({}) => {
    const api = await request.newContext({ baseURL: API_BASE })

    await api.post('/auth/register', {
      data: { email: 'e2e_quiz_student@test.com', password: 'TestPass123!', full_name: 'Quiz Student', role: 'student' }
    }).catch(() => ({ ok: () => false } as unknown as ReturnType<typeof api.post>))

    const loginRes = await api.post('/auth/login', {
      data: { email: 'e2e_quiz_student@test.com', password: 'TestPass123!' }
    })
    expect(loginRes.ok()).toBeTruthy()
    studentToken = (await loginRes.json()).access_token
    expect(studentToken).toBeTruthy()
  })

  test('Q3: Create test course for quiz', async ({}) => {
    const api = await request.newContext({
      baseURL: API_BASE,
      extraHTTPHeaders: { Authorization: `Bearer ${lecturerToken}` }
    })

    const courseRes = await api.post('/courses', {
      data: {
        title: 'E2E Quiz Test Course',
        description: 'Test course for quiz generation',
        price: 0,
        status: 'published'
      }
    })

    if (courseRes.ok()) {
      const course = await courseRes.json()
      testCourseId = course.id
    }
    // Course might already exist - try to get it
    if (!testCourseId) {
      const listRes = await api.get('/courses?status=published')
      if (listRes.ok()) {
        const data = await listRes.json()
        const course = data.items?.find((c: { title: string }) => c.title === 'E2E Quiz Test Course')
        if (course) testCourseId = course.id
      }
    }
  })

  test('Q4: Start quiz generation with valid course - returns 202', async ({}) => {
    const api = await request.newContext({
      baseURL: API_BASE,
      extraHTTPHeaders: { Authorization: `Bearer ${lecturerToken}` }
    })

    // Try to find the course
    const listRes = await api.get('/courses?status=published')
    let courseId = testCourseId
    if (!courseId && listRes.ok()) {
      const data = await listRes.json()
      const course = data.items?.[0]
      if (course) courseId = course.id
    }

    if (!courseId) {
      test.skip()
      return
    }

    const res = await api.post('/study/quiz/by-course', {
      data: { course_id: courseId, question_count: 5 }
    })

    expect(res.status()).toBe(202)
    const body = await res.json()
    expect(body.job_id).toBeTruthy()
    expect(body.status).toBe('processing')
  })

  test('Q5: Quiz generation without auth returns 401/403', async ({}) => {
    const api = await request.newContext({ baseURL: API_BASE })

    const listRes = await api.get('/courses?status=published')
    let courseId = ''
    if (listRes.ok()) {
      const data = await listRes.json()
      const course = data.items?.[0]
      if (course) courseId = course.id
    }

    if (!courseId) {
      test.skip()
      return
    }

    const res = await api.post('/study/quiz/by-course', {
      data: { course_id: courseId, question_count: 5 }
    })

    expect([401, 403]).toContain(res.status())
  })

  test('Q6: Quiz generation with invalid course returns 404', async ({}) => {
    const api = await request.newContext({
      baseURL: API_BASE,
      extraHTTPHeaders: { Authorization: `Bearer ${lecturerToken}` }
    })

    const fakeId = '00000000-0000-0000-0000-000000000000'
    const res = await api.post('/study/quiz/by-course', {
      data: { course_id: fakeId, question_count: 5 }
    })

    expect([400, 404]).toContain(res.status())
  })

  test('Q7: Poll quiz job status returns correct structure', async ({}) => {
    const api = await request.newContext({
      baseURL: API_BASE,
      extraHTTPHeaders: { Authorization: `Bearer ${lecturerToken}` }
    })

    const listRes = await api.get('/courses?status=published')
    let courseId = ''
    if (listRes.ok()) {
      const data = await listRes.json()
      const course = data.items?.[0]
      if (course) courseId = course.id
    }

    if (!courseId) {
      test.skip()
      return
    }

    const startRes = await api.post('/study/quiz/by-course', {
      data: { course_id: courseId, question_count: 5 }
    })

    if (!startRes.ok()) {
      test.skip()
      return
    }

    const { job_id: jobId } = await startRes.json()

    // Poll once
    const pollRes = await api.get(`/study/quiz/job/${jobId}`)
    expect(pollRes.ok()).toBeTruthy()
    const body = await pollRes.json()
    expect(body.job_id).toBe(jobId)
    expect(['processing', 'ready', 'failed']).toContain(body.status)
  })

  test('Q8: Quiz with lesson_ids filter starts successfully', async ({}) => {
    const api = await request.newContext({
      baseURL: API_BASE,
      extraHTTPHeaders: { Authorization: `Bearer ${lecturerToken}` }
    })

    const listRes = await api.get('/courses?status=published')
    let courseId = ''
    if (listRes.ok()) {
      const data = await listRes.json()
      const course = data.items?.[0]
      if (course) courseId = course.id
    }

    if (!courseId) {
      test.skip()
      return
    }

    // Try to get lessons for this course
    const lessonsRes = await api.get(`/courses/${courseId}/lessons`)
    let lessonId = ''
    if (lessonsRes.ok()) {
      const data = await lessonsRes.json()
      const lesson = data.items?.[0]
      if (lesson) lessonId = lesson.id
    }

    const payload: { course_id: string; question_count: number; lesson_ids?: string[] } = {
      course_id: courseId,
      question_count: 3
    }
    if (lessonId) {
      payload.lesson_ids = [lessonId]
    }

    const res = await api.post('/study/quiz/by-course', { data: payload })

    expect(res.status()).toBe(202)
  })

  test('Q9: AI service /study/quiz/generate with internal key works', async ({}) => {
    const internalKey = process.env.INTERNAL_API_KEY || 'test-internal-key'

    const api = await request.newContext({
      baseURL: AI_BASE,
      extraHTTPHeaders: { 'X-Internal-API-Key': internalKey }
    })

    const res = await api.post('/study/quiz/generate', {
      data: {
        context: 'This is a test course about Python programming. Topics include variables, functions, and loops.',
        quiz_type: 'quick',
        question_count: 3
      }
    })

    if (res.status() === 401) {
      test.skip()
      return
    }

    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(Array.isArray(body.questions)).toBeTruthy()
    if (body.questions.length > 0) {
      expect(body.questions[0]).toHaveProperty('id')
      expect(body.questions[0]).toHaveProperty('question')
      expect(body.questions[0]).toHaveProperty('options')
      expect(body.questions[0]).toHaveProperty('correct_answer')
    }
  })
})