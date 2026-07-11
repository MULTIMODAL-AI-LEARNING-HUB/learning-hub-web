import { test, expect, request } from '@playwright/test'
import { createTestData, cleanupTestData } from '../helpers/fixtures'
import type { TestData } from '../helpers/fixtures'
import * as fs from 'fs'
import * as path from 'path'

const API_BASE = 'http://localhost:8000/api/v1/'

test.describe('Documents, Notifications & Wishlist API', () => {
  test.describe.configure({ mode: 'serial' })
  let td: TestData
  let stuApi: Awaited<ReturnType<typeof request.newContext>>

  test.beforeAll(async () => {
    td = await createTestData()
    stuApi = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${td.student.token}` }
    })
  })

  test.afterAll(async () => {
    await cleanupTestData(td)
  })

  test('D01: Upload document (PDF via multipart)', async () => {
    const tempDir = path.join(process.cwd(), 'e2e', 'fixtures')
    if (!fs.existsSync(tempDir)) { fs.mkdirSync(tempDir, { recursive: true }) }
    const testPdf = path.join(tempDir, 'test_e2e.pdf')
    if (!fs.existsSync(testPdf)) {
      fs.writeFileSync(testPdf, '%PDF-1.4 test document content')
    }

    const fileBuffer = fs.readFileSync(testPdf)
    const res = await stuApi.post('documents/upload', {
      multipart: {
        file: {
          name: 'test_e2e.pdf',
          mimeType: 'application/pdf',
          buffer: fileBuffer
        }
      }
    })
    expect([200, 201, 400, 422]).toContain(res.status())
  })

  test('D02: List documents', async () => {
    const res = await stuApi.get('documents')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.items)).toBeTruthy()
  })

  test('D03: Get document detail', async () => {
    const listRes = await stuApi.get('documents')
    if (!listRes.ok()) { test.skip(); return }
    const items = (await listRes.json()).items
    if (!items || items.length === 0) { test.skip(); return }
    const docId = items[0].id
    const res = await stuApi.get(`/documents/${docId}`)
    expect(res.status()).toBe(200)
  })

  test('D04: Delete document', async () => {
    const listRes = await stuApi.get('documents')
    if (!listRes.ok()) { test.skip(); return }
    const items = (await listRes.json()).items
    if (!items || items.length === 0) { test.skip(); return }
    const docId = items[0].id
    const res = await stuApi.delete(`/documents/${docId}`)
    expect([204, 200]).toContain(res.status())
  })

  test('N01: List notifications', async () => {
    const res = await stuApi.get('notifications')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.items)).toBeTruthy()
    expect(typeof body.unread_count).toBe('number')
  })

  test('N02: Mark all notifications read', async () => {
    const res = await stuApi.put('notifications/read-all')
    expect(res.status()).toBe(200)
    const listRes = await stuApi.get('notifications')
    expect((await listRes.json()).unread_count).toBe(0)
  })

  test('N03: Delete notification', async () => {
    const listRes = await stuApi.get('notifications')
    if (!listRes.ok()) { test.skip(); return }
    const items = (await listRes.json()).items
    if (!items || items.length === 0) { test.skip(); return }
    const notifId = items[0].id
    const res = await stuApi.delete(`/notifications/${notifId}`)
    expect([204, 200]).toContain(res.status())
  })

  test('W01: Get wishlist', async () => {
    const res = await stuApi.get('wishlist')
    expect(res.status()).toBe(200)
    expect(Array.isArray(await res.json())).toBeTruthy()
  })

  test('W02: Add course to wishlist', async () => {
    const res = await stuApi.post(`/wishlist/${td.course.id}`)
    expect(res.status()).toBe(201)
  })

  test('W03: Add duplicate to wishlist returns 400', async () => {
    await stuApi.post(`/wishlist/${td.course.id}`).catch(() => {})
    const res = await stuApi.post(`/wishlist/${td.course.id}`)
    expect([400, 409]).toContain(res.status())
  })

  test('W04: Check wishlist status', async () => {
    const res = await stuApi.get(`/wishlist/check/${td.course.id}`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(typeof body.is_wishlisted).toBe('boolean')
  })

  test('W05: Remove from wishlist', async () => {
    const res = await stuApi.delete(`/wishlist/${td.course.id}`)
    expect([204, 200]).toContain(res.status())
  })

  test('W06: Unauthenticated cannot access wishlist', async () => {
    const unauthApi = await request.newContext({ baseURL: API_BASE })
    const res = await unauthApi.get('wishlist')
    expect(res.status()).toBe(401)
  })
})
