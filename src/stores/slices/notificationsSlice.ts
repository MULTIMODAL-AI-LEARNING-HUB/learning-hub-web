import type { StateCreator } from 'zustand'
import type { AppState, NotificationsSlice } from '../types'
import { notificationsApi } from '../../services/api'

const formatRelativeTime = (isoString: string): string => {
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    if (isNaN(diffMs) || diffMs < 0) return 'Vừa xong'
    const diffSec = Math.floor(diffMs / 1000)
    if (diffSec < 60) return 'Vừa xong'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin} phút trước`
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `${diffHours} giờ trước`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays} ngày trước`
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return ''
  }
}

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
              time: formatRelativeTime(n.created_at),
              isRead: n.is_read,
              type: n.type,
              related_id: n.related_id,
              related_type: n.related_type,
            })),
            unreadCount: res.data.unread_count,
          }
        }, false, 'notifications/fetch')
      } catch {
        // ignore
      }
    },
    markRead: async (id) => {
      const item = get().notifications.items.find(n => n.id === id)
      if (!item || item.isRead) return

      // Optimistic update: mark read & update unread count immediately
      set((state) => {
        const nextItems = state.notifications.items.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        )
        const nextUnread = nextItems.filter(n => !n.isRead).length
        return {
          notifications: {
            ...state.notifications,
            items: nextItems,
            unreadCount: nextUnread,
          }
        }
      }, false, 'notifications/markRead')

      try {
        await notificationsApi.markRead(id)
      } catch {
        // ignore
      }
    },
    markAllRead: async () => {
      if (get().notifications.unreadCount === 0) return

      // Optimistic update: all read immediately
      set((state) => ({
        notifications: {
          ...state.notifications,
          items: state.notifications.items.map(n => ({ ...n, isRead: true })),
          unreadCount: 0,
        }
      }), false, 'notifications/markAllRead')

      try {
        await notificationsApi.markAllRead()
      } catch {
        // ignore
      }
    },
    dismiss: (id) => {
      notificationsApi.delete(id).catch(() => {})
      set((state) => {
        const nextItems = state.notifications.items.filter((n) => n.id !== id)
        const nextUnread = nextItems.filter((n) => !n.isRead).length
        return {
          notifications: {
            ...state.notifications,
            items: nextItems,
            unreadCount: nextUnread,
          }
        }
      }, false, 'notifications/dismiss')
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
