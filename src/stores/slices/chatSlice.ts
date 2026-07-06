import type { StateCreator } from 'zustand'
import type { AppState, ChatSlice } from '../types'
import type { ChatSession, Message } from '../../types'
import { chatApi, type Citation as ApiCitation } from '../../services/api'

export const createChatSlice: StateCreator<AppState, [['zustand/devtools', never]], [], ChatSlice> = (set, get) => ({
  chat: {
    sessions: [] as ChatSession[],
    activeSessionId: null,
    selectSession: (id) => set((state) => ({
      chat: { ...state.chat, activeSessionId: id }
    }), false, 'chat/selectSession'),
    sendMessage: async (content, documentIds, courseId, lessonId) => {
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
          course_id: courseId,
          lesson_id: lessonId,
          document_ids: documentIds
        })
        const data = res.data
        const aiMsg: Message = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: data.answer,
          timestamp: ts,
          citations: data.citations?.map((c: ApiCitation, i: number) => ({
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
    addSession: async (courseId?: string, lessonId?: string) => {
      try {
        const res = await chatApi.createSession({ course_id: courseId, lesson_id: lessonId, title: 'New chat' })
        const session = res.data
        const newSession: ChatSession = {
          id: session.id,
          title: session.title || 'New chat',
          course_id: session.course_id || undefined,
          lesson_id: session.lesson_id || undefined,
          context_type: session.context_type,
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
