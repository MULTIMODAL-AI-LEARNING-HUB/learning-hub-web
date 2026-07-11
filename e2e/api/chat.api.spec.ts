import { test, expect, request } from '@playwright/test'
import { createTestData } from '../helpers/fixtures'
import type { TestData } from '../helpers/fixtures'

const API_BASE = 'http://localhost:8000/api/v1/'

test.describe('Chat API', () => {
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

  test('C1: Create session without course context', async () => {
    const res = await stuApi.post('chat/sessions', {
      data: { title: 'Test Session', context_type: 'general' }
    })
    expect(res.status()).toBe(201)
    const session = await res.json()
    expect(session.id).toBeTruthy()
    expect(session.context_type).toBe('general')
  })

  test('C2: Create session with course context', async () => {
    const res = await stuApi.post('chat/sessions', {
      data: { course_id: td.course.id, title: 'Course Chat', context_type: 'course' }
    })
    expect(res.status()).toBe(201)
    const session = await res.json()
    expect(session.id).toBeTruthy()
    expect(session.course_id).toBe(td.course.id)
  })

  test('C3: Without auth returns 401', async () => {
    const unauthApi = await request.newContext({ baseURL: API_BASE })
    const res = await unauthApi.post('chat/sessions', { data: { title: 'Test' } })
    expect(res.status()).toBe(401)
  })

  test('C4: List sessions', async () => {
    const res = await stuApi.get('chat/sessions')
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(Array.isArray(data.items)).toBeTruthy()
  })

  test('C5: Send message to session', async () => {
    const sessionRes = await stuApi.post('chat/sessions', { data: { title: 'Ask Test' } })
    expect(sessionRes.status()).toBe(201)
    const session = await sessionRes.json()

    const askRes = await stuApi.post('chat/ask', {
      data: { session_id: session.id, query: 'Hello, what is AI?' }
    })
    expect([200, 502, 503]).toContain(askRes.status())
  })

  test('C6: Message with course context', async () => {
    const sessionRes = await stuApi.post('chat/sessions', {
      data: { course_id: td.course.id, title: 'Course Chat Q' }
    })
    expect(sessionRes.status()).toBe(201)
    const session = await sessionRes.json()

    const askRes = await stuApi.post('chat/ask', {
      data: { session_id: session.id, query: 'Explain this lesson', course_id: td.course.id }
    })
    expect([200, 502, 503]).toContain(askRes.status())
  })

  test('C7: Non-existent session returns 404', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000'
    const res = await stuApi.post('chat/ask', {
      data: { session_id: fakeId, query: 'test' }
    })
    expect([400, 404]).toContain(res.status())
  })

  test('C8: Missing fields returns 422', async () => {
    const res = await stuApi.post('chat/ask', { data: {} })
    expect(res.status()).toBe(422)
  })

  test('C9: Get session messages', async () => {
    const sessionRes = await stuApi.post('chat/sessions', { data: { title: 'Msg Test' } })
    const session = await sessionRes.json()

    const msgRes = await stuApi.get(`/chat/sessions/${session.id}/messages`)
    expect(msgRes.ok()).toBeTruthy()
    const data = await msgRes.json()
    expect(Array.isArray(data.items)).toBeTruthy()
  })

  test('C10: Delete session', async () => {
    const sessionRes = await stuApi.post('chat/sessions', { data: { title: 'To Delete' } })
    const session = await sessionRes.json()
    const deleteRes = await stuApi.delete(`/chat/sessions/${session.id}`)
    expect([204, 200]).toContain(deleteRes.status())
  })

  test('C11: Student cannot access lecturer session', async () => {
    const lectSessionRes = await lectApi.post('chat/sessions', { data: { title: 'Lecturer Private' } })
    if (!lectSessionRes.ok()) { test.skip(); return }
    const lectSession = await lectSessionRes.json()

    const accessRes = await stuApi.get(`/chat/sessions/${lectSession.id}`)
    expect(accessRes.status()).toBe(404)
  })
})
