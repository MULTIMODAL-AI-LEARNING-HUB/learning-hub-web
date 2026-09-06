import { test, expect } from '@playwright/test'
import { createTestData } from '../helpers/fixtures'

const BASE_URL = process.env.E2E_WEB_BASE ?? 'https://learninghubs.tech'
const API_BASE = (process.env.E2E_API_BASE ?? 'https://learninghub-api-a89cebf8d45f.herokuapp.com/api/v1/').replace(/\/?$/, '/')

test.describe('Permission & Security UI', () => {
  test.describe.configure({ mode: 'serial' })

  let td: Awaited<ReturnType<typeof createTestData>>

  test.beforeAll(async () => {
    td = await createTestData()
  })

  async function setToken(page: any, token: string) {
    await page.addInitScript((t: string) => {
      localStorage.setItem('token', t)
      localStorage.setItem('access_token', t)
    }, token)
  }

  test('P1: Unauthenticated user redirected to login or welcome', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/app/student/dashboard`)
    await page.waitForTimeout(3000)
    const url = page.url()
    expect(url.includes('/login') || url.includes('/auth') || url.includes('/welcome')).toBeTruthy()
    await context.close()
  })

  test('P2: Student redirected from lecturer routes', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    if (!td?.student?.token) { test.skip(); await context.close(); return }
    await setToken(page, td.student.token)

    await page.goto(`${BASE_URL}/app/lecturer/dashboard`)
    await page.waitForTimeout(4000)
    const url = page.url()
    expect(url.includes('/lecturer')).not.toBeTruthy()
    await context.close()
  })

  test('P3: Student redirected from admin routes', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    if (!td?.student?.token) { test.skip(); await context.close(); return }
    await setToken(page, td.student.token)

    await page.goto(`${BASE_URL}/app/admin/dashboard`)
    await page.waitForTimeout(4000)
    const url = page.url()
    expect(url.includes('/admin')).not.toBeTruthy()
    await context.close()
  })

  test('P4: Lecturer redirected from admin routes', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    if (!td?.lecturer?.token) { test.skip(); await context.close(); return }
    await setToken(page, td.lecturer.token)

    await page.goto(`${BASE_URL}/app/admin/dashboard`)
    await page.waitForTimeout(4000)
    const url = page.url()
    expect(url.includes('/admin')).not.toBeTruthy()
    await context.close()
  })

  test('P5: Data protection - student cannot access another student chat', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    if (!td?.student?.token) { test.skip(); await context.close(); return }

    const res = await page.request.get(`${API_BASE}chat/sessions/00000000-0000-0000-0000-000000000000/messages`, {
      headers: { Authorization: `Bearer ${td.student.token}` }
    })
    expect([400, 404, 405]).toContain(res.status())
    await context.close()
  })
})
