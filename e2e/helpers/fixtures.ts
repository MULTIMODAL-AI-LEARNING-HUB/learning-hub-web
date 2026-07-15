import { request, expect } from '@playwright/test'

const API_BASE = 'http://localhost:8000/api/v1/'

export interface TestData {
  admin: { email: string; password: string; token: string }
  lecturer: { email: string; password: string; token: string; id: string }
  student: { email: string; password: string; token: string; id: string }
  course: { id: string; title: string }
  section: { id: string }
  lesson: { id: string }
  quiz: { id: string }
  assignment: { id: string }
  category: { id: string }
  enrollment: { id: string }
}

export async function createTestData(): Promise<TestData> {
  const ts = Date.now()
  const data: TestData = {
    admin: {
      email: process.env.E2E_ADMIN_EMAIL ?? 'admin@learninghub.com',
      password: process.env.E2E_ADMIN_PASSWORD ?? 'AdminPass123!',
      token: '',
    },
    lecturer: { email: `e2e_lecturer_${ts}@test.com`, password: 'TestPass123!', id: '' },
    student: { email: `e2e_student_${ts}@test.com`, password: 'TestPass123!', id: '' },
    course: { id: '', title: '' },
    section: { id: '' },
    lesson: { id: '' },
    quiz: { id: '' },
    assignment: { id: '' },
    category: { id: '' },
    enrollment: { id: '' },
  }

  async function ensureLogin(creds: { email: string; password: string; role?: string; full_name?: string }): Promise<string> {
    const ctx = await request.newContext({ baseURL: API_BASE })
    const loginR = await ctx.post('auth/login', { data: { email: creds.email, password: creds.password } })
    if (loginR.ok()) {
      const j = await loginR.json()
      return j.token?.access_token || j.access_token || ''
    }
    await ctx.post('auth/register', {
      data: { email: creds.email, password: creds.password, full_name: creds.full_name || creds.role || 'User', role: creds.role || 'student' }
    }).catch(() => {})
    const loginR2 = await ctx.post('auth/login', { data: { email: creds.email, password: creds.password } })
    if (loginR2.ok()) {
      const j = await loginR2.json()
      return j.token?.access_token || j.access_token || ''
    }
    return ''
  }

  data.admin.token = await ensureLogin({ email: data.admin.email, password: data.admin.password, role: 'admin', full_name: 'System Admin' })

  data.lecturer.token = await ensureLogin({ email: data.lecturer.email, password: data.lecturer.password, role: 'lecturer', full_name: 'E2E Lecturer' })

  data.student.token = await ensureLogin({ email: data.student.email, password: data.student.password, role: 'student', full_name: 'E2E Student' })

  const lectApi = await request.newContext({
    baseURL: API_BASE,
    extraHTTPHeaders: { Authorization: `Bearer ${data.lecturer.token}` }
  })
  const stuApi = await request.newContext({
    baseURL: API_BASE,
    extraHTTPHeaders: { Authorization: `Bearer ${data.student.token}` }
  })
  const adminApi = await request.newContext({
    baseURL: API_BASE,
    extraHTTPHeaders: { Authorization: `Bearer ${data.admin.token}` }
  })

  // Create category
  const catRes = await adminApi.post('categories', {
    data: { name: `E2E Category ${ts}`, slug: `e2e-cat-${ts}`, description: 'E2E test category' }
  })
  if (catRes.ok()) {
    data.category = (await catRes.json()).id
  }

  // Create course
  const courseRes = await lectApi.post('courses', {
    data: {
      title: `E2E Test Course ${ts}`,
      description: 'Full E2E test course',
      price_vnd: 0,
      status: 'draft',
      category_id: data.category || undefined,
    }
  })
  if (courseRes.ok()) {
    const course = await courseRes.json()
    data.course = { id: course.id, title: course.title }
  }

  // Create section
  if (data.course.id) {
    const secRes = await lectApi.post(`courses/${data.course.id}/sections`, {
      data: { title: 'Section 1: Introduction', order_index: 1 }
    })
    if (secRes.ok()) {
      data.section.id = (await secRes.json()).id

      // Create lesson
      const lesRes = await lectApi.post(`sections/${data.section.id}/lessons`, {
        data: { title: 'Lesson 1: Welcome', content: 'Hello and welcome to this course!', order_index: 1, type: 'article' }
      })
      if (lesRes.ok()) {
        data.lesson.id = (await lesRes.json()).id

        // Create quiz
        const quizRes = await lectApi.post(`lessons/${data.lesson.id}/quiz`, {
          data: { title: 'Quiz 1', passing_score: 60, duration_mins: 10, max_attempts: 3 }
        })
        if (quizRes.ok()) {
          data.quiz.id = (await quizRes.json()).id

          // Add question + answer
          const qRes = await lectApi.post(`lessons/${data.lesson.id}/quiz/questions`, {
            data: { question_text: 'What is 2+2?', type: 'single_choice', points: 10 }
          })
          if (qRes.ok()) {
            const qId = (await qRes.json()).id
            await lectApi.post(`lessons/${data.lesson.id}/quiz/questions/${qId}/answers`, {
              data: { answer_text: '4', is_correct: true, order_index: 1 }
            })
            await lectApi.post(`lessons/${data.lesson.id}/quiz/questions/${qId}/answers`, {
              data: { answer_text: '3', is_correct: false, order_index: 2 }
            })
          }
        }

        // Create assignment
        const assignRes = await lectApi.post(`lessons/${data.lesson.id}/assignment`, {
          data: { title: 'Assignment 1', description: 'Complete the task', instructions: 'Do this', max_score: 100, deadline: new Date(Date.now() + 86400000).toISOString() }
        })
        if (assignRes.ok()) {
          data.assignment.id = (await assignRes.json()).id
        }
      }
    }
  }

  // Publish course
  if (data.course.id) {
    await lectApi.post(`courses/${data.course.id}/publish`)

    // Enroll student
    const enrollRes = await stuApi.post(`courses/${data.course.id}/enroll/payment-intent`, {
      data: { payment_method: 'vnpay' }
    })
    if (enrollRes.ok()) {
      const enrollData = await enrollRes.json()
      if (enrollData.enrollment?.id) {
        data.enrollment.id = enrollData.enrollment.id
      }
    }
  }

  return data
}

export async function cleanupTestData(data: TestData) {
  if (!data) return
  const adminApi = data.admin.token ? await request.newContext({
    baseURL: API_BASE,
    extraHTTPHeaders: { Authorization: `Bearer ${data.admin.token}` }
  }) : null

  if (adminApi) {
    if (data.category) {
      await adminApi.delete(`categories/${data.category}`).catch(() => {})
    }
  }
}
