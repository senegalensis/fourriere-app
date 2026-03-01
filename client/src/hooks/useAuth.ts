import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const { user, token, loading, error, login, logout, verify, clearError } = useAuthStore()

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    isAgent: user?.role === 'agent',
    isFourriere: user?.role === 'fourriere',
    isGreffe: user?.role === 'greffe',
    login,
    logout,
    verify,
    clearError
  }
}
