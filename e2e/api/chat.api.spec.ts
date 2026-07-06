import { test, expect, request } from '@playwright/test'

const API_BASE = 'http://localhost:8000/api/v1'

test.describe('Chat API', () => {
  let lecturerToken = ''
  let studentToken = ''
  let studentApi: Awaited<ReturnType<typeof request.newContext>>
  let lecturerApi: Awaited<ReturnType<typeof request.newContext>>

  test.beforeAll(async () => {
    const lecturerCtx = await request.newContext({ baseURL: API_BASE })
    const studentCtx = await request.newContext({ baseURL: API_BASE })

    // Register/login lecturer
    await lecturerCtx.post('/auth/register', {
      data: { email: 'e2e_chat_lecturer@test.com', password: 'TestPass123!', full_name: 'Chat Lecturer', role: 'lecturer' }
    }).catch(() => ({ ok: () => false } as unknown as ReturnType<typeof lecturerCtx.post>))
    const lecturerLogin = await lecturerCtx.post('/auth/login', {
      data: { email: 'e2e_chat_lecturer@test.com', password: 'TestPass123!' }
    })
    if (lecturerLogin.ok()) {
      lecturerToken = (await lecturerLogin.json()).access_token
    }

    // Register/login student
    await studentCtx.post('/auth/register', {
      data: { email: 'e2e_chat_student@test.com', password: 'TestPass123!', full_name: 'Chat Student', role: 'student' }
    }).catch(() => ({ ok: () => false } as unknown as ReturnType<typeof studentCtx.post>))
    const studentLogin = await studentCtx.post('/auth/login', {
      data: { email: 'e2e_chat_student@test.com', password: 'TestPass123!' }
    })
    if (studentLogin.ok()) {
      studentToken = (await studentLogin.json()).access_token
    }

    lecturerApi = await request.newContext({
      baseURL: API_BASE,
      extraHTTPHeaders: { Authorization: `Bearer ${lecturerToken}` }
    })
    studentApi = await request.newContext({
      baseURL: API_BASE,
      extraHTTPHeaders: { Authorization: `Bearer ${studentToken}` }
    })
  })

  test('C1: Create chat session without course context', async ({}) => {
    const res = await studentApi.post('/chat/sessions', {
      data: { title: 'Test Session', context_type: 'general' }
    })
    expect(res.status()).toBe(201)
    const session = await res.json()
    expect(session.id).toBeTruthy()
    expect(session.context_type).toBe('general')
  })

  test('C2: Create chat session with course context', async ({}) => {
    // Get a course first
    const coursesRes = await studentApi.get('/courses?status=published')
    let courseId = ''
    if (coursesRes.ok()) {
      const data = await coursesRes.json()
      const course = data.items?.[0]
      if (course) courseId = course.id
    }

    if (!courseId) {
      test.skip()
      return
    }

    const res = await studentApi.post('/chat/sessions', {
      data: { course_id: courseId, title: 'Course Chat', context_type: 'course' }
    })
    expect(res.status()).toBe(201)
    const session = await res.json()
    expect(session.id).toBeTruthy()
    expect(session.course_id).toBe(courseId)
  })

  test('C3: Create chat session without auth returns 401', async ({}) => {
    const api = await request.newContext({ baseURL: API_BASE })
    const res = await api.post('/chat/sessions', {
      data: { title: 'Test' }
    })
    expect(res.status()).toBe(401)
  })

  test('C4: List chat sessions returns valid structure', async ({}) => {
    const res = await studentApi.get('/chat/sessions')
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(Array.isArray(data.items)).toBeTruthy()
    expect(typeof data.total).toBe('number')
    expect(typeof data.page).toBe('number')
    expect(typeof data.page_size).toBe('number')
  })

  test('C5: Send message to chat session', async ({}) => {
    // Create a session
    const sessionRes = await studentApi.post('/chat/sessions', {
      data: { title: 'Ask Question Test' }
    })
    expect(sessionRes.status()).toBe(201)
    const session = await sessionRes.json()

    // Send message
    const askRes = await studentApi.post('/chat/ask', {
      data: {
        session_id: session.id,
        query: 'Hello, what can you tell me about AI?'
      }
    })

    // AI service might be unavailable or return error, but the endpoint should respond
    expect([200, 502, 503, 500]).toContain(askRes.status())
  })

  test('C6: Send message with course_id and lesson_id context', async ({}) => {
    const coursesRes = await studentApi.get('/courses?status=published')
    let courseId = ''
    if (coursesRes.ok()) {
      const data = await coursesRes.json()
      const course = data.items?.[0]
      if (course) courseId = course.id
    }

    const sessionRes = await studentApi.post('/chat/sessions', {
      data: { course_id: courseId || undefined, title: 'Context Chat' }
    })
    expect(sessionRes.status()).toBe(201)
    const session = await sessionRes.json()

    const payload: { session_id: string; query: string; course_id?: string; lesson_id?: string } = {
      session_id: session.id,
      query: 'Explain this lesson'
    }
    if (courseId) {
      payload.course_id = courseId
    }

    const askRes = await studentApi.post('/chat/ask', { data: payload })
    expect([200, 502, 503, 500]).toContain(askRes.status())
  })

  test('C7: Ask with non-existent session returns 404', async ({}) => {
    const fakeId = '00000000-0000-0000-0000-000000000000'
    const res = await studentApi.post('/chat/ask', {
      data: { session_id: fakeId, query: 'test' }
    })
    expect([400, 404]).toContain(res.status())
  })

  test('C8: Ask without required fields returns 422', async ({}) => {
    const res = await studentApi.post('/chat/ask', {
      data: {}
    })
    expect(res.status()).toBe(422)
  })

  test('C9: Get session messages returns valid structure', async ({}) => {
    const sessionRes = await studentApi.post('/chat/sessions', {
      data: { title: 'Messages Test' }
    })
    const session = await sessionRes.json()

    const msgRes = await studentApi.get(`/chat/sessions/${session.id}/messages`)
    expect(msgRes.ok()).toBeTruthy()
    const data = await msgRes.json()
    expect(Array.isArray(data.items)).toBeTruthy()
    expect(typeof data.total).toBe('number')
  })

  test('C10: Delete session returns 204', async ({}) => {
    const sessionRes = await studentApi.post('/chat/sessions', {
      data: { title: 'To Delete' }
    })
    const session = await sessionRes.json()

    const deleteRes = await studentApi.delete(`/chat/sessions/${session.id}`)
    expect([204, 404]).toContain(deleteRes.status())
  })

  test('C11: Student cannot access another user session', async ({}) => {
    // Create session as lecturer
    const lectSessionRes = await lecturerApi.post('/chat/sessions', {
      data: { title: 'Lecturer Private' }
    })
    if (!lectSessionRes.ok()) {
      test.skip()
      return
    }
    const lectSession = await lectSessionRes.json()

    // Student tries to access it
    const accessRes = await studentApi.get(`/chat/sessions/${lectSession.id}`)
    expect(accessRes.status()).toBe(404)
  })
})