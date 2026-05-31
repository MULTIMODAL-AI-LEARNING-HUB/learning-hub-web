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
