import { useState, useEffect } from 'react'
import api from '@/api/client'
import Spinner from '@/components/ui/Spinner'

interface User {
  id: string
  username: string
  role: string
  email: string | null
  telephone: string | null
  actif: boolean
  created_at: string
  last_login: string | null
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin:      { label: 'Admin',           color: 'bg-red-100 text-red-800' },
  agent:      { label: 'Agent terrain',   color: 'bg-blue-100 text-blue-800' },
  fourriere:  { label: 'Agent Fourrière', color: 'bg-purple-100 text-purple-800' },
  greffe:     { label: 'Greffe',          color: 'bg-yellow-100 text-yellow-800' },
}

const ROLES = ['agent', 'fourriere', 'greffe', 'admin']

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Changement de mot de passe
  const [pwdUserId, setPwdUserId] = useState<string | null>(null)
  const [pwdUsername, setPwdUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState('')

  const [form, setForm] = useState({ username: '', password: '', role: 'agent', email: '', telephone: '' })

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/users')
      setUsers(data)
    } catch {
      setError('Erreur de chargement des utilisateurs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await api.post('/auth/register', form)
      setShowForm(false)
      setForm({ username: '', password: '', role: 'agent', email: '', telephone: '' })
      fetchUsers()
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  const toggleActif = async (user: User) => {
    try {
      await api.put(`/admin/users/${user.id}`, { actif: !user.actif })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, actif: !u.actif } : u))
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur')
    }
  }

  const openPwd = (user: User) => {
    setPwdUserId(user.id)
    setPwdUsername(user.username)
    setNewPassword('')
    setPwdError('')
    setPwdSuccess('')
  }

  const handlePwdChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pwdUserId) return
    setPwdSaving(true)
    setPwdError('')
    setPwdSuccess('')
    try {
      await api.put(`/admin/users/${pwdUserId}/password`, { password: newPassword })
      setPwdSuccess('Mot de passe mis à jour')
      setNewPassword('')
      setTimeout(() => { setPwdUserId(null); setPwdSuccess('') }, 1500)
    } catch (err: any) {
      setPwdError(err.response?.data?.error || 'Erreur')
    } finally {
      setPwdSaving(false)
    }
  }

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-sm text-gray-500">{users.length} compte{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
        >
          + Nouveau compte
        </button>
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border-2 border-primary-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Créer un compte</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Identifiant *</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mot de passe *</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rôle *</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]?.label || r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone</label>
              <input
                type="tel"
                value={form.telephone}
                onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Annuler</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex justify-center items-center gap-2">
              {saving ? <Spinner size="sm" /> : null} Créer
            </button>
          </div>
        </form>
      )}

      {/* Modal changement de mot de passe */}
      {pwdUserId && (
        <form onSubmit={handlePwdChange} className="bg-white border-2 border-orange-300 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Changer le mot de passe — <span className="font-mono text-orange-600">{pwdUsername}</span></h2>
            <button type="button" onClick={() => setPwdUserId(null)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nouveau mot de passe *</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              required
              minLength={6}
              placeholder="6 caractères minimum"
              autoFocus
            />
          </div>
          {pwdError && <p className="text-sm text-red-600">{pwdError}</p>}
          {pwdSuccess && <p className="text-sm text-green-600">✅ {pwdSuccess}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setPwdUserId(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Annuler</button>
            <button type="submit" disabled={pwdSaving} className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 flex justify-center items-center gap-2">
              {pwdSaving ? <Spinner size="sm" /> : null} Confirmer
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Identifiant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Rôle</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Dernière connexion</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className={`hover:bg-gray-50 ${!u.actif ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{u.username}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_LABELS[u.role]?.color || 'bg-gray-100 text-gray-700'}`}>
                      {ROLE_LABELS[u.role]?.label || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{u.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell text-xs">{formatDate(u.last_login)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActif(u)}
                      className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                        u.actif
                          ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                          : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'
                      }`}
                    >
                      {u.actif ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openPwd(u)}
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-orange-100 hover:text-orange-700 transition-colors"
                    >
                      Mot de passe
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
