import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-600 to-[#1a3c70] px-4">
      <div className="max-w-sm w-full">

        {/* Logo + identité */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-2xl shadow-lg px-6 py-3 inline-block mb-5">
            <img
              src="/logo-entete.png"
              alt="Direction Générale du Cadre de Vie"
              className="h-20 mx-auto"
            />
          </div>
          <h1 className="text-xl font-bold text-white leading-snug">
            Direction Générale du Cadre de Vie
          </h1>
          <p className="text-blue-200 text-sm mt-1">
            Direction de la Lutte contre les Encombrements
          </p>
          <p className="text-blue-300 text-xs mt-4">
            Connectez-vous pour accéder à la plateforme
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <LoginForm />
        </div>

        <div className="flex justify-center mt-5 gap-4">
          <p className="text-xs text-blue-300/70">v1.0.0 · PWA</p>
          <span className="text-blue-400/50">·</span>
          <Link to="/recherche" className="text-xs text-blue-300 hover:text-white underline">
            Recherche véhicule
          </Link>
        </div>
      </div>
    </div>
  )
}
