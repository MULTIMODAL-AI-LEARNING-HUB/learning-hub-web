import { test, expect, request } from '@playwright/test'

const API_BASE = 'http://localhost:8000/api/v1/'

test.describe('Auth API', () => {
  test.describe.configure({ mode: 'serial' })
  const ts = Date.now()

  test('A01: Register student successfully', async () => {
    const api = await request.newContext({ baseURL: API_BASE })
    const email = `e2e_reg_stu_${ts}@test.com`
    const res = await api.post('auth/register', {
      data: { email, password: 'TestPass123!', full_name: 'Test Student', role: 'student' }
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.user.email).toBe(email)
    expect(body.user.role).toBe('student')
  })

  test('A02: Register with duplicate email returns 409', async () => {
    const api = await request.newContext({ baseURL: API_BASE })
    const res = await api.post('auth/register', {
      data: { email: 'existing@test.com', password: 'TestPass123!', full_name: 'Exists', role: 'student' }
    })
    await api.post('auth/register', {
      data: { email: 'existing@test.com', password: 'TestPass123!', full_name: 'Exists', role: 'student' }
    }).catch(() => {})
    const dupRes = await api.post('auth/register', {
      data: { email: 'existing@test.com', password: 'TestPass123!', full_name: 'Exists', role: 'student' }
    })
    expect(dupRes.status()).toBe(409)
  })

  test('A03: Register with weak password returns 422', async () => {
    const api = await request.newContext({ baseURL: API_BASE })
    const res = await api.post('auth/register', {
      data: { email: `e2e_weak_${ts}@test.com`, password: '12', full_name: 'Weak', role: 'student' }
    })
    expect(res.status()).toBe(422)
  })

  test('A04: Login successfully returns JWT tokens', async () => {
    const api = await request.newContext({ baseURL: API_BASE })
    const email = `e2e_login_${ts}@test.com`
    await api.post('auth/register', {
      data: { email, password: 'TestPass123!', full_name: 'Login Test', role: 'student' }
    }).catch(() => {})
    const res = await api.post('auth/login', {
      data: { email, password: 'TestPass123!' }
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.token.access_token).toBeTruthy()
    expect(body.token.refresh_token).toBeTruthy()
    expect(body.user.email).toBe(email)
  })

  test('A05: Login with wrong password returns 401', async () => {
    const api = await request.newContext({ baseURL: API_BASE })
    const res = await api.post('auth/login', {
      data: { email: 'admin@learninghub.com', password: 'wrongpassword123' }
    })
    expect(res.status()).toBe(401)
  })

  test('A06: Refresh token works', async () => {
    const api = await request.newContext({ baseURL: API_BASE })
    const email = `e2e_refresh_${ts}@test.com`
    await api.post('auth/register', {
      data: { email, password: 'TestPass123!', full_name: 'Refresh', role: 'student' }
    }).catch(() => {})
    const loginRes = await api.post('auth/login', {
      data: { email, password: 'TestPass123!' }
    })
    const refreshToken = (await loginRes.json()).token.refresh_token

    const refreshRes = await api.post('auth/refresh', {
      data: { refresh_token: refreshToken }
    })
    expect(refreshRes.status()).toBe(200)
    const body = await refreshRes.json()
    expect(body.access_token).toBeTruthy()
  })

  test('A07: Get own profile', async () => {
    const api = await request.newContext({ baseURL: API_BASE })
    const email = `e2e_profile_${ts}@test.com`
    await api.post('auth/register', {
      data: { email, password: 'TestPass123!', full_name: 'Profile Test', role: 'student' }
    }).catch(() => {})
    const loginRes = await api.post('auth/login', {
      data: { email, password: 'TestPass123!' }
    })
    const token = (await loginRes.json()).token.access_token
    const authApi = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${token}` }
    })

    const res = await authApi.get('auth/me')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.email).toBe(email)
    expect(body.full_name).toBe('Profile Test')
  })

  test('A08: Update profile', async () => {
    const api = await request.newContext({ baseURL: API_BASE })
    const email = `e2e_upd_${ts}@test.com`
    await api.post('auth/register', {
      data: { email, password: 'TestPass123!', full_name: 'Old Name', role: 'student' }
    }).catch(() => {})
    const loginRes = await api.post('auth/login', {
      data: { email, password: 'TestPass123!' }
    })
    const token = (await loginRes.json()).token.access_token
    const authApi = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${token}` }
    })

    const res = await authApi.put('auth/me', {
      data: { full_name: 'New Name' }
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.full_name).toBe('New Name')
  })

  test('A09: Forgot password endpoint works', async () => {
    const api = await request.newContext({ baseURL: API_BASE })
    const res = await api.post('auth/forgot-password', {
      data: { email: `e2e_forgot_${ts}@test.com` }
    })
    expect([200, 202, 404]).toContain(res.status())
  })

  test('A10: Access without auth returns 401', async () => {
    const api = await request.newContext({ baseURL: API_BASE })
    const res = await api.get('auth/me')
    expect(res.status()).toBe(401)
  })
})
