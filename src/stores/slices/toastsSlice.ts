import type { StateCreator } from 'zustand'
import type { AppState, ToastsSlice } from '../types'

let toastCounter = 0

export const createToastsSlice: StateCreator<AppState, [['zustand/devtools', never]], [], ToastsSlice> = (set) => ({
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
