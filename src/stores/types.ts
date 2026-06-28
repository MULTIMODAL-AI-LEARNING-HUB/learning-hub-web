import type {
  ChatSession,
  DocumentItem,
  Flashcard,
  Notification,
  QuizQuestion,
  ToastItem,
  UserProfile
} from '../types'

export interface AuthSlice {
  auth: {
    isAuthenticated: boolean
    user: UserProfile
    token: string | null
    login: (email: string, password: string) => Promise<void>
    register: (email: string, password: string, fullName?: string, role?: string) => Promise<void>
    logout: () => void
    loadUser: () => Promise<void>
    forgotPassword: (email: string) => Promise<void>
    resetPassword: (token: string, password: string) => Promise<void>
  }
}

export interface DocumentsSlice {
  documents: {
    items: DocumentItem[]
    selectedId: string | null
    select: (id: string) => void
    add: (doc: DocumentItem) => void
    remove: (id: string) => void
    retry: (id: string) => void
    updateProgress: (id: string, progress: number, status?: 'processing' | 'ready' | 'failed') => void
    loadDocuments: () => Promise<void>
    uploadDocument: (file: File) => Promise<void>
  }
}

export interface ChatSlice {
  chat: {
    sessions: ChatSession[]
    activeSessionId: string | null
    selectSession: (id: string) => void
    sendMessage: (content: string, documentIds?: string[]) => Promise<void>
    addSession: () => Promise<void>
    deleteSession: (id: string) => void
  }
}

export interface NotificationsSlice {
  notifications: {
    items: Notification[]
    dismiss: (id: string) => void
    clear: () => void
  }
}

export interface UISlice {
  ui: {
    sidebarOpen: boolean
    notificationsOpen: boolean
    uploadModalOpen: boolean
    activeView: string
    toggleSidebar: () => void
    toggleNotifications: () => void
    openUploadModal: () => void
    closeUploadModal: () => void
    setActiveView: (view: string) => void
  }
}

export interface StudySlice {
  study: {
    activeTool: string | null
    setActiveTool: (tool: string | null) => void
    quizQuestions: QuizQuestion[]
    setQuizQuestions: (q: QuizQuestion[]) => void
    flashcards: Flashcard[]
    setFlashcards: (f: Flashcard[]) => void
  }
}

export interface ToastsSlice {
  toasts: {
    items: ToastItem[]
    add: (toast: Omit<ToastItem, 'id'>) => void
    remove: (id: string) => void
  }
}

export type AppState = AuthSlice & DocumentsSlice & ChatSlice & NotificationsSlice & UISlice & StudySlice & ToastsSlice

export interface AxiosErrorLike {
  response?: {
    data?: {
      message?: string
      detail?: string
    }
  }
  message?: string
}
