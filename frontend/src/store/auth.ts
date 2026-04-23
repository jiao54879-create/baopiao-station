import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../utils/api'

interface User {
  id: number
  username: string
  email: string
  role: string
  teamId: number | null
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        const { data } = await api.post('/auth/login', { email, password })
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true
        })
      },

      register: async (username: string, email: string, password: string) => {
        const { data } = await api.post('/auth/register', { username, email, password })
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true
        })
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },

      checkAuth: async () => {
        const token = get().token
        if (!token) {
          set({ isLoading: false })
          return
        }
        try {
          const { data } = await api.get('/users/me')
          set({ user: data, isAuthenticated: true, isLoading: false })
        } catch {
          set({ user: null, token: null, isAuthenticated: false, isLoading: false })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token })
    }
  )
)
