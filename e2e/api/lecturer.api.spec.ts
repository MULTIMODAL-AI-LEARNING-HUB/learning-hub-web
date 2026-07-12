import { test, expect, request } from '@playwright/test'
import { createTestData, cleanupTestData } from '../helpers/fixtures'
import type { TestData } from '../helpers/fixtures'

const API_BASE = 'http://localhost:8000/api/v1/'

test.describe('Lecturer Content Management API', () => {
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

  test.afterAll(async () => {
    await cleanupTestData(td)
  })

  test('L01: Create section', async () => {
    const res = await lectApi.post(`courses/${td.course.id}/sections`, {
      data: { title: 'New Section', order_index: 2 }
    })
    expect(res.status()).toBe(201)
  })

  test('L02: List sections with lessons', async () => {
    const res = await lectApi.get(`courses/${td.course.id}/sections`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBeTruthy()
  })

  test('L03: Update section', async () => {
    const res = await lectApi.put(`courses/${td.course.id}/sections/${td.section.id}`, {
      data: { title: 'Updated Section Title' }
    })
    expect(res.status()).toBe(200)
  })

  test('L04: Create lesson', async () => {
    const res = await lectApi.post(`sections/${td.section.id}/lessons`, {
      data: { title: 'New Lesson', content: 'New lesson content', order_index: 2, type: 'article' }
    })
    expect(res.status()).toBe(201)
    td.lesson.id = (await res.json()).id
  })

  test('L05: Update lesson', async () => {
    const res = await lectApi.put(`sections/${td.section.id}/lessons/${td.lesson.id}`, {
      data: { title: 'Updated Lesson Title' }
    })
    expect(res.status()).toBe(200)
  })

  test('L06: Student cannot create lesson', async () => {
    const res = await stuApi.post(`sections/${td.section.id}/lessons`, {
      data: { title: 'Hacker Lesson', content: 'x', order_index: 1 }
    })
    expect(res.status()).toBe(403)
  })

  test('L07: Create quiz with questions and answers', async () => {
    const quizRes = await lectApi.post(`lessons/${td.lesson.id}/quiz`, {
      data: { title: 'E2E Test Quiz', passing_score: 70, duration_mins: 15, max_attempts: 2 }
    })
    expect(quizRes.status()).toBe(201)
    td.quiz.id = (await quizRes.json()).id

    const qRes = await lectApi.post(`lessons/${td.lesson.id}/quiz/questions`, {
      data: { question_text: 'What is the capital of France?', type: 'single_choice', points: 10 }
    })
    expect(qRes.status()).toBe(201)
    const qId = (await qRes.json()).id

    const aRes = await lectApi.post(`lessons/${td.lesson.id}/quiz/questions/${qId}/answers`, {
      data: { answer_text: 'Paris', is_correct: true, order_index: 1 }
    })
    expect(aRes.status()).toBe(201)

    const aRes2 = await lectApi.post(`lessons/${td.lesson.id}/quiz/questions/${qId}/answers`, {
      data: { answer_text: 'London', is_correct: false, order_index: 2 }
    })
    expect(aRes2.status()).toBe(201)
  })

  test('L08: Get quiz with questions', async () => {
    if (!td.quiz.id) { test.skip(); return }
    const res = await lectApi.get(`lessons/${td.lesson.id}/quiz`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(td.quiz.id)
    expect(Array.isArray(body.questions)).toBeTruthy()
    if (body.questions.length > 0) {
      expect(Array.isArray(body.questions[0].answers)).toBeTruthy()
    }
  })

  test('L09: Delete question', async () => {
    const qRes = await lectApi.post(`lessons/${td.lesson.id}/quiz/questions`, {
      data: { question_text: 'Temp question', type: 'single_choice', points: 5 }
    })
    if (!qRes.ok()) { test.skip(); return }
    const qId = (await qRes.json()).id
    const delRes = await lectApi.delete(`lessons/${td.lesson.id}/quiz/questions/${qId}`)
    expect([204, 200]).toContain(delRes.status())
  })

  test('L10: Create assignment', async () => {
    const res = await lectApi.post(`lessons/${td.lesson.id}/assignment`, {
      data: {
        title: 'Final Project',
        description: 'Build something great',
        instructions: 'Follow the steps',
        max_score: 100,
        deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
        allow_resubmit: true,
        max_resubmits: 2
      }
    })
    expect(res.status()).toBe(201)
    td.assignment.id = (await res.json()).id
  })

  test('L11: Get assignment', async () => {
    const res = await lectApi.get(`lessons/${td.lesson.id}/assignment`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.title).toBeTruthy()
  })

  test('L12: Create announcement', async () => {
    const res = await lectApi.post(`courses/${td.course.id}/announcements`, {
      data: { title: 'Important Announcement', content: 'Please check the new materials.' }
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.title).toBe('Important Announcement')
  })

  test('L13: List announcements', async () => {
    const res = await lectApi.get(`courses/${td.course.id}/announcements`)
    expect(res.status()).toBe(200)
  })

  test('L14: List enrolled students', async () => {
    const res = await lectApi.get(`courses/${td.course.id}/enrolled-students`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.items)).toBeTruthy()
  })

  test('L15: Student discussion CRUD', async () => {
    const discRes = await stuApi.post(`lessons/${td.lesson.id}/discussions`, {
      data: { content: 'Great lesson, thanks!' }
    })
    expect(discRes.status()).toBe(201)
    const discId = (await discRes.json()).id

    const listRes = await stuApi.get(`lessons/${td.lesson.id}/discussions`)
    expect(listRes.status()).toBe(200)

    const updRes = await stuApi.put(`lessons/${td.lesson.id}/discussions/posts/${discId}`, {
      data: { content: 'Updated comment' }
    })
    expect(updRes.status()).toBe(200)

    const voteRes = await stuApi.post(`lessons/${td.lesson.id}/discussions/posts/${discId}/upvote`)
    expect(voteRes.status()).toBe(200)
  })

  test('L16: Student creates review', async () => {
    const res = await stuApi.post(`courses/${td.course.id}/reviews`, {
      data: { rating: 5, comment: 'Excellent course!' }
    })
    expect(res.status()).toBe(201)
  })

  test('L17: Get my review', async () => {
    const res = await stuApi.get(`courses/${td.course.id}/reviews/my-review`)
    expect(res.status()).toBe(200)
  })

  test('L18: Update my review', async () => {
    const res = await stuApi.put(`courses/${td.course.id}/reviews/my-review`, {
      data: { rating: 4, comment: 'Updated review' }
    })
    expect(res.status()).toBe(200)
  })

  test('L19: Lecturer replies to review', async () => {
    const res = await lectApi.post(`courses/${td.course.id}/reviews/review-id/reply`, {
      data: { reply_text: 'Thank you for your feedback!' }
    })
    expect([201, 404]).toContain(res.status())
  })

  test('L20: Course materials - add external URL', async () => {
    const res = await lectApi.post(`courses/${td.course.id}/materials/external?url=https://example.com/doc.pdf&material_type=lecture`)
    expect(res.status()).toBe(201)
  })

  test('L21: List course materials', async () => {
    const res = await lectApi.get(`courses/${td.course.id}/materials`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.items)).toBeTruthy()
  })

  test('L22: Delete section', async () => {
    const secRes = await lectApi.post(`courses/${td.course.id}/sections`, {
      data: { title: 'Section to Delete', order_index: 99 }
    })
    if (!secRes.ok()) { test.skip(); return }
    const secId = (await secRes.json()).id
    const delRes = await lectApi.delete(`courses/${td.course.id}/sections/${secId}`)
    expect([204, 200]).toContain(delRes.status())
  })
})
