import { create } from 'zustand'
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

interface AppState {
  auth: {
    isAuthenticated: boolean
    user: UserProfile
    token: string | null
    login: (email: string, password: string) => Promise<void>
    register: (email: string, password: string, fullName?: string) => Promise<void>
    logout: () => void
    loadUser: () => Promise<void>
  }

  documents: {
    items: DocumentItem[]
    selectedId: string | null
    select: (id: string) => void
    add: (doc: DocumentItem) => void
    remove: (id: string) => void
    retry: (id: string) => void
    updateProgress: (id: string, progress: number) => void
    loadDocuments: () => Promise<void>
    uploadDocument: (file: File) => Promise<void>
  }

  chat: {
    sessions: ChatSession[]
    activeSessionId: string | null
    selectSession: (id: string) => void
    sendMessage: (content: string) => void
    addSession: () => Promise<void>
    deleteSession: (id: string) => void
  }

  notifications: {
    items: Notification[]
    dismiss: (id: string) => void
    clear: () => void
  }

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

  study: {
    activeTool: string | null
    setActiveTool: (tool: string | null) => void
    quizQuestions: QuizQuestion[]
    setQuizQuestions: (q: QuizQuestion[]) => void
    flashcards: Flashcard[]
    setFlashcards: (f: Flashcard[]) => void
  }

  toasts: {
    items: ToastItem[]
    add: (toast: Omit<ToastItem, 'id'>) => void
    remove: (id: string) => void
  }
}

let toastCounter = 0

export const useAppStore = create<AppState>((set, get) => ({
  auth: {
    isAuthenticated: !!localStorage.getItem('access_token'),
    user: userProfile,
    token: localStorage.getItem('access_token'),
    login: async (email: string, password: string) => {
      try {
        const res = await authApi.login({ email, password })
        const { user, token } = res.data
        localStorage.setItem('access_token', token.access_token)
        if (token.refresh_token) localStorage.setItem('refresh_token', token.refresh_token)
        set({
          auth: {
            ...get().auth,
            isAuthenticated: true,
            token: token.access_token,
            user: { name: user.full_name || user.email, role: user.role, initials: (user.full_name || user.email).split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) },
          }
        })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Login failed'
        throw new Error(msg, { cause: err })
      }
    },
    register: async (email: string, password: string, fullName?: string) => {
      try {
        const res = await authApi.register({ email, password, full_name: fullName })
        const { user, token } = res.data
        localStorage.setItem('access_token', token.access_token)
        if (token.refresh_token) localStorage.setItem('refresh_token', token.refresh_token)
        set({
          auth: {
            ...get().auth,
            isAuthenticated: true,
            token: token.access_token,
            user: { name: user.full_name || user.email, role: user.role, initials: (user.full_name || user.email).split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) },
          }
        })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Registration failed'
        throw new Error(msg, { cause: err })
      }
    },
    logout: () => {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      set({ auth: { ...get().auth, isAuthenticated: false, token: null } })
    },
    loadUser: async () => {
      try {
        const res = await authApi.me()
        const user = res.data
        set({
          auth: {
            ...get().auth,
            user: { name: user.full_name || user.email, role: user.role, initials: (user.full_name || user.email).split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) },
          }
        })
      } catch {
        // Token invalid, logout
        get().auth.logout()
      }
    },
  },

  documents: {
    items: [...initDocs] as unknown as DocumentItem[],
    selectedId: 'd1',
    select: (id) => set({ documents: { ...get().documents, selectedId: id } }),
    add: (doc) =>
      set({ documents: { ...get().documents, items: [...get().documents.items, doc] } }),
    remove: (id) =>
      set({
        documents: {
          ...get().documents,
          items: get().documents.items.filter((d) => d.id !== id),
          selectedId: get().documents.selectedId === id ? null : get().documents.selectedId
        }
      }),
    retry: (id) =>
      set({
        documents: {
          ...get().documents,
          items: get().documents.items.map((d) =>
            d.id === id ? { ...d, status: 'processing' as const, progress: 0 } : d
          )
        }
      }),
    updateProgress: (id, progress) =>
      set({
        documents: {
          ...get().documents,
          items: get().documents.items.map((d) =>
            d.id === id
              ? { ...d, progress, status: progress >= 100 ? 'ready' : 'processing' }
              : d
          )
        }
      }),
    loadDocuments: async () => {
      try {
        const res = await documentsApi.list()
        const items = res.data.items.map((d) => ({
          id: d.id,
          name: d.file_name,
          type: d.file_type as 'pdf' | 'video' | 'audio' | 'url',
          status: d.status as 'processing' | 'ready' | 'failed',
          size: d.file_size ? `${(d.file_size / 1024 / 1024).toFixed(1)} MB` : '0 MB',
          pageCount: (d.metadata as Record<string, unknown>)?.page_count as number | undefined,
          progress: d.status === 'processing' ? 50 : undefined,
        }))
        set({ documents: { ...get().documents, items } })
      } catch {
        // Fallback to mock data
      }
    },
    uploadDocument: async (file: File) => {
      try {
        const res = await documentsApi.upload(file)
        const data = res.data as Record<string, unknown>
        const newDoc: DocumentItem = {
          id: data.id as string,
          name: data.file_name as string,
          type: (data.file_type as 'pdf') || 'pdf',
          status: 'processing',
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          progress: 0,
        }
        get().documents.add(newDoc)
        get().toasts.add({ type: 'success', title: 'Upload started', message: file.name })
      } catch {
        get().toasts.add({ type: 'error', title: 'Upload failed', message: file.name })
      }
    },
  },

  chat: {
    sessions: initSessions.map((s) => ({ ...s, messages: [] } as ChatSession)),
    activeSessionId: 'c1',
    selectSession: (id) => set({ chat: { ...get().chat, activeSessionId: id } }),
    sendMessage: (content) => {
      const state = get()
      const sessionId = state.chat.activeSessionId
      if (!sessionId || !content.trim()) return

      const now = new Date()
      const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      const userMsg: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: ts
      }

      set({
        chat: {
          ...state.chat,
          sessions: state.chat.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, messages: [...s.messages, userMsg], preview: content.trim().slice(0, 40) }
              : s
          )
        }
      })

      chatApi.ask({ session_id: sessionId, query: content.trim() })
        .then((res) => {
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
          set({
            chat: {
              ...get().chat,
              sessions: get().chat.sessions.map((s) =>
                s.id === sessionId ? { ...s, messages: [...s.messages, aiMsg] } : s
              )
            }
          })
        })
        .catch(() => {
          const aiMsg: Message = {
            id: `msg-${Date.now() + 1}`,
            role: 'assistant',
            content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.',
            timestamp: ts,
          }
          set({
            chat: {
              ...get().chat,
              sessions: get().chat.sessions.map((s) =>
                s.id === sessionId ? { ...s, messages: [...s.messages, aiMsg] } : s
              )
            }
          })
        })
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
        set({
          chat: {
            ...get().chat,
            sessions: [newSession, ...get().chat.sessions],
            activeSessionId: session.id
          }
        })
      } catch {
        const newId = `c-${Date.now()}`
        const newSession: ChatSession = {
          id: newId,
          title: 'New chat',
          preview: '',
          messages: []
        }
        set({
          chat: {
            ...get().chat,
            sessions: [newSession, ...get().chat.sessions],
            activeSessionId: newId
          }
        })
      }
    },
    deleteSession: (id) => {
      const state = get()
      const remaining = state.chat.sessions.filter((s) => s.id !== id)
      set({
        chat: {
          ...state.chat,
          sessions: remaining,
          activeSessionId: state.chat.activeSessionId === id
            ? remaining[0]?.id ?? null
            : state.chat.activeSessionId
        }
      })
      chatApi.deleteSession(id).catch(() => {})
    }
  },

  notifications: {
    items: [...initNotifs],
    dismiss: (id) =>
      set({ notifications: { ...get().notifications, items: get().notifications.items.filter((n) => n.id !== id) } }),
    clear: () => set({ notifications: { ...get().notifications, items: [] } })
  },

  ui: {
    sidebarOpen: false,
    notificationsOpen: false,
    uploadModalOpen: false,
    activeView: 'documents',
    toggleSidebar: () => set({ ui: { ...get().ui, sidebarOpen: !get().ui.sidebarOpen } }),
    toggleNotifications: () =>
      set({ ui: { ...get().ui, notificationsOpen: !get().ui.notificationsOpen } }),
    openUploadModal: () => set({ ui: { ...get().ui, uploadModalOpen: true } }),
    closeUploadModal: () => set({ ui: { ...get().ui, uploadModalOpen: false } }),
    setActiveView: (view) => set({ ui: { ...get().ui, activeView: view } })
  },

  study: {
    activeTool: null,
    setActiveTool: (tool) => set({ study: { ...get().study, activeTool: tool } }),
    quizQuestions: [],
    setQuizQuestions: (q) => set({ study: { ...get().study, quizQuestions: q } }),
    flashcards: [],
    setFlashcards: (f) => set({ study: { ...get().study, flashcards: f } })
  },

  toasts: {
    items: [],
    add: (toast) => {
      const id = `toast-${++toastCounter}`
      set({ toasts: { ...get().toasts, items: [...get().toasts.items, { ...toast, id }] } })
      setTimeout(() => {
        set({ toasts: { ...get().toasts, items: get().toasts.items.filter((t) => t.id !== id) } })
      }, 4000)
    },
    remove: (id) =>
      set({ toasts: { ...get().toasts, items: get().toasts.items.filter((t) => t.id !== id) } })
  }
}))
