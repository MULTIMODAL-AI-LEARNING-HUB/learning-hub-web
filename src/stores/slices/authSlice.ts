import type { StateCreator } from 'zustand'
import type { AppState, AuthSlice, AxiosErrorLike } from '../types'
import { authApi, clearAccessToken, setAccessToken, type AuthUser } from '../../services/api'

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

// Helper for resilient localStorage access in browser and test environments
const safeLocalStorage = {
  get: (key: string): string | null => {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null
    } catch {
      return null
    }
  },
  set: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined') localStorage.setItem(key, value)
    } catch {
      // Ignore storage write errors
    }
  },
  remove: (key: string): void => {
    try {
      if (typeof window !== 'undefined') localStorage.removeItem(key)
    } catch {
      // Ignore storage remove errors
    }
  }
}

export const createAuthSlice: StateCreator<AppState, [['zustand/devtools', never]], [], AuthSlice> = (set, get) => {
  return {
    auth: {
      isAuthenticated: false,
      isLoadingUser: true,
      user: null,
      token: null,
      login: async (email, password, rememberMe = true) => {
        try {
          const res = await authApi.login({ email, password })
          const { user, token } = res.data
          void rememberMe // Refresh-token persistence is controlled by the HttpOnly cookie.
          setAccessToken(token.access_token)
          safeLocalStorage.set('token', token.access_token)
          safeLocalStorage.set('access_token', token.access_token)

          set((state) => ({
            auth: {
              ...state.auth,
              isAuthenticated: true,
              isLoadingUser: false,
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
          setAccessToken(token.access_token)
          safeLocalStorage.set('token', token.access_token)
          safeLocalStorage.set('access_token', token.access_token)

          set((state) => ({
            auth: {
              ...state.auth,
              isAuthenticated: true,
              isLoadingUser: false,
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
      googleLogin: async (idToken: string) => {
        try {
          const res = await authApi.googleLogin(idToken)
          const { user, token } = res.data
          setAccessToken(token.access_token)

          set((state) => ({
            auth: {
              ...state.auth,
              isAuthenticated: true,
              isLoadingUser: false,
              token: token.access_token,
              user: mapApiUser(user)
            }
          }), false, 'auth/googleLogin')
        } catch (err) {
          const apiErr = err as AxiosErrorLike
          const msg = apiErr.response?.data?.detail || apiErr.response?.data?.message || apiErr.message || 'Google login failed'
          throw new Error(msg, { cause: err })
        }
      },
      facebookLogin: async (accessToken: string) => {
        try {
          const res = await authApi.facebookLogin(accessToken)
          const { user, token } = res.data
          setAccessToken(token.access_token)

          set((state) => ({
            auth: {
              ...state.auth,
              isAuthenticated: true,
              isLoadingUser: false,
              token: token.access_token,
              user: mapApiUser(user)
            }
          }), false, 'auth/facebookLogin')
        } catch (err) {
          const apiErr = err as AxiosErrorLike
          const msg = apiErr.response?.data?.detail || apiErr.response?.data?.message || apiErr.message || 'Facebook login failed'
          throw new Error(msg, { cause: err })
        }
      },
      logout: async () => {
        try {
          await authApi.logout()
        } catch {
          // Ignore network errors on logout
        } finally {
          clearAccessToken()
          safeLocalStorage.remove('token')
          safeLocalStorage.remove('access_token')
          set((state) => ({
            auth: {
              ...state.auth,
              isAuthenticated: false,
              isLoadingUser: false,
              token: null,
              user: null
            }
          }), false, 'auth/logout')
        }
      },
      restoreSession: async () => {
        try {
          const res = await authApi.refresh()
          setAccessToken(res.data.access_token)
          safeLocalStorage.set('token', res.data.access_token)
          safeLocalStorage.set('access_token', res.data.access_token)
          await get().auth.loadUser()
        } catch {
          const fallbackToken = safeLocalStorage.get('access_token') || safeLocalStorage.get('token')
          if (fallbackToken) {
            setAccessToken(fallbackToken)
            try {
              await get().auth.loadUser()
              return
            } catch {
              clearAccessToken()
            }
          }
          clearAccessToken()
          safeLocalStorage.remove('token')
          safeLocalStorage.remove('access_token')
          set((state) => ({
            auth: {
              ...state.auth,
              isAuthenticated: false,
              isLoadingUser: false,
              token: null,
              user: null,
            }
          }), false, 'auth/restoreSession/empty')
        }
      },
      loadUser: async () => {
        set((state) => ({
          auth: { ...state.auth, isLoadingUser: true }
        }), false, 'auth/loadUser/start')
        try {
          const res = await authApi.me()
          const user = res.data
          set((state) => ({
            auth: {
              ...state.auth,
              isAuthenticated: true,
              user: mapApiUser(user),
              isLoadingUser: false
            }
          }), false, 'auth/loadUser/success')
        } catch {
          await get().auth.logout()
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
}
}
