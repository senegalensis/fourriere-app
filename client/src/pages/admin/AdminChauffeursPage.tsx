import { useState, useEffect } from 'react'
import api from '@/api/client'
import Spinner from '@/components/ui/Spinner'

interface Chauffeur {
  id: string
  prenom: string
  nom: string
  telephone: string | null
  matricule_plateau: string
  actif: boolean
  created_at: string
}

export default function AdminChauffeursPage() {
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Chauffeur | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const emptyForm = { prenom: '', nom: '', telephone: '', matricule_plateau: '' }
  const [form, setForm] = useState(emptyForm)

  const fetchChauffeurs = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/chauffeurs')
      setChauffeurs(data)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchChauffeurs() }, [])

  const openCreate = () => {
    setEditTarget(null)
    setForm(emptyForm)
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (c: Chauffeur) => {
    setEditTarget(c)
    setForm({ prenom: c.prenom, nom: c.nom, telephone: c.telephone || '', matricule_plateau: c.matricule_plateau })
    setFormError('')
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      if (editTarget) {
        await api.put(`/chauffeurs/${editTarget.id}`, form)
      } else {
        await api.post('/chauffeurs', form)
      }
      setShowForm(false)
      fetchChauffeurs()
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const toggleActif = async (c: Chauffeur) => {
    try {
      await api.put(`/chauffeurs/${c.id}`, { actif: !c.actif })
      setChauffeurs(prev => prev.map(x => x.id === c.id ? { ...x, actif: !c.actif } : x))
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chauffeurs plateau</h1>
          <p className="text-sm text-gray-500">{chauffeurs.length} chauffeur{chauffeurs.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
          + Ajouter
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border-2 border-primary-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">{editTarget ? 'Modifier le chauffeur' : 'Nouveau chauffeur'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Prénom *</label>
              <input type="text" value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom *</label>
              <input type="text" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone</label>
              <input type="tel" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Matricule plateau *</label>
              <input type="text" value={form.matricule_plateau} onChange={e => setForm(f => ({ ...f, matricule_plateau: e.target.value.toUpperCase() }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            </div>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Annuler</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex justify-center items-center gap-2">
              {saving ? <Spinner size="sm" /> : null}{editTarget ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {chauffeurs.length === 0 ? (
            <p className="text-center py-12 text-gray-400">Aucun chauffeur enregistré</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nom</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Matricule plateau</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Téléphone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {chauffeurs.map(c => (
                  <tr key={c.id} className={`hover:bg-gray-50 ${!c.actif ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.prenom} {c.nom}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">{c.matricule_plateau}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{c.telephone || '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActif(c)}
                        className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          c.actif ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'
                        }`}
                      >
                        {c.actif ? 'Actif' : 'Inactif'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(c)} className="text-xs text-primary-600 hover:underline">Modifier</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
