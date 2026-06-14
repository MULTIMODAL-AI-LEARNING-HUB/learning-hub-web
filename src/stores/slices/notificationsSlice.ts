import type { StateCreator } from 'zustand'
import type { AppState, NotificationsSlice } from '../types'
import { notifications as initNotifs } from '../../data/mockData'

export const createNotificationsSlice: StateCreator<AppState, [['zustand/devtools', never]], [], NotificationsSlice> = (set) => ({
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
