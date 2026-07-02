export type DocumentType = 'pdf' | 'video' | 'audio' | 'url'
export type DocumentStatus = 'processing' | 'ready' | 'failed'

export interface DocumentItem {
  id: string
  name: string
  type: DocumentType
  status: DocumentStatus
  size: string
  pageCount?: number
  progress?: number
}

export interface Citation {
  id: string
  label: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  citations?: Citation[]
}

export interface ChatSession {
  id: string
  title: string
  course_id?: string
  context_type?: string
  preview: string
  messages: Message[]
}

export interface Notification {
  id: string
  title: string
  detail: string
  time: string
}

export interface QuotaInfo {
  storageUsed: number
  storageTotal: number
  tokensUsed: number
  tokensTotal: number
}

export interface UserProfile {
  name: string
  role: string
  initials: string
  quota?: QuotaInfo
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
}

export interface Flashcard {
  id: string
  front: string
  back: string
}

export interface EssaySubmission {
  id: string
  title: string
  content: string
  score: number
  criteria: { label: string; score: number; feedback: string }[]
  suggestions: string[]
}

export interface ToastItem {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
}

export type MaterialType = 'pdf' | 'docx' | 'image' | 'video' | 'url'

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

export interface PaymentRequest {
  payment_method: 'vnpay' | 'momo'
  amount: number
  course_id: string
}
