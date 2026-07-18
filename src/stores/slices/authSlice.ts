import type { StateCreator } from 'zustand'
import type { AppState, AuthSlice, AxiosErrorLike } from '../types'
import { authApi, type AuthUser } from '../../services/api'

// Helper to map API User structure to frontend UserProfile structure
export const mapApiUser = (user: AuthUser) => ({
  id: user.id,
  name: user.full_name || user.email,
  role: user.role,
  initials: (user.full_name || user.email)
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2),
  quota: user.quota ? {
    storageUsed: user.quota.storage_used_mb,
    storageTotal: user.quota.storage_limit_mb,
    tokensUsed: user.quota.token_used,
    tokensTotal: user.quota.token_limit
  } : undefined
})

export const createAuthSlice: StateCreator<AppState, [['zustand/devtools', never]], [], AuthSlice> = (set, get) => ({
  auth: {
    isAuthenticated: !!localStorage.getItem('access_token'),
    user: null,
    token: localStorage.getItem('access_token'),
    login: async (email, password) => {
      try {
        const res = await authApi.login({ email, password })
        const { user, token } = res.data
        localStorage.setItem('access_token', token.access_token)
        if (token.refresh_token) localStorage.setItem('refresh_token', token.refresh_token)
        
        set((state) => ({
          auth: {
            ...state.auth,
            isAuthenticated: true,
            token: token.access_token,
            user: mapApiUser(user)
          }
        }), false, 'auth/login')
      } catch (err) {
        const apiErr = err as AxiosErrorLike
        const msg = apiErr.response?.data?.detail || apiErr.response?.data?.message || apiErr.message || 'Login failed'
        throw new Error(msg, { cause: err })
      }
    },
    register: async (email, password, fullName, role = 'student') => {
      try {
        const res = await authApi.register({ email, password, full_name: fullName, role })
        const { user, token } = res.data
        localStorage.setItem('access_token', token.access_token)
        if (token.refresh_token) localStorage.setItem('refresh_token', token.refresh_token)
        
        set((state) => ({
          auth: {
            ...state.auth,
            isAuthenticated: true,
            token: token.access_token,
            user: mapApiUser(user)
          }
        }), false, 'auth/register')
      } catch (err) {
        const apiErr = err as AxiosErrorLike
        const msg = apiErr.response?.data?.detail || apiErr.response?.data?.message || apiErr.message || 'Registration failed'
        throw new Error(msg, { cause: err })
      }
    },
    logout: () => {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      set((state) => ({
        auth: { ...state.auth, isAuthenticated: false, token: null }
      }), false, 'auth/logout')
    },
    loadUser: async () => {
      try {
        const res = await authApi.me()
        const user = res.data
        set((state) => ({
          auth: {
            ...state.auth,
            user: mapApiUser(user)
          }
        }), false, 'auth/loadUser')
      } catch {
        get().auth.logout()
      }
    },
    forgotPassword: async (email) => {
      try {
        await authApi.forgotPassword(email)
      } catch (err) {
        const apiErr = err as AxiosErrorLike
        const msg = apiErr.response?.data?.detail || apiErr.response?.data?.message || apiErr.message || 'Failed to send reset email'
        throw new Error(msg, { cause: err })
      }
    },
    resetPassword: async (token, password) => {
      try {
        await authApi.resetPassword(token, password)
      } catch (err) {
        const apiErr = err as AxiosErrorLike
        const msg = apiErr.response?.data?.detail || apiErr.response?.data?.message || apiErr.message || 'Failed to reset password'
        throw new Error(msg, { cause: err })
      }
    }
  }
})
