import { useState, FormEvent } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Spinner from '@/components/ui/Spinner'

export default function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, error, clearError } = useAuth()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await login(username, password)
    } catch {
      // error is set in store
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</label>
        <input
          type="text"
          value={username}
          onChange={(e) => { setUsername(e.target.value); clearError() }}
          className="input-field"
          placeholder="agent1"
          required
          autoComplete="username"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); clearError() }}
          className="input-field"
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </div>
      <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
        {loading ? <Spinner size="sm" /> : null}
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>
    </form>
  )
}
