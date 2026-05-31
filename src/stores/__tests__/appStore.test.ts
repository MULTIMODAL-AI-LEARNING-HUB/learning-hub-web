import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../appStore'

describe('appStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      auth: { isAuthenticated: true, user: { name: 'Test', role: 'Student', initials: 'T' }, login: useAppStore.getState().auth.login, logout: useAppStore.getState().auth.logout },
      documents: { items: [], selectedId: null, select: useAppStore.getState().documents.select, add: useAppStore.getState().documents.add, remove: useAppStore.getState().documents.remove, retry: useAppStore.getState().documents.retry, updateProgress: useAppStore.getState().documents.updateProgress },
      chat: { sessions: [], activeSessionId: null, selectSession: useAppStore.getState().chat.selectSession, sendMessage: useAppStore.getState().chat.sendMessage, addSession: useAppStore.getState().chat.addSession, deleteSession: useAppStore.getState().chat.deleteSession },
      notifications: { items: [], dismiss: useAppStore.getState().notifications.dismiss, clear: useAppStore.getState().notifications.clear },
      toasts: { items: [], add: useAppStore.getState().toasts.add, remove: useAppStore.getState().toasts.remove }
    })
  })

  describe('auth', () => {
    it('starts authenticated', () => {
      expect(useAppStore.getState().auth.isAuthenticated).toBe(true)
    })

    it('logs out', () => {
      useAppStore.getState().auth.logout()
      expect(useAppStore.getState().auth.isAuthenticated).toBe(false)
    })

    it('logs in', () => {
      useAppStore.getState().auth.logout()
      useAppStore.getState().auth.login()
      expect(useAppStore.getState().auth.isAuthenticated).toBe(true)
    })
  })

  describe('documents', () => {
    it('adds a document', () => {
      useAppStore.getState().documents.add({
        id: 'd1', name: 'test.pdf', type: 'pdf', status: 'ready', size: '1MB', pageCount: 10
      })
      expect(useAppStore.getState().documents.items).toHaveLength(1)
      expect(useAppStore.getState().documents.items[0].name).toBe('test.pdf')
    })

    it('selects a document', () => {
      useAppStore.getState().documents.add({
        id: 'd1', name: 'test.pdf', type: 'pdf', status: 'ready', size: '1MB'
      })
      useAppStore.getState().documents.select('d1')
      expect(useAppStore.getState().documents.selectedId).toBe('d1')
    })

    it('removes a document', () => {
      useAppStore.getState().documents.add({
        id: 'd1', name: 'test.pdf', type: 'pdf', status: 'ready', size: '1MB'
      })
      useAppStore.getState().documents.remove('d1')
      expect(useAppStore.getState().documents.items).toHaveLength(0)
    })

    it('retries a failed document', () => {
      useAppStore.getState().documents.add({
        id: 'd1', name: 'test.pdf', type: 'pdf', status: 'failed', size: '1MB'
      })
      useAppStore.getState().documents.retry('d1')
      expect(useAppStore.getState().documents.items[0].status).toBe('processing')
    })
  })

  describe('chat', () => {
    it('sends a message', () => {
      useAppStore.setState({
        chat: {
          ...useAppStore.getState().chat,
          sessions: [{ id: 'c1', title: 'Test', preview: '', messages: [] }],
          activeSessionId: 'c1'
        }
      })
      useAppStore.getState().chat.sendMessage('Hello')
      const messages = useAppStore.getState().chat.sessions[0].messages
      expect(messages).toHaveLength(1)
      expect(messages[0].content).toBe('Hello')
      expect(messages[0].role).toBe('user')
    })

    it('adds a new session', () => {
      useAppStore.getState().chat.addSession()
      expect(useAppStore.getState().chat.sessions).toHaveLength(1)
    })

    it('selects a session', () => {
      useAppStore.setState({
        chat: {
          ...useAppStore.getState().chat,
          sessions: [
            { id: 'c1', title: 'Chat 1', preview: '', messages: [] },
            { id: 'c2', title: 'Chat 2', preview: '', messages: [] }
          ],
          activeSessionId: 'c1'
        }
      })
      useAppStore.getState().chat.selectSession('c2')
      expect(useAppStore.getState().chat.activeSessionId).toBe('c2')
    })

    it('deletes a session', () => {
      useAppStore.setState({
        chat: {
          ...useAppStore.getState().chat,
          sessions: [
            { id: 'c1', title: 'Chat 1', preview: '', messages: [] },
            { id: 'c2', title: 'Chat 2', preview: '', messages: [] }
          ],
          activeSessionId: 'c1'
        }
      })
      useAppStore.getState().chat.deleteSession('c1')
      expect(useAppStore.getState().chat.sessions).toHaveLength(1)
      expect(useAppStore.getState().chat.activeSessionId).toBe('c2')
    })
  })

  describe('notifications', () => {
    it('dismisses a notification', () => {
      useAppStore.setState({
        notifications: {
          ...useAppStore.getState().notifications,
          items: [{ id: 'n1', title: 'Test', detail: '', time: '' }]
        }
      })
      useAppStore.getState().notifications.dismiss('n1')
      expect(useAppStore.getState().notifications.items).toHaveLength(0)
    })

    it('clears all notifications', () => {
      useAppStore.setState({
        notifications: {
          ...useAppStore.getState().notifications,
          items: [
            { id: 'n1', title: 'Test 1', detail: '', time: '' },
            { id: 'n2', title: 'Test 2', detail: '', time: '' }
          ]
        }
      })
      useAppStore.getState().notifications.clear()
      expect(useAppStore.getState().notifications.items).toHaveLength(0)
    })
  })

  describe('toasts', () => {
    it('adds a toast', () => {
      useAppStore.getState().toasts.add({ type: 'success', title: 'Test' })
      expect(useAppStore.getState().toasts.items).toHaveLength(1)
      expect(useAppStore.getState().toasts.items[0].title).toBe('Test')
    })

    it('removes a toast', () => {
      useAppStore.getState().toasts.add({ type: 'success', title: 'Test' })
      const id = useAppStore.getState().toasts.items[0].id
      useAppStore.getState().toasts.remove(id)
      expect(useAppStore.getState().toasts.items).toHaveLength(0)
    })
  })
})
