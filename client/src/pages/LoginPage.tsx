import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-800">Fourriere</h1>
          <p className="text-gray-500 mt-1">Connectez-vous pour continuer</p>
        </div>
        <div className="card">
          <LoginForm />
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">v1.0.0 - PWA</p>
      </div>
    </div>
  )
}
