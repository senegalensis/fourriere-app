import { create } from 'zustand'
import api from '@/api/client'

interface User {
  id: string
  username: string
  role: string
  email?: string
}

interface AuthState {
  token: string | null
  user: User | null
  loading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  verify: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  loading: false,
  error: null,

  login: async (username, password) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post('/auth/login', { username, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      set({ token: data.token, user: data.user, loading: false })
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erreur de connexion'
      set({ error: message, loading: false })
      throw new Error(message)
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: null, user: null })
  },

  verify: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      set({ token: null, user: null })
      return
    }
    try {
      const { data } = await api.get('/auth/verify')
      localStorage.setItem('user', JSON.stringify(data.user))
      set({ user: data.user, token })
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      set({ token: null, user: null })
    }
  },

  clearError: () => set({ error: null })
}))
