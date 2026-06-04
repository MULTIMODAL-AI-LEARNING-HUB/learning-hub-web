import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken })
          const { access_token, refresh_token } = res.data
          localStorage.setItem('access_token', access_token)
          if (refresh_token) localStorage.setItem('refresh_token', refresh_token)
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          const { router } = await import('../routes')
          router.navigate('/login')
        }
      }
    }
    if (error.response?.status === 429) {
      const msg = error.response.data?.message || 'Too many requests. Please try again later.'
      try {
        const { useAppStore } = await import('../stores/appStore')
        useAppStore.getState().toasts.add({ type: 'error', title: 'Rate Limited', message: msg })
      } catch {}
    }
    return Promise.reject(error)
  }
)

export interface AuthUser {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string
  created_at: string | null
  quota?: {
    storage_limit_mb: number
    storage_used_mb: number
    video_limit: number
    video_used: number
    token_limit: number
    token_used: number
  }
}

export interface AuthResponse {
  user: AuthUser
  token: { access_token: string; token_type: string; refresh_token: string | null }
}

export interface DocumentItem {
  id: string
  file_name: string
  file_type: string
  file_url: string
  file_size: number | null
  status: string
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface ChatSession {
  id: string
  title: string | null
  document_id: string | null
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  role: string
  content: string
  citations: Array<{ document_id: string; chunk_id: string; page_number: number | null; text: string }> | null
  created_at: string
}

export interface Citation {
  document_id: string
  chunk_id: string
  page_number: number | null
  text: string
}

export interface ChatAskResponse {
  answer: string
  citations: Citation[]
  token_usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
}

export const authApi = {
  register: (data: { email: string; password: string; full_name?: string }) =>
    api.post<AuthResponse>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),
  refresh: (refresh_token: string) =>
    api.post<{ access_token: string; refresh_token: string }>('/auth/refresh', { refresh_token }),
  me: () => api.get<AuthUser>('/auth/me'),
}

export const documentsApi = {
  list: (page = 1, pageSize = 20) =>
    api.get<{ items: DocumentItem[]; total: number; page: number; page_size: number }>(
      '/documents', { params: { page, page_size: pageSize } }
    ),
  get: (id: string) => api.get<DocumentItem>(`/documents/${id}`),
  upload: (file: File, title?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (title) formData.append('title', title)
    return api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  delete: (id: string) => api.delete(`/documents/${id}`),
}

export const chatApi = {
  createSession: (data?: { document_id?: string; title?: string }) =>
    api.post<ChatSession>('/chat/sessions', data),
  listSessions: (page = 1, pageSize = 20) =>
    api.get<{ items: ChatSession[]; total: number }>('/chat/sessions', {
      params: { page, page_size: pageSize },
    }),
  deleteSession: (id: string) => api.delete(`/chat/sessions/${id}`),
  ask: (data: { session_id: string; query: string; document_ids?: string[] }) =>
    api.post<ChatAskResponse>('/chat/ask', data),
  listMessages: (sessionId: string, page = 1, pageSize = 50) =>
    api.get<{ items: ChatMessage[]; total: number }>(`/chat/sessions/${sessionId}/messages`, {
      params: { page, page_size: pageSize },
    }),
}

export const studyApi = {
  generateQuiz: (data: { document_id: string; quiz_type?: string; question_count?: number }) =>
    api.post('/study/quiz/generate', data),
  getQuizJob: (jobId: string) => api.get(`/study/quiz/job/${jobId}`),
  submitQuiz: (quizId: string, answers: Array<{ question_id: string; answer: string }>) =>
    api.post(`/study/quiz/${quizId}/submit`, { answers }),
  generateFlashcards: (data: { document_id: string; set_name: string; count?: number }) =>
    api.post('/study/flashcards/generate', data),
  getFlashcard: (id: string) => api.get(`/study/flashcards/${id}`),
  submitEssay: (data: { document_id: string; essay_text: string }) =>
    api.post('/study/essay/submit', data),
}

export const adminApi = {
  listUsers: (page = 1, pageSize = 20) =>
    api.get('/admin/users', { params: { page, page_size: pageSize } }),
  analytics: () => api.get('/admin/analytics'),
  health: () => api.get('/admin/health'),
}

export default api
