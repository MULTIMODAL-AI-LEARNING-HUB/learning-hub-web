import { test, expect, request } from '@playwright/test'
import { createTestData, cleanupTestData } from '../helpers/fixtures'
import type { TestData } from '../helpers/fixtures'

const API_BASE = 'http://localhost:8000/api/v1/'
const ADMIN_BASE = `${API_BASE}admin`

test.describe('Admin API', () => {
  test.describe.configure({ mode: 'serial' })
  let td: TestData
  let adminApi: Awaited<ReturnType<typeof request.newContext>>
  let stuApi: Awaited<ReturnType<typeof request.newContext>>

  test.beforeAll(async () => {
    td = await createTestData()
    adminApi = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${td.admin.token}` }
    })
    stuApi = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${td.student.token}` }
    })
  })

  test.afterAll(async () => {
    await cleanupTestData(td)
  })

  test('AD01: Get analytics', async () => {
    const res = await adminApi.get(`${ADMIN_BASE}/analytics`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(typeof body.total_users).toBe('number')
    expect(typeof body.total_courses).toBe('number')
    expect(body).toHaveProperty('total_enrollments')
    expect(body).toHaveProperty('total_revenue')
  })

  test('AD02: Health check returns all services', async () => {
    const res = await adminApi.get(`${ADMIN_BASE}/health`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    const services = ['database', 'ai', 'redis', 'minio', 'qdrant', 'celery']
    for (const svc of services) {
      expect(body).toHaveProperty(svc)
    }
  })

  test('AD03: List users with pagination', async () => {
    const res = await adminApi.get(`${ADMIN_BASE}/users?page=1&page_size=10`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.items)).toBeTruthy()
    expect(body.items.length).toBeGreaterThan(0)
    expect(body.page).toBe(1)
    expect(body.page_size).toBe(10)
  })

  test('AD04: Filter users by role', async () => {
    const res = await adminApi.get(`${ADMIN_BASE}/users?role=student`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    for (const user of body.items) {
      expect(user.role).toBe('student')
    }
  })

  test('AD05: Create user as admin', async () => {
    const ts = Date.now()
    const res = await adminApi.post(`${ADMIN_BASE}/users`, {
      data: { email: `admin_created_${ts}@test.com`, password: 'TestPass123!', full_name: 'Admin Created', role: 'lecturer' }
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.email).toContain('admin_created_')
    expect(body.role).toBe('lecturer')
  })

  test('AD06: Update user (deactivate)', async () => {
    const ts = Date.now()
    const createRes = await adminApi.post(`${ADMIN_BASE}/users`, {
      data: { email: `deactivate_${ts}@test.com`, password: 'TestPass123!', full_name: 'To Deactivate', role: 'student' }
    })
    if (!createRes.ok()) { test.skip(); return }
    const userId = (await createRes.json()).id

    const res = await adminApi.put(`${ADMIN_BASE}/users/${userId}`, {
      data: { is_active: false }
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.is_active).toBe(false)
  })

  test('AD07: Reactivate user', async () => {
    const ts = Date.now()
    const createRes = await adminApi.post(`${ADMIN_BASE}/users`, {
      data: { email: `reactivate_${ts}@test.com`, password: 'TestPass123!', full_name: 'To Reactivate', role: 'student' }
    })
    if (!createRes.ok()) { test.skip(); return }
    const userId = (await createRes.json()).id

    await adminApi.put(`${ADMIN_BASE}/users/${userId}`, { data: { is_active: false } })
    const res = await adminApi.put(`${ADMIN_BASE}/users/${userId}`, {
      data: { is_active: true }
    })
    expect(res.status()).toBe(200)
    expect((await res.json()).is_active).toBe(true)
  })

  test('AD08: Delete user', async () => {
    const ts = Date.now()
    const createRes = await adminApi.post(`${ADMIN_BASE}/users`, {
      data: { email: `delete_me_${ts}@test.com`, password: 'TestPass123!', full_name: 'To Delete', role: 'student' }
    })
    if (!createRes.ok()) { test.skip(); return }
    const userId = (await createRes.json()).id

    const res = await adminApi.delete(`${ADMIN_BASE}/users/${userId}`)
    expect(res.status()).toBe(204)
  })

  test('AD09: Self-delete blocked', async () => {
    const meRes = await adminApi.get('auth/me')
    const myId = (await meRes.json()).id
    const res = await adminApi.delete(`${ADMIN_BASE}/users/${myId}`)
    expect(res.status()).toBe(400)
  })

  test('AD10: List all courses', async () => {
    const res = await adminApi.get(`${ADMIN_BASE}/courses?page=1&page_size=10`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.items)).toBeTruthy()
    expect(body.total).toBeGreaterThanOrEqual(0)
  })

  test('AD11: Filter courses by status', async () => {
    const res = await adminApi.get(`${ADMIN_BASE}/courses?status=published`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    for (const course of body.items) {
      expect(course.status).toBe('published')
    }
  })

  test('AD12: Search courses', async () => {
    const res = await adminApi.get(`${ADMIN_BASE}/courses?search=E2E`)
    expect(res.status()).toBe(200)
  })

  test('AD13: Access control - student cannot access admin endpoints', async () => {
    const endpoints = ['/analytics', '/users', '/health']
    for (const ep of endpoints) {
      const res = await stuApi.get(`${ADMIN_BASE}${ep}`)
      expect(res.status()).toBe(403)
    }
  })

  test('AD14: Delete course (admin)', async () => {
    const ts = Date.now()
    const lectApi = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${td.lecturer.token}` }
    })
    const courseRes = await lectApi.post('courses', {
      data: { title: `Admin Delete Course ${ts}`, description: 'To be deleted by admin', status: 'draft' }
    })
    if (!courseRes.ok()) { test.skip(); return }
    const courseId = (await courseRes.json()).id

    const res = await adminApi.delete(`${ADMIN_BASE}/courses/${courseId}`)
    expect(res.status()).toBe(204)
  })
})
