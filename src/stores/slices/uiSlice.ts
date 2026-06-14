import type { StateCreator } from 'zustand'
import type { AppState, UISlice } from '../types'

export const createUISlice: StateCreator<AppState, [['zustand/devtools', never]], [], UISlice> = (set) => ({
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
