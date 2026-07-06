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
  course_id: string | null
  lesson_id: string | null
  context_type: string
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
  file_name: string | null
  title: string | null
  material_type: string
  file_type: string
  file_url: string | null
  external_url: string | null
  file_size: number | null
  status: string
  is_indexed: boolean
  file_metadata: Record<string, unknown> | null
  course_id: string
  lecturer_id: string
  created_at: string
  updated_at: string
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
  level: string
  language: string
  requirements: string | null
  learning_outcomes: string | null
  tags: string | null
  view_count: number
  rating_avg: number
  rating_count: number
  enrollment_count: number
  materials: CourseMaterial[]
  created_at: string
  updated_at: string
}

// ============ NEW LMS TYPES ============

export interface Section {
  id: string
  course_id: string
  title: string
  description: string | null
  order_index: number
  created_at: string
  updated_at: string
  lesson_count?: number
  lessons?: Lesson[]
}

export interface Lesson {
  id: string
  section_id: string
  title: string
  description: string | null
  type: 'VIDEO' | 'ARTICLE' | 'QUIZ' | 'ASSIGNMENT'
  video_url: string | null
  video_duration: number | null
  content: string | null
  order_index: number
  is_preview: boolean
  is_active: boolean
  has_quiz: boolean
  has_assignment: boolean
  attachment_count: number
  created_at: string
  updated_at: string
  quiz?: Quiz
  assignment?: Assignment
  attachments?: Attachment[]
}

export interface Attachment {
  id: string
  lesson_id: string
  file_name: string
  file_url: string
  file_type: string | null
  file_size: number | null
  uploaded_at: string
}

export interface Quiz {
  id: string
  lesson_id: string
  title: string
  description: string | null
  passing_score: number
  duration_mins: number | null
  max_attempts: number
  is_active: boolean
  question_count?: number
  created_at: string
  updated_at: string
  questions?: Question[]
}

export interface Question {
  id: string
  quiz_id: string
  question_text: string
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK'
  points: number
  explanation: string | null
  order_index: number
  created_at: string
  answers?: Answer[]
}

export interface Answer {
  id: string
  question_id: string
  answer_text: string
  is_correct: boolean
  order_index: number
  created_at: string
}

export interface QuizAttempt {
  id: string
  enrollment_id: string
  quiz_id: string
  attempt_number: number
  score: number | null
  max_score: number | null
  passed: boolean | null
  started_at: string
  completed_at: string | null
}

export interface Assignment {
  id: string
  lesson_id: string
  title: string
  description: string | null
  instructions: string | null
  deadline: string | null
  max_score: number
  allow_resubmit: boolean
  max_resubmits: number
  is_active: boolean
  submission_count?: number
  created_at: string
  updated_at: string
}

export interface AssignmentSubmission {
  id: string
  assignment_id: string
  student_id: string
  student_name: string | null
  submission_text: string | null
  attachments: { file_name: string; file_url: string }[] | null
  score: number | null
  feedback: string | null
  submitted_at: string
  graded_at: string | null
  is_late: boolean
}

export interface Discussion {
  id: string
  lesson_id: string
  user_id: string
  user_name: string | null
  user_avatar: string | null
  parent_id: string | null
  content: string
  is_pinned: boolean
  is_answer: boolean
  upvotes: number
  reply_count: number
  created_at: string
  updated_at: string
  replies: Discussion[]
}

export interface NotificationItem {
  id: string
  user_id: string
  title: string
  detail: string | null
  type: string
  related_id: string | null
  related_type: string | null
  is_read: boolean
  created_at: string
}

export interface WishlistItem {
  id: string
  user_id: string
  course_id: string
  course_title: string | null
  course_thumbnail: string | null
  course_price: number | null
  created_at: string
}

export interface Announcement {
  id: string
  course_id: string
  lecturer_id: string
  lecturer_name: string | null
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  enrollment_id: string
  rating: number
  comment: string | null
  lecturer_reply: string | null
  replied_at: string | null
  created_at: string
  student_name: string | null
  course_title: string | null
}

export interface PaymentIntentResponse {
  payment_url: string
  transaction_id: string
  amount_vnd: number
}

export interface Enrollment {
  id: string
  user_id: string
  student_id?: string
  course_id: string
  course?: Course
  enrolled_at: string
  completed_at: string | null
  progress_percent: number
  status: 'active' | 'completed' | 'cancelled'
  payment_id: string | null
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_amount_vnd?: number
  payment_method?: string | null
  course_title?: string | null
  course_thumbnail?: string | null
  lecturer_name?: string | null
  student_name?: string | null
  student_email?: string | null
  student_avatar_url?: string | null
}

export interface MaterialProgressResponse {
  id: string
  enrollment_id: string
  material_id: string
  completion_percent: number
  completed: boolean
  last_position: Record<string, unknown> | null
  completed_at: string | null
}

export interface MaterialProgress {
  id: string
  enrollment_id: string
  material_id: string
  completion_percent: number
  completed: boolean
  last_position: Record<string, unknown> | null
  completed_at: string | null
}

export interface DashboardCourseProgress {
  id: string
  course_id: string
  course_title: string
  course_thumbnail: string | null
  lecturer_name: string | null
  enrolled_at: string
  completion_percent: number
  total_materials: number
  completed_materials: number
}

export interface DashboardStats {
  total_enrolled: number
  total_materials: number
  total_completed: number
  avg_progress: number
}

export interface DashboardActivity {
  id: string
  activity_type: string
  title: string
  score: number | null
  created_at: string
}

export interface DashboardResponse {
  courses: DashboardCourseProgress[]
  stats: DashboardStats
  recent_activity: DashboardActivity[]
}

export const categoriesApi = {
  list: () => api.get<Category[]>('/categories'),
  get: (id: string) => api.get<Category>(`/categories/${id}`),
  getTree: () => api.get<Category[]>(`/categories/tree`),
  create: (data: { name: string; slug: string; description?: string; icon?: string; parent_id?: string | null }) =>
    api.post<Category>('/categories', data),
  update: (id: string, data: { name?: string; description?: string; icon?: string }) =>
    api.put<Category>(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
}

export const coursesApi = {
  list: (params?: { category_id?: string; status?: string; page?: number; page_size?: number }) =>
    api.get<{ items: Course[]; total: number; page: number; page_size: number }>('/courses', { params }),
  get: (id: string) => api.get<Course>(`/courses/${id}`),
  create: (data: { title: string; description: string; price: number; category_id: string; thumbnail_url?: string }) =>
    api.post<Course>('/courses', data),
  listMyCourses: (params?: { page?: number; page_size?: number }) =>
    api.get<{ items: Course[]; total: number; page: number; page_size: number }>('/courses/lecturer', { params }),
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
  // Lecturer dashboard
  getStats: () => api.get<{
    total_courses: number
    total_students: number
    total_revenue: number
    avg_rating: number
    recent_enrollments: { date: string; count: number }[]
    course_stats: { course_id: string; title: string; enrollment_count: number; revenue: number; rating_avg: number }[]
  }>('/courses/stats'),
  getReviews: (courseId: string, page = 1, pageSize = 20) =>
    api.get<{ items: Review[]; total: number }>(`/courses/${courseId}/reviews`, { params: { page, page_size: pageSize } }),
  createReview: (courseId: string, data: { rating: number; comment?: string }) =>
    api.post<Review>(`/courses/${courseId}/reviews`, data),
  getMyReview: (courseId: string) =>
    api.get<Review>(`/courses/${courseId}/reviews/my-review`),
  updateMyReview: (courseId: string, data: { rating?: number; comment?: string }) =>
    api.put<Review>(`/courses/${courseId}/reviews/my-review`, data),
  replyReview: (courseId: string, reviewId: string, reply: string) =>
    api.post<Review>(`/courses/${courseId}/reviews/${reviewId}/reply`, { reply }),
  getDiscussionStats: (courseId: string) =>
    api.get<{ total_discussions: number; unanswered: number }>(`/courses/${courseId}/discussions/stats`),
  getEnrolledStudents: (courseId: string) =>
    api.get<{ items: Enrollment[]; total: number }>(`/courses/${courseId}/enrolled-students`),
}

// ============ NEW LECTURER API ENDPOINTS ============

export const sectionsApi = {
  list: (courseId: string) => api.get<Section[]>(`/courses/${courseId}/sections`),
  get: (courseId: string, sectionId: string) => api.get<Section>(`/courses/${courseId}/sections/${sectionId}`),
  create: (courseId: string, data: { title: string; description?: string; order_index?: number }) =>
    api.post<Section>(`/courses/${courseId}/sections`, data),
  update: (courseId: string, sectionId: string, data: { title?: string; description?: string }) =>
    api.put<Section>(`/courses/${courseId}/sections/${sectionId}`, data),
  delete: (courseId: string, sectionId: string) => api.delete(`/courses/${courseId}/sections/${sectionId}`),
  reorder: (courseId: string, sectionIds: string[]) =>
    api.put<Section[]>(`/courses/${courseId}/sections/reorder`, { section_ids: sectionIds }),
}

export const lessonsApi = {
  list: (sectionId: string) => api.get<Lesson[]>(`/sections/${sectionId}/lessons`),
  get: (sectionId: string, lessonId: string) => api.get<Lesson>(`/sections/${sectionId}/lessons/${lessonId}`),
  create: (sectionId: string, data: {
    title: string
    description?: string
    type: 'VIDEO' | 'ARTICLE' | 'QUIZ' | 'ASSIGNMENT'
    video_url?: string
    video_duration?: number
    content?: string
    order_index?: number
    is_preview?: boolean
  }) => api.post<Lesson>(`/sections/${sectionId}/lessons`, data),
  update: (sectionId: string, lessonId: string, data: {
    title?: string
    description?: string
    video_url?: string
    video_duration?: number
    content?: string
    is_preview?: boolean
    is_active?: boolean
  }) => api.put<Lesson>(`/sections/${sectionId}/lessons/${lessonId}`, data),
  delete: (sectionId: string, lessonId: string) => api.delete(`/sections/${sectionId}/lessons/${lessonId}`),
  reorder: (sectionId: string, lessonIds: string[]) =>
    api.put<Lesson[]>(`/sections/${sectionId}/lessons/reorder`, { lesson_ids: lessonIds }),
  getAttachments: (sectionId: string, lessonId: string) => api.get<Attachment[]>(`/sections/${sectionId}/lessons/${lessonId}/attachments`),
  addAttachment: (sectionId: string, lessonId: string, data: FormData) =>
    api.post<Attachment>(`/sections/${sectionId}/lessons/${lessonId}/attachments/upload`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteAttachment: (sectionId: string, lessonId: string, attachmentId: string) =>
    api.delete(`/sections/${sectionId}/lessons/${lessonId}/attachments/${attachmentId}`),
}

export const quizzesApi = {
  get: (lessonId: string) => api.get<Quiz>(`/lessons/${lessonId}/quiz`),
  create: (lessonId: string, data: {
    title: string
    description?: string
    passing_score?: number
    duration_mins?: number
    max_attempts?: number
  }) => api.post<Quiz>(`/lessons/${lessonId}/quiz`, data),
  update: (lessonId: string, data: {
    title?: string
    description?: string
    passing_score?: number
    duration_mins?: number
    max_attempts?: number
    is_active?: boolean
  }) => api.put<Quiz>(`/lessons/${lessonId}/quiz`, data),
  delete: (lessonId: string) => api.delete(`/lessons/${lessonId}/quiz`),
  getQuestions: (lessonId: string) => api.get<Question[]>(`/lessons/${lessonId}/quiz/questions`),
  addQuestion: (lessonId: string, data: {
    question_text: string
    type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK'
    points?: number
    explanation?: string
    order_index?: number
    answers: { answer_text: string; is_correct: boolean }[]
  }) => api.post<Question>(`/lessons/${lessonId}/quiz/questions`, data),
  updateQuestion: (lessonId: string, questionId: string, data: {
    question_text?: string
    type?: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK'
    points?: number
    explanation?: string
  }) => api.put<Question>(`/lessons/${lessonId}/quiz/questions/${questionId}`, data),
  deleteQuestion: (lessonId: string, questionId: string) => api.delete(`/lessons/${lessonId}/quiz/questions/${questionId}`),
  reorderQuestions: (lessonId: string, questionIds: string[]) =>
    api.put<Question[]>(`/lessons/${lessonId}/quiz/questions/reorder`, { question_ids: questionIds }),
  updateAnswers: (lessonId: string, questionId: string, answers: { id?: string; answer_text: string; is_correct: boolean }[]) =>
    api.put<Answer[]>(`/lessons/${lessonId}/quiz/questions/${questionId}/answers`, { answers }),
  getAttempts: (lessonId: string) => api.get<QuizAttempt[]>(`/lessons/${lessonId}/quiz/attempts`),
  generateQuizAI: (lessonId: string, questionCount: number = 5) =>
    api.post<Quiz>(`/lessons/${lessonId}/quiz/generate-ai`, null, { params: { question_count: questionCount } }),
}

export const assignmentsApi = {
  get: (lessonId: string) => api.get<Assignment>(`/lessons/${lessonId}/assignment`),
  create: (lessonId: string, data: {
    title: string
    description?: string
    instructions?: string
    deadline?: string
    max_score?: number
    allow_resubmit?: boolean
    max_resubmits?: number
  }) => api.post<Assignment>(`/lessons/${lessonId}/assignment`, data),
  update: (lessonId: string, data: {
    title?: string
    description?: string
    instructions?: string
    deadline?: string
    max_score?: number
    allow_resubmit?: boolean
    max_resubmits?: number
    is_active?: boolean
  }) => api.put<Assignment>(`/lessons/${lessonId}/assignment`, data),
  delete: (assignmentId: string) => api.delete(`/lessons/${assignmentId}/assignment`),
  submit: (lessonId: string, data: { submission_text?: string; attachments?: Record<string, unknown>[] }) =>
    api.post<AssignmentSubmission>(`/lessons/${lessonId}/assignment/submissions`, data),
  uploadSubmissionFile: (lessonId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<{
      file_name: string
      file_url: string
      file_type: string
      file_size: number
      storage_key: string
    }>(`/lessons/${lessonId}/assignment/submissions/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getSubmissions: (assignmentId: string, page = 1, pageSize = 20) =>
    api.get<{ items: AssignmentSubmission[]; total: number }>(`/assignments/${assignmentId}/submissions`, {
      params: { page, page_size: pageSize },
    }),
  gradeSubmission: (submissionId: string, data: { score: number; feedback?: string }) =>
    api.put<AssignmentSubmission>(`/assignments/submissions/${submissionId}/grade`, data),
}

export const discussionsApi = {
  list: (lessonId: string, page = 1, pageSize = 20) =>
    api.get<{ items: Discussion[]; total: number }>(`/lessons/${lessonId}/discussions`, {
      params: { page, page_size: pageSize },
    }),
  create: (lessonId: string, data: { content: string; parent_id?: string }) =>
    api.post<Discussion>(`/lessons/${lessonId}/discussions`, data),
  update: (discussionId: string, data: { content: string }) =>
    api.put<Discussion>(`/discussions/${discussionId}`, data),
  delete: (discussionId: string) => api.delete(`/discussions/${discussionId}`),
  upvote: (discussionId: string) => api.post<{ upvotes: number }>(`/discussions/${discussionId}/upvote`),
  pin: (discussionId: string) => api.post<Discussion>(`/discussions/${discussionId}/pin`, {}),
  markAsAnswer: (discussionId: string) => api.post<Discussion>(`/discussions/${discussionId}/mark-answer`, {}),
}

export const enrollmentsApi = {
  list: (params?: { status?: string; page?: number; page_size?: number }) =>
    api.get<{ items: Enrollment[]; total: number }>('/my-enrollments', { params }),
  get: (id: string) => api.get<Enrollment>(`/enrollments/${id}`),
  enroll: (courseId: string, paymentMethod?: 'vnpay' | 'momo') =>
    api.post<PaymentIntentResponse>(`/courses/${courseId}/enroll/payment-intent`, {
      payment_method: paymentMethod,
    }),
  cancel: (id: string) => api.delete(`/enrollments/${id}`),
  getProgress: (id: string) => api.get<{ enrollment_id: string; course_id: string; total_materials: number; completed_materials: number; completion_percent: number; materials: MaterialProgressResponse[] }>(`/enrollments/${id}/progress`),
  updateProgress: (enrollmentId: string, materialId: string, data: {
    completion_percent?: number
    last_position?: Record<string, unknown>
  }) => api.post<MaterialProgress>(`/enrollments/${enrollmentId}/materials/${materialId}/progress`, data),
}

export const paymentsApi = {
  getStatus: (paymentId: string) => api.get<{ status: string; enrollment_id?: string }>(`/payments/${paymentId}/status`),
  createVNPayUrl: (enrollmentId: string, amount: number) =>
    api.post<{ payment_url: string }>('/payments/vnpay/create', { enrollment_id: enrollmentId, amount }),
  createMoMoUrl: (enrollmentId: string, amount: number) =>
    api.post<{ payment_url: string }>('/payments/momo/create', { enrollment_id: enrollmentId, amount }),
}

export const dashboardApi = {
  getMyDashboard: () => api.get<DashboardResponse>('/dashboard/my-dashboard'),
}

export const authApi = {
  register: (data: { email: string; password: string; full_name?: string; role?: string }) =>
    api.post<AuthResponse>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),
  refresh: (refresh_token: string) =>
    api.post<{ access_token: string; refresh_token: string }>('/auth/refresh', { refresh_token }),
  me: () => api.get<AuthUser>('/auth/me'),
  updateMe: (data: { full_name?: string; avatar_url?: string }) =>
    api.put<AuthUser>('/auth/me', data),
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
  createSession: (data?: { course_id?: string; title?: string }) =>
    api.post<ChatSession>('/chat/sessions', data),
  listSessions: (page = 1, pageSize = 20) =>
    api.get<{ items: ChatSession[]; total: number }>('/chat/sessions', {
      params: { page, page_size: pageSize },
    }),
  deleteSession: (id: string) => api.delete(`/chat/sessions/${id}`),
  ask: (data: { session_id: string; query: string; lesson_id?: string; document_ids?: string[] }) =>
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
  createUser: (data: { email: string; password: string; full_name?: string; role: string }) =>
    api.post('/admin/users', data),
  updateUser: (userId: string, data: { full_name?: string; role?: string; is_active?: boolean }) =>
    api.put(`/admin/users/${userId}`, data),
  deleteUser: (userId: string) =>
    api.delete(`/admin/users/${userId}`),
  listAllCourses: (params?: { page?: number; page_size?: number; search?: string; status?: string }) =>
    api.get('/admin/courses', { params }),
  deleteCourse: (courseId: string) =>
    api.delete(`/admin/courses/${courseId}`),
  analytics: () => api.get('/admin/analytics'),
  health: () => api.get('/admin/health'),
}

export const notificationsApi = {
  list: (page = 1, pageSize = 20) =>
    api.get<{ items: NotificationItem[]; total: number; unread_count: number }>('/notifications', { params: { page, page_size: pageSize } }),
  markRead: (id: string) => api.put<NotificationItem>(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
}

export const wishlistApi = {
  list: () => api.get<WishlistItem[]>('/wishlist'),
  add: (courseId: string) => api.post<WishlistItem>(`/wishlist/${courseId}`),
  remove: (courseId: string) => api.delete(`/wishlist/${courseId}`),
  check: (courseId: string) => api.get<{ is_wishlisted: boolean }>(`/wishlist/check/${courseId}`),
}

export const announcementsApi = {
  list: (courseId: string) => api.get<Announcement[]>(`/courses/${courseId}/announcements`),
}

export default api
