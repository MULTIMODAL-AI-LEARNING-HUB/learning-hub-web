import type { StateCreator } from 'zustand'
import type { AppState, NotificationsSlice } from '../types'
import { notificationsApi } from '../../services/api'

export const createNotificationsSlice: StateCreator<AppState, [['zustand/devtools', never]], [], NotificationsSlice> = (set, get) => ({
  notifications: {
    items: [],
    unreadCount: 0,
    fetch: async () => {
      try {
        const res = await notificationsApi.list(1, 50)
        set({
          notifications: {
            ...get().notifications,
            items: res.data.items.map(n => ({
              id: n.id,
              title: n.title,
              detail: n.detail || '',
              time: new Date(n.created_at).toLocaleDateString('vi-VN'),
              isRead: n.is_read,
            })),
            unreadCount: res.data.unread_count,
          }
        }, false, 'notifications/fetch')
      } catch {
        // ignore
      }
    },
    markRead: async (id) => {
      try {
        await notificationsApi.markRead(id)
        set((state) => ({
          notifications: {
            ...state.notifications,
            items: state.notifications.items.map(n =>
              n.id === id ? { ...n, isRead: true } : n
            ),
            unreadCount: Math.max(0, state.notifications.unreadCount - 1),
          }
        }), false, 'notifications/markRead')
      } catch {
        // ignore
      }
    },
    markAllRead: async () => {
      try {
        await notificationsApi.markAllRead()
        set((state) => ({
          notifications: {
            ...state.notifications,
            items: state.notifications.items.map(n => ({ ...n, isRead: true })),
            unreadCount: 0,
          }
        }), false, 'notifications/markAllRead')
      } catch {
        // ignore
      }
    },
    dismiss: (id) => {
      notificationsApi.delete(id).catch(() => {})
      set((state) => ({
        notifications: {
          ...state.notifications,
          items: state.notifications.items.filter((n) => n.id !== id),
        }
      }), false, 'notifications/dismiss')
    },
    clear: async () => {
      try {
        for (const item of get().notifications.items) {
          await notificationsApi.delete(item.id).catch(() => {})
        }
        set((state) => ({
          notifications: { ...state.notifications, items: [], unreadCount: 0 }
        }), false, 'notifications/clear')
      } catch {
        // ignore
      }
    },
  }
})
