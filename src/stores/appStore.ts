import { create, StateCreator } from 'zustand'
import { devtools } from 'zustand/middleware'
import type {
  ChatSession,
  DocumentItem,
  Flashcard,
  Message,
  Notification,
  QuizQuestion,
  ToastItem,
  UserProfile
} from '../types'
import {
  chatSessions as initSessions,
  documents as initDocs,
  notifications as initNotifs,
  userProfile
} from '../data/mockData'
import { authApi, documentsApi, chatApi } from '../services/api'

// Define Store Interfaces
interface AuthSlice {
  auth: {
    isAuthenticated: boolean
    user: UserProfile
    token: string | null
    login: (email: string, password: string) => Promise<void>
    register: (email: string, password: string, fullName?: string) => Promise<void>
    logout: () => void
    loadUser: () => Promise<void>
  }
}

interface DocumentsSlice {
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

interface ChatSlice {
  chat: {
    sessions: ChatSession[]
    activeSessionId: string | null
    selectSession: (id: string) => void
    sendMessage: (content: string, documentIds?: string[]) => Promise<void>
    addSession: () => Promise<void>
    deleteSession: (id: string) => void
  }
}

interface NotificationsSlice {
  notifications: {
    items: Notification[]
    dismiss: (id: string) => void
    clear: () => void
  }
}

interface UISlice {
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

interface StudySlice {
  study: {
    activeTool: string | null
    setActiveTool: (tool: string | null) => void
    quizQuestions: QuizQuestion[]
    setQuizQuestions: (q: QuizQuestion[]) => void
    flashcards: Flashcard[]
    setFlashcards: (f: Flashcard[]) => void
  }
}

interface ToastsSlice {
  toasts: {
    items: ToastItem[]
    add: (toast: Omit<ToastItem, 'id'>) => void
    remove: (id: string) => void
  }
}

type AppState = AuthSlice & DocumentsSlice & ChatSlice & NotificationsSlice & UISlice & StudySlice & ToastsSlice

let toastCounter = 0

// Slice Creators
const createAuthSlice: StateCreator<AppState, [['zustand/devtools', never]], [], AuthSlice> = (set, get) => ({
  auth: {
    isAuthenticated: !!localStorage.getItem('access_token'),
    user: userProfile,
    token: localStorage.getItem('access_token'),
    login: async (email, password) => {
      try {
        const res = await authApi.login({ email, password })
        const { user, token } = res.data
        localStorage.setItem('access_token', token.access_token)
        if (token.refresh_token) localStorage.setItem('refresh_token', token.refresh_token)
        
        set((state) => ({
          auth: {
            ...state.auth,
            isAuthenticated: true,
            token: token.access_token,
            user: {
              name: user.full_name || user.email,
              role: user.role,
              initials: (user.full_name || user.email).split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
              quota: user.quota ? {
                storageUsed: user.quota.storage_used_mb,
                storageTotal: user.quota.storage_limit_mb,
                tokensUsed: user.quota.token_used,
                tokensTotal: user.quota.token_limit
              } : undefined
            }
          }
        }), false, 'auth/login')
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Login failed'
        throw new Error(msg)
      }
    },
    register: async (email, password, fullName) => {
      try {
        const res = await authApi.register({ email, password, full_name: fullName })
        const { user, token } = res.data
        localStorage.setItem('access_token', token.access_token)
        if (token.refresh_token) localStorage.setItem('refresh_token', token.refresh_token)
        
        set((state) => ({
          auth: {
            ...state.auth,
            isAuthenticated: true,
            token: token.access_token,
            user: {
              name: user.full_name || user.email,
              role: user.role,
              initials: (user.full_name || user.email).split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
              quota: user.quota ? {
                storageUsed: user.quota.storage_used_mb,
                storageTotal: user.quota.storage_limit_mb,
                tokensUsed: user.quota.token_used,
                tokensTotal: user.quota.token_limit
              } : undefined
            }
          }
        }), false, 'auth/register')
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Registration failed'
        throw new Error(msg)
      }
    },
    logout: () => {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      set((state) => ({
        auth: { ...state.auth, isAuthenticated: false, token: null }
      }), false, 'auth/logout')
    },
    loadUser: async () => {
      try {
        const res = await authApi.me()
        const user = res.data
        set((state) => ({
          auth: {
            ...state.auth,
            user: {
              name: user.full_name || user.email,
              role: user.role,
              initials: (user.full_name || user.email).split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
              quota: user.quota ? {
                storageUsed: user.quota.storage_used_mb,
                storageTotal: user.quota.storage_limit_mb,
                tokensUsed: user.quota.token_used,
                tokensTotal: user.quota.token_limit
              } : undefined
            }
          }
        }), false, 'auth/loadUser')
      } catch {
        get().auth.logout()
      }
    }
  }
})

const createDocumentsSlice: StateCreator<AppState, [['zustand/devtools', never]], [], DocumentsSlice> = (set, get) => ({
  documents: {
    items: [...initDocs] as unknown as DocumentItem[],
    selectedId: 'd1',
    select: (id) => set((state) => ({
      documents: { ...state.documents, selectedId: id }
    }), false, 'documents/select'),
    add: (doc) => set((state) => ({
      documents: { ...state.documents, items: [...state.documents.items, doc] }
    }), false, 'documents/add'),
    remove: (id) => set((state) => {
      documentsApi.delete(id).catch(() => {})
      return {
        documents: {
          ...state.documents,
          items: state.documents.items.filter((d) => d.id !== id),
          selectedId: state.documents.selectedId === id ? null : state.documents.selectedId
        }
      }
    }, false, 'documents/remove'),
    retry: (id) => set((state) => ({
      documents: {
        ...state.documents,
        items: state.documents.items.map((d) =>
          d.id === id ? { ...d, status: 'processing' as const, progress: 0 } : d
        )
      }
    }), false, 'documents/retry'),
    updateProgress: (id, progress, status = 'processing') => set((state) => ({
      documents: {
        ...state.documents,
        items: state.documents.items.map((d) =>
          d.id === id ? { ...d, progress, status } : d
        )
      }
    }), false, 'documents/updateProgress'),
    loadDocuments: async () => {
      try {
        const res = await documentsApi.list()
        const items: DocumentItem[] = res.data.items.map((d) => ({
          id: d.id,
          name: d.file_name,
          type: d.file_type as 'pdf' | 'video' | 'audio' | 'url',
          status: d.status as 'processing' | 'ready' | 'failed',
          size: d.file_size ? `${(d.file_size / 1024 / 1024).toFixed(1)} MB` : '0 MB',
          pageCount: (d.metadata as Record<string, unknown>)?.page_count as number | undefined,
          progress: d.status === 'processing' ? 50 : undefined,
        }))
        set((state) => ({
          documents: { ...state.documents, items }
        }), false, 'documents/loadDocuments')
      } catch {
        // Fallback to initial mock docs if API fails
      }
    },
    uploadDocument: async (file: File) => {
      try {
        const res = await documentsApi.upload(file)
        const data = res.data as Record<string, any>
        const newDoc: DocumentItem = {
          id: data.id,
          name: data.file_name,
          type: (data.file_type as 'pdf') || 'pdf',
          status: 'processing',
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          progress: 0,
        }
        get().documents.add(newDoc)
        get().toasts.add({ type: 'success', title: 'Upload started', message: file.name })
      } catch (err: any) {
        const msg = err.response?.data?.detail || err.message || file.name
        get().toasts.add({ type: 'error', title: 'Upload failed', message: msg })
        throw err
      }
    }
  }
})

const createChatSlice: StateCreator<AppState, [['zustand/devtools', never]], [], ChatSlice> = (set, get) => ({
  chat: {
    sessions: initSessions.map((s) => ({ ...s, messages: [] } as ChatSession)),
    activeSessionId: 'c1',
    selectSession: (id) => set((state) => ({
      chat: { ...state.chat, activeSessionId: id }
    }), false, 'chat/selectSession'),
    sendMessage: async (content, documentIds) => {
      const sessionId = get().chat.activeSessionId
      if (!sessionId || !content.trim()) return

      const now = new Date()
      const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      const userMsg: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: ts
      }

      // Add user message to state
      set((state) => ({
        chat: {
          ...state.chat,
          sessions: state.chat.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, messages: [...s.messages, userMsg], preview: content.trim().slice(0, 40) }
              : s
          )
        }
      }), false, 'chat/sendUserMessage')

      try {
        const res = await chatApi.ask({
          session_id: sessionId,
          query: content.trim(),
          document_ids: documentIds
        })
        const data = res.data
        const aiMsg: Message = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: data.answer,
          timestamp: ts,
          citations: data.citations?.map((c, i) => ({
            id: `cite-${i}`,
            label: `[${i + 1}] Page ${c.page_number || '?'}`
          })) || []
        }
        
        set((state) => ({
          chat: {
            ...state.chat,
            sessions: state.chat.sessions.map((s) =>
              s.id === sessionId ? { ...s, messages: [...s.messages, aiMsg] } : s
            )
          }
        }), false, 'chat/receiveAIMessage')
      } catch {
        const aiMsg: Message = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.',
          timestamp: ts,
        }
        set((state) => ({
          chat: {
            ...state.chat,
            sessions: state.chat.sessions.map((s) =>
              s.id === sessionId ? { ...s, messages: [...s.messages, aiMsg] } : s
            )
          }
        }), false, 'chat/receiveAIMessageError')
      }
    },
    addSession: async () => {
      try {
        const res = await chatApi.createSession({ title: 'New chat' })
        const session = res.data
        const newSession: ChatSession = {
          id: session.id,
          title: session.title || 'New chat',
          preview: '',
          messages: []
        }
        set((state) => ({
          chat: {
            ...state.chat,
            sessions: [newSession, ...state.chat.sessions],
            activeSessionId: session.id
          }
        }), false, 'chat/addSession')
      } catch {
        // Fallback offline session
        const newId = `c-${Date.now()}`
        const newSession: ChatSession = {
          id: newId,
          title: 'New chat',
          preview: '',
          messages: []
        }
        set((state) => ({
          chat: {
            ...state.chat,
            sessions: [newSession, ...state.chat.sessions],
            activeSessionId: newId
          }
        }), false, 'chat/addSessionFallback')
      }
    },
    deleteSession: (id) => {
      const remaining = get().chat.sessions.filter((s) => s.id !== id)
      set((state) => ({
        chat: {
          ...state.chat,
          sessions: remaining,
          activeSessionId: state.chat.activeSessionId === id
            ? remaining[0]?.id ?? null
            : state.chat.activeSessionId
        }
      }), false, 'chat/deleteSession')
      chatApi.deleteSession(id).catch(() => {})
    }
  }
})

const createNotificationsSlice: StateCreator<AppState, [['zustand/devtools', never]], [], NotificationsSlice> = (set) => ({
  notifications: {
    items: [...initNotifs],
    dismiss: (id) => set((state) => ({
      notifications: { ...state.notifications, items: state.notifications.items.filter((n) => n.id !== id) }
    }), false, 'notifications/dismiss'),
    clear: () => set((state) => ({
      notifications: { ...state.notifications, items: [] }
    }), false, 'notifications/clear')
  }
})

const createUISlice: StateCreator<AppState, [['zustand/devtools', never]], [], UISlice> = (set) => ({
  ui: {
    sidebarOpen: false,
    notificationsOpen: false,
    uploadModalOpen: false,
    activeView: 'documents',
    toggleSidebar: () => set((state) => ({
      ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen }
    }), false, 'ui/toggleSidebar'),
    toggleNotifications: () => set((state) => ({
      ui: { ...state.ui, notificationsOpen: !state.ui.notificationsOpen }
    }), false, 'ui/toggleNotifications'),
    openUploadModal: () => set((state) => ({
      ui: { ...state.ui, uploadModalOpen: true }
    }), false, 'ui/openUploadModal'),
    closeUploadModal: () => set((state) => ({
      ui: { ...state.ui, uploadModalOpen: false }
    }), false, 'ui/closeUploadModal'),
    setActiveView: (view) => set((state) => ({
      ui: { ...state.ui, activeView: view }
    }), false, 'ui/setActiveView')
  }
})

const createStudySlice: StateCreator<AppState, [['zustand/devtools', never]], [], StudySlice> = (set) => ({
  study: {
    activeTool: null,
    setActiveTool: (tool) => set((state) => ({
      study: { ...state.study, activeTool: tool }
    }), false, 'study/setActiveTool'),
    quizQuestions: [],
    setQuizQuestions: (q) => set((state) => ({
      study: { ...state.study, quizQuestions: q }
    }), false, 'study/setQuizQuestions'),
    flashcards: [],
    setFlashcards: (f) => set((state) => ({
      study: { ...state.study, flashcards: f }
    }), false, 'study/setFlashcards')
  }
})

const createToastsSlice: StateCreator<AppState, [['zustand/devtools', never]], [], ToastsSlice> = (set, get) => ({
  toasts: {
    items: [],
    add: (toast) => {
      const id = `toast-${++toastCounter}`
      set((state) => ({
        toasts: { ...state.toasts, items: [...state.toasts.items, { ...toast, id }] }
      }), false, 'toasts/add')
      setTimeout(() => {
        set((state) => ({
          toasts: { ...state.toasts, items: state.toasts.items.filter((t) => t.id !== id) }
        }), false, 'toasts/removeAuto')
      }, 4000)
    },
    remove: (id) => set((state) => ({
      toasts: { ...state.toasts, items: state.toasts.items.filter((t) => t.id !== id) }
    }), false, 'toasts/remove')
  }
})

// Unified Zustand Store utilizing slice compilation
export const useAppStore = create<AppState>()(
  devtools((...args) => ({
    ...createAuthSlice(...args),
    ...createDocumentsSlice(...args),
    ...createChatSlice(...args),
    ...createNotificationsSlice(...args),
    ...createUISlice(...args),
    ...createStudySlice(...args),
    ...createToastsSlice(...args)
  }))
)
