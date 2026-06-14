import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { AppState } from './types'
import { createAuthSlice } from './slices/authSlice'
import { createDocumentsSlice } from './slices/documentsSlice'
import { createChatSlice } from './slices/chatSlice'
import { createNotificationsSlice } from './slices/notificationsSlice'
import { createUISlice } from './slices/uiSlice'
import { createStudySlice } from './slices/studySlice'
import { createToastsSlice } from './slices/toastsSlice'

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
