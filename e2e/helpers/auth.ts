import { request } from '@playwright/test'

const API_BASE = 'http://localhost:8000/api/v1'

export interface TestUser {
  id: string
  email: string
  full_name: string
  role: 'student' | 'lecturer' | 'admin'
  token: string
}

let cachedUsers: TestUser[] | null = null

export async function getTestUsers(): Promise<TestUser[]> {
  if (cachedUsers) return cachedUsers

  const lecturerRes = await request.post(`${API_BASE}/auth/register`, {
    data: {
        email: 'e2e_lecturer@test.com',
        password: 'TestPass123!',
        full_name: 'E2E Lecturer',
        role: 'lecturer'
    }
  }).catch(() => null)

  const studentRes = await request.post(`${API_BASE}/auth/register`, {
    data: {
        email: 'e2e_student@test.com',
        password: 'TestPass123!',
        full_name: 'E2E Student',
        role: 'student'
    }
  }).catch(() => null)

  const lecturerLogin = await request.post(`${API_BASE}/auth/login`, {
    data: { email: 'e2e_lecturer@test.com', password: 'TestPass123!' }
  })
  const studentLogin = await request.post(`${API_BASE}/auth/login`, {
    data: { email: 'e2e_student@test.com', password: 'TestPass123!' }
  })

  const lecturerToken = lecturerLogin.ok() ? (await lecturerLogin.json()).access_token : ''
  const studentToken = studentLogin.ok() ? (await studentLogin.json()).access_token : ''

  cachedUsers = [
    {
      id: '',
      email: 'e2e_lecturer@test.com',
      full_name: 'E2E Lecturer',
      role: 'lecturer',
      token: lecturerToken
    },
    {
      id: '',
      email: 'e2e_student@test.com',
      full_name: 'E2E Student',
      role: 'student',
      token: studentToken
    }
  ]

  return cachedUsers
}

export async function getApiClient(token: string) {
  const api = await request.newContext({
    baseURL: API_BASE,
    extraHTTPHeaders: {
      Authorization: `Bearer ${token}`
    }
  })
  return api
}

export async function getInternalApiClient() {
  const api = await request.newContext({
    baseURL: 'http://localhost:8001'
  })
  return api
}