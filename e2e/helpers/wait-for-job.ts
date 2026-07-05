import { request } from '@playwright/test'

const API_BASE = 'http://localhost:8000/api/v1'

export interface PollOptions {
  intervalMs?: number
  timeoutMs?: number
}

export async function pollQuizJob(
  jobId: string,
  token: string,
  options: PollOptions = {}
): Promise<{ status: string; questions?: unknown[]; error?: string }> {
  const { intervalMs = 2000, timeoutMs = 120000 } = options
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const res = await request.get(`${API_BASE}/study/quiz/job/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!res.ok()) {
      throw new Error(`Poll failed: ${res.status()} ${await res.text()}`)
    }

    const data = await res.json()

    if (data.status === 'ready') {
      return { status: 'ready', questions: data.questions }
    }
    if (data.status === 'failed') {
      return { status: 'failed', error: data.error || 'Quiz generation failed' }
    }

    await new Promise(r => setTimeout(r, intervalMs))
  }

  return { status: 'timeout' }
}