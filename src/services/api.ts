import axios from 'axios'

let API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

// Auto-append /api/v1 if the VITE_API_URL is an absolute domain but misses the prefix
if (API_BASE.startsWith('http') && !API_BASE.includes('/api/v1')) {
  API_BASE = API_BASE.replace(/\/+$/, '') + '/api/v1'
}

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string | null) => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

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
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken })
          const { access_token, refresh_token } = res.data
          localStorage.setItem('access_token', access_token)
          if (refresh_token) localStorage.setItem('refresh_token', refresh_token)
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          processQueue(null, access_token)
          return api(originalRequest)
        } catch (err) {
          processQueue(err, null)
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          const { router } = await import('../routes')
          router.navigate('/login')
          return Promise.reject(err)
        } finally {
          isRefreshing = false
        }
      }
    }
    if (error.response?.status === 429) {
      const msg = error.response.data?.message || 'Too many requests. Please try again later.'
      try {
        const { useAppStore } = await import('../stores/appStore')
        useAppStore.getState().toasts.add({ type: 'error', title: 'Rate Limited', message: msg })
      } catch (err) {
        console.warn('Failed to display rate limit toast:', err)
      }
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

export interface Category {
  id: string
  name: string
  description: string | null
  icon: string | null
  course_count: number
}

export interface CourseMaterial {
  id: string
  title: string
  material_type: 'pdf' | 'docx' | 'image' | 'video' | 'url'
  file_url: string | null
  external_url: string | null
  file_size: number | null
  duration_seconds: number | null
  page_count: number | null
  is_preview: boolean
  order_index: number
}

export interface Course {
  id: string
  title: string
  description: string
  thumbnail_url: string | null
  price: number
  category_id: string
  category?: Category
  lecturer_id: string
  lecturer?: { id: string; full_name: string | null; avatar_url: string | null }
  status: 'draft' | 'published' | 'archived'
  enrollment_count: number
  materials: CourseMaterial[]
  created_at: string
  updated_at: string
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  course?: Course
  enrolled_at: string
  completed_at: string | null
  progress_percent: number
  status: 'active' | 'completed' | 'cancelled'
  payment_id: string | null
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
}

export interface MaterialProgress {
  id: string
  enrollment_id: string
  material_id: string
  material?: CourseMaterial
  completed: boolean
  progress_percent: number
  completed_at: string | null
  last_position_seconds: number | null
  last_position_percent: number | null
}

export const categoriesApi = {
  list: () => api.get<Category[]>('/categories'),
  get: (id: string) => api.get<Category>(`/categories/${id}`),
}

export const coursesApi = {
  list: (params?: { category_id?: string; status?: string; page?: number; page_size?: number }) =>
    api.get<{ items: Course[]; total: number; page: number; page_size: number }>('/courses', { params }),
  get: (id: string) => api.get<Course>(`/courses/${id}`),
  create: (data: { title: string; description: string; price: number; category_id: string; thumbnail_url?: string }) =>
    api.post<Course>('/courses', data),
  update: (id: string, data: Partial<Course>) => api.put<Course>(`/courses/${id}`, data),
  delete: (id: string) => api.delete(`/courses/${id}`),
  publish: (id: string) => api.post<Course>(`/courses/${id}/publish`, {}),
  archive: (id: string) => api.post<Course>(`/courses/${id}/archive`, {}),
  getMaterials: (id: string) => api.get<CourseMaterial[]>(`/courses/${id}/materials`),
  addMaterial: (id: string, data: FormData) =>
    api.post<CourseMaterial>(`/courses/${id}/materials`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateMaterial: (courseId: string, materialId: string, data: Partial<CourseMaterial>) =>
    api.put<CourseMaterial>(`/courses/${courseId}/materials/${materialId}`, data),
  deleteMaterial: (courseId: string, materialId: string) =>
    api.delete(`/courses/${courseId}/materials/${materialId}`),
  reorderMaterials: (id: string, materialIds: string[]) =>
    api.put<CourseMaterial[]>(`/courses/${id}/materials/reorder`, { material_ids: materialIds }),
}

export const enrollmentsApi = {
  list: (params?: { status?: string; page?: number; page_size?: number }) =>
    api.get<{ items: Enrollment[]; total: number }>('/enrollments', { params }),
  get: (id: string) => api.get<Enrollment>(`/enrollments/${id}`),
  enroll: (courseId: string, paymentMethod?: 'vnpay' | 'momo') =>
    api.post<{ enrollment: Enrollment; payment_url?: string }>('/enrollments', {
      course_id: courseId,
      payment_method: paymentMethod,
    }),
  cancel: (id: string) => api.delete(`/enrollments/${id}`),
  getProgress: (id: string) => api.get<{ progress_percent: number; completed_materials: string[] }>(`/enrollments/${id}/progress`),
  updateProgress: (enrollmentId: string, materialId: string, data: {
    completed?: boolean
    progress_percent?: number
    last_position_seconds?: number
    last_position_percent?: number
  }) => api.put<MaterialProgress>(`/enrollments/${enrollmentId}/progress/${materialId}`, data),
}

export const paymentsApi = {
  getStatus: (paymentId: string) => api.get<{ status: string; enrollment_id?: string }>(`/payments/${paymentId}/status`),
  createVNPayUrl: (enrollmentId: string, amount: number) =>
    api.post<{ payment_url: string }>('/payments/vnpay/create', { enrollment_id: enrollmentId, amount }),
  createMoMoUrl: (enrollmentId: string, amount: number) =>
    api.post<{ payment_url: string }>('/payments/momo/create', { enrollment_id: enrollmentId, amount }),
}

export const authApi = {
  register: (data: { email: string; password: string; full_name?: string }) =>
    api.post<AuthResponse>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),
  refresh: (refresh_token: string) =>
    api.post<{ access_token: string; refresh_token: string }>('/auth/refresh', { refresh_token }),
  me: () => api.get<AuthUser>('/auth/me'),
  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>('/auth/reset-password', { token, password }),
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
