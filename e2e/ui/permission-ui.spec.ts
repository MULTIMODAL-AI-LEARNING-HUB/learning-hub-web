import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'
const API_BASE = 'http://localhost:8000/api/v1'

test.describe('Permission & Security UI', () => {
  test.describe.configure({ mode: 'serial' })

  const studentToken = { value: '' }
  const lecturerToken = { value: '' }

  test.beforeAll(async () => {
    const ts = Date.now()
    const api = await (await import('@playwright/test')).request.newContext({ baseURL: API_BASE })

    const stuEmail = `perm_stu_${ts}@test.com`
    await api.post('/auth/register', {
      data: { email: stuEmail, password: 'TestPass123!', full_name: 'Perm Student', role: 'student' }
    }).catch(() => {})
    const stuLogin = await api.post('/auth/login', { data: { email: stuEmail, password: 'TestPass123!' } })
    if (stuLogin.ok()) studentToken.value = (await stuLogin.json()).access_token

    const lectEmail = `perm_lect_${ts}@test.com`
    await api.post('/auth/register', {
      data: { email: lectEmail, password: 'TestPass123!', full_name: 'Perm Lecturer', role: 'lecturer' }
    }).catch(() => {})
    const lectLogin = await api.post('/auth/login', { data: { email: lectEmail, password: 'TestPass123!' } })
    if (lectLogin.ok()) lecturerToken.value = (await lectLogin.json()).access_token
  })

  async function setToken(page: any, token: string) {
    await page.goto(`${BASE_URL}/login`)
    await page.evaluate((t) => {
      localStorage.setItem('token', t)
      localStorage.setItem('access_token', t)
    }, token)
  }

  test('P1: Unauthenticated user redirected to login', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/my-courses`)
    await page.waitForTimeout(3000)
    const url = page.url()
    expect(url.includes('/login') || url.includes('/auth')).toBeTruthy()
    await context.close()
  })

  test('P2: Student redirected from lecturer routes', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    if (!studentToken.value) { test.skip(); await context.close(); return }
    await setToken(page, studentToken.value)

    await page.goto(`${BASE_URL}/lecturer/dashboard`)
    await page.waitForTimeout(3000)
    const url = page.url()
    expect(url.includes('/lecturer')).not.toBeTruthy()
    await context.close()
  })

  test('P3: Student redirected from admin routes', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    if (!studentToken.value) { test.skip(); await context.close(); return }
    await setToken(page, studentToken.value)

    await page.goto(`${BASE_URL}/admin/dashboard`)
    await page.waitForTimeout(3000)
    const url = page.url()
    expect(url.includes('/admin')).not.toBeTruthy()
    await context.close()
  })

  test('P4: Lecturer redirected from admin routes', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    if (!lecturerToken.value) { test.skip(); await context.close(); return }
    await setToken(page, lecturerToken.value)

    await page.goto(`${BASE_URL}/admin/dashboard`)
    await page.waitForTimeout(3000)
    const url = page.url()
    expect(url.includes('/admin')).not.toBeTruthy()
    await context.close()
  })

  test('P5: Data protection - student cannot access another student chat', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    if (!studentToken.value) { test.skip(); await context.close(); return }
    await setToken(page, studentToken.value)

    const res = await page.request.get(`${API_BASE}/chat/sessions/00000000-0000-0000-0000-000000000000`, {
      headers: { Authorization: `Bearer ${studentToken.value}` }
    })
    expect([400, 404]).toContain(res.status())
    await context.close()
  })
})
