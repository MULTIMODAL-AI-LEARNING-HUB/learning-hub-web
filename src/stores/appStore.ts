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

interface AppState {
  auth: {
    isAuthenticated: boolean
    user: UserProfile
    login: () => void
    logout: () => void
  }

  documents: {
    items: DocumentItem[]
    selectedId: string | null
    select: (id: string) => void
    add: (doc: DocumentItem) => void
    remove: (id: string) => void
    retry: (id: string) => void
    updateProgress: (id: string, progress: number) => void
  }

  chat: {
    sessions: ChatSession[]
    activeSessionId: string | null
    selectSession: (id: string) => void
    sendMessage: (content: string) => void
    addSession: () => void
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
    isAuthenticated: true,
    user: userProfile,
    login: () => set({ auth: { ...get().auth, isAuthenticated: true } }),
    logout: () => set({ auth: { ...get().auth, isAuthenticated: false } })
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
      })
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

      const aiMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: 'Đây là câu trả lời mô phỏng cho câu hỏi của bạn. Nội dung này được tạo bởi AI tutor system.',
        timestamp: ts,
        citations: [
          { id: 'cite1', label: `[1] AI_Basics.pdf - Trang ${Math.floor(Math.random() * 40) + 1}` }
        ]
      }

      setTimeout(() => {
        set({
          chat: {
            ...get().chat,
            sessions: get().chat.sessions.map((s) =>
              s.id === sessionId
                ? { ...s, messages: [...s.messages, aiMsg] }
                : s
            )
          }
        })
      }, 800)
    },
    addSession: () => {
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
