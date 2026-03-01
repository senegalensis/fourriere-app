import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import api from '@/api/client'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'

const ROLE_LABELS: Record<string, { label: string; variant: 'danger' | 'info' | 'purple' | 'success' | 'neutral' }> = {
  admin:      { label: 'Administrateur',  variant: 'danger' },
  agent:      { label: 'Agent de terrain', variant: 'info' },
  fourriere:  { label: 'Agent fourrière', variant: 'purple' },
  dle_office: { label: 'DLE Office',      variant: 'success' },
  public:     { label: 'Public',          variant: 'neutral' },
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (form.new_password !== form.confirm_password) {
      setError('Les nouveaux mots de passe ne correspondent pas')
      return
    }
    if (form.new_password.length < 6) {
      setError('Le nouveau mot de passe doit faire au moins 6 caractères')
      return
    }
    setLoading(true)
    try {
      await api.put('/auth/password', {
        current_password: form.current_password,
        new_password: form.new_password,
      })
      setSuccess('Mot de passe mis à jour avec succès')
      setForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  const roleInfo = ROLE_LABELS[user?.role || '']

  return (
    <div className="max-w-md space-y-5">
      {/* Carte identité */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold shrink-0">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{user?.username}</p>
            {roleInfo && (
              <Badge variant={roleInfo.variant} className="mt-1">{roleInfo.label}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Changement de mot de passe */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Changer le mot de passe</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Mot de passe actuel</label>
            <input
              type="password"
              value={form.current_password}
              onChange={e => setForm(f => ({ ...f, current_password: e.target.value }))}
              className="input-field"
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nouveau mot de passe</label>
            <input
              type="password"
              value={form.new_password}
              onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))}
              className="input-field"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              value={form.confirm_password}
              onChange={e => setForm(f => ({ ...f, confirm_password: e.target.value }))}
              className="input-field"
              required
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">{success}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
          >
            {loading ? <Spinner size="sm" /> : null}
            Mettre à jour le mot de passe
          </button>
        </form>
      </div>
    </div>
  )
}
