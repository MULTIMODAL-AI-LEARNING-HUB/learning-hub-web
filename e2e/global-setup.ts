import { request, FullConfig } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const API_BASE = process.env.E2E_API_BASE ?? 'http://localhost:8000/api/v1/'
const WEB_BASE = process.env.E2E_WEB_BASE ?? 'http://localhost:5173'

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

async function probeApiHealth(healthUrl: string): Promise<boolean> {
  const probeContext = await request.newContext()
  try {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await probeContext.get(healthUrl, { timeout: 5000 })
        if (res.ok() || res.status() < 500) {
          return true
        }
      } catch {
        // Retry with backoff if attempts remain
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 1000 * attempt))
        }
      }
    }
    return false
  } finally {
    await probeContext.dispose()
  }
}

async function globalSetup(config: FullConfig) {
  if (process.env.E2E_SKIP_GLOBAL_SETUP === 'true') {
    return
  }

  const stateDir = path.join(__dirname, '.auth')
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true })
  }

  const originUrl = new URL(API_BASE).origin
  const healthUrl = `${originUrl}/health`

  // Fail-soft health check probe: if the backend is not running, skip seeding instead of failing
  const isHealthy = await probeApiHealth(healthUrl)
  if (!isHealthy) {
    console.warn(
      `[e2e-setup] API server offline at ${healthUrl}. Skipping authentication credential seeding.`
    )
    return
  }

  const api = await request.newContext({ baseURL: API_BASE })

  try {
    for (const cred of CREDENTIALS) {
      try {
        // Register if not already exists
        await api.post('auth/register', {
          data: {
            email: cred.email,
            password: cred.password,
            full_name: `E2E ${cred.role}`,
            role: cred.role,
          },
          timeout: 5000,
        }).catch(() => null)

        // Login to obtain fresh token
        const loginRes = await api.post('auth/login', {
          data: { email: cred.email, password: cred.password },
          timeout: 5000,
        })

        if (loginRes.ok()) {
          const body = await loginRes.json()
          const t = body.token || body
          const accessToken = t.access_token || t.token
          if (accessToken) {
            const storageData = {
              cookies: [],
              origins: [
                {
                  origin: WEB_BASE,
                  localStorage: [
                    { name: 'token', value: accessToken },
                    { name: 'access_token', value: accessToken },
                    { name: 'user', value: JSON.stringify(body.user || {}) },
                  ],
                },
              ],
            }
            const storagePath = path.join(stateDir, `${cred.role}.json`)
            fs.writeFileSync(storagePath, JSON.stringify(storageData, null, 2))
          }
        }
      } catch (err) {
        console.warn(`[e2e-setup] Could not authenticate ${cred.role}:`, err)
      }
    }
  } finally {
    await api.dispose()
  }
}

export default globalSetup
