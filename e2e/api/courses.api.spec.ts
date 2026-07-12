import { test, expect, request } from '@playwright/test'
import { createTestData, cleanupTestData } from '../helpers/fixtures'
import type { TestData } from '../helpers/fixtures'

const API_BASE = 'http://localhost:8000/api/v1/'

test.describe('Courses & Categories API', () => {
  test.describe.configure({ mode: 'serial' })
  let td: TestData

  test.beforeAll(async () => {
    td = await createTestData()
  })

  test.afterAll(async () => {
    await cleanupTestData(td)
  })

  test('C01: List published courses (pagination)', async () => {
    const stuApi = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${td.student.token}` }
    })
    const res = await stuApi.get('courses?page=1&page_size=10')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.items)).toBeTruthy()
    expect(typeof body.total).toBe('number')
    expect(body.page).toBe(1)
    expect(body.page_size).toBe(10)
  })

  test('C02: View course detail', async () => {
    const lectApiCtx = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${td.lecturer.token}` }
    })
    const res = await lectApiCtx.get(`courses/${td.course.id}`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(td.course.id)
    expect(body.title).toBeTruthy()
  })

  test('C03: View non-existent course returns 404', async () => {
    const lectApiCtx = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${td.lecturer.token}` }
    })
    const fakeId = '00000000-0000-0000-0000-000000000000'
    const res = await lectApiCtx.get(`courses/${fakeId}`)
    expect(res.status()).toBe(404)
  })

  test('C04: Lecturer creates course in draft', async () => {
    const lectApi = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${td.lecturer.token}` }
    })
    const res = await lectApi.post('courses', {
      data: { title: 'New Draft Course', description: 'Draft', price: 99000 }
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.status).toBe('draft')
    expect(body.price_vnd).toBe(99000)
  })

  test('C05: Create course missing title returns 422', async () => {
    const lectApi = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${td.lecturer.token}` }
    })
    const res = await lectApi.post('courses', { data: {} })
    expect(res.status()).toBe(422)
  })

  test('C06: Lecturer updates own course', async () => {
    const lectApi = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${td.lecturer.token}` }
    })
    const res = await lectApi.put(`courses/${td.course.id}`, {
      data: { description: 'Updated description' }
    })
    expect(res.status()).toBe(200)
  })

  test('C07: Student cannot update course', async () => {
    const stuApi = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${td.student.token}` }
    })
    const res = await stuApi.put(`courses/${td.course.id}`, {
      data: { title: 'Hacked!' }
    })
    expect(res.status()).toBe(403)
  })

  test('C08: Publish course', async () => {
    const lectApi = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${td.lecturer.token}` }
    })
    const res = await lectApi.post(`courses/${td.course.id}/publish`)
    expect(res.status()).toBe(200)
  })

  test('C09: Archive course', async () => {
    const lectApi = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${td.lecturer.token}` }
    })
    const res = await lectApi.post(`courses/${td.course.id}/archive`)
    expect(res.status()).toBe(200)
    const getRes = await lectApi.get(`courses/${td.course.id}`)
    expect((await getRes.json()).status).toBe('archived')
  })

  test('C10: Unarchive course', async () => {
    const lectApi = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${td.lecturer.token}` }
    })
    const res = await lectApi.post(`courses/${td.course.id}/unarchive`)
    expect(res.status()).toBe(200)
  })

  test('C11: Lecturer dashboard - my courses list', async () => {
    const lectApi = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${td.lecturer.token}` }
    })
    const res = await lectApi.get('courses/lecturer')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.items)).toBeTruthy()
  })

  test('C12: Lecturer dashboard stats', async () => {
    const lectApi = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${td.lecturer.token}` }
    })
    const res = await lectApi.get('courses/stats')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(typeof body.total_courses).toBe('number')
  })

  test('C13: List categories', async () => {
    const lectApiCtx = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${td.lecturer.token}` }
    })
    const res = await lectApiCtx.get('categories')
    expect(res.status()).toBe(200)
    expect(Array.isArray(await res.json())).toBeTruthy()
  })

  test('C14: Category tree', async () => {
    const lectApiCtx = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${td.lecturer.token}` }
    })
    const res = await lectApiCtx.get('categories/tree')
    expect(res.status()).toBe(200)
    expect(Array.isArray(await res.json())).toBeTruthy()
  })

  test('C15: Create category (admin)', async () => {
    const adminApi = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${td.admin.token}` }
    })
    const res = await adminApi.post('categories', {
      data: { name: 'Test Cat E2E', slug: `test-cat-e2e-${Date.now()}`, description: 'Test' }
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.name).toBe('Test Cat E2E')
  })

  test('C16: Student cannot create category', async () => {
    const stuApi = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${td.student.token}` }
    })
    const res = await stuApi.post('categories', {
      data: { name: 'Hacker Cat', slug: 'hacker-cat' }
    })
    expect(res.status()).toBe(403)
  })
})
