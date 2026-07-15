import { request, FullConfig } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const API_BASE = 'http://localhost:8000/api/v1/'

interface TestCredential {
  email: string
  password: string
  role: string
}

const CREDENTIALS: TestCredential[] = [
  {
    email: process.env.E2E_ADMIN_EMAIL ?? 'admin@learninghub.com',
    password: process.env.E2E_ADMIN_PASSWORD ?? 'AdminPass123!',
    role: 'admin',
  },
  {
    email: process.env.E2E_LECTURER_EMAIL ?? 'e2e_lecturer@test.com',
    password: process.env.E2E_LECTURER_PASSWORD ?? 'TestPass123!',
    role: 'lecturer',
  },
  {
    email: process.env.E2E_STUDENT_EMAIL ?? 'e2e_student@test.com',
    password: process.env.E2E_STUDENT_PASSWORD ?? 'TestPass123!',
    role: 'student',
  },
]

async function globalSetup(config: FullConfig) {
  const projectRoot = path.resolve(__dirname, '..')
  const stateDir = path.join(projectRoot, '.auth')
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true })
  }

  const api = await request.newContext({ baseURL: API_BASE })

  for (const cred of CREDENTIALS) {
    try {
      await api.post('auth/register', {
        data: { email: cred.email, password: cred.password, full_name: `E2E ${cred.role}`, role: cred.role }
      })
    } catch {
      // Already exists
    }

    const loginRes = await api.post('auth/login', {
      data: { email: cred.email, password: cred.password }
    })
    if (loginRes.ok()) {
      const body = await loginRes.json()
      const t = body.token || body
      const storageData = {
        cookies: [],
        origins: [
          {
            origin: 'http://localhost:5173',
            localStorage: [
              { name: 'token', value: t.access_token },
              { name: 'access_token', value: t.access_token },
              { name: 'user', value: JSON.stringify(body.user || {}) }
            ]
          }
        ]
      }
      const storagePath = path.join(stateDir, `${cred.role}.json`)
      fs.writeFileSync(storagePath, JSON.stringify(storageData, null, 2))
    }
  }
}

export default globalSetup
