import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import api from '@/api/client'
import Spinner from '@/components/ui/Spinner'

interface VehiculeAuParc {
  id: string
  vehicule_matricule: string
  vehicule_marque: string | null
  vehicule_modele: string | null
  vehicule_couleur: string | null
  cadre_saisie: string | null
  agent: string
  date_entree_parc: string | null
  jours_parc: number | null
  ordre_entree: number | null
  zone_placement: string | null
  agent_responsable: string | null
}

const MODES_PAIEMENT = ['Espèces', 'Chèque', 'Virement', 'Mobile Money']
const MOTIFS_SORTIE = ['Rendue', 'Casse']

const downloadPdf = async (url: string, filename: string) => {
  const token = localStorage.getItem('token')
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) return
  const blob = await response.blob()
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}

export default function AdminSortiesPage() {
  const { user } = useAuth()
  const [vehicules, setVehicules] = useState<VehiculeAuParc[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<VehiculeAuParc | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [sortieId, setSortieId] = useState<string | null>(null)
  const [sortieMatricule, setSortieMatricule] = useState<string | null>(null)

  const [form, setForm] = useState({
    sortie_proprietaire: '',
    sortie_agent: user?.username || '',
    sortie_montant_paye: '',
    sortie_mode_paiement: 'Espèces',
    date_main_levee: '',
    bon_sortie_sendra: '',
    date_paiement_vae: '',
    motif_sortie: '',
  })

  const fetchVehicules = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/au-parc')
      setVehicules(data)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchVehicules() }, [])

  const filtered = vehicules.filter(v =>
    !search || v.vehicule_matricule.toUpperCase().includes(search.toUpperCase())
  )

  const openSortie = (v: VehiculeAuParc) => {
    setSelected(v)
    setForm({
      sortie_proprietaire: '',
      sortie_agent: user?.username || '',
      sortie_montant_paye: '',
      sortie_mode_paiement: 'Espèces',
      date_main_levee: '',
      bon_sortie_sendra: '',
      date_paiement_vae: '',
      motif_sortie: '',
    })
    setError('')
    setSuccess('')
    setSortieId(null)
    setSortieMatricule(null)
  }

  const handleSortie = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setProcessing(true)
    setError('')
    try {
      const { data } = await api.post('/admin/sorties', {
        enlevement_id: selected.id,
        sortie_proprietaire: form.sortie_proprietaire || null,
        sortie_agent: form.sortie_agent,
        sortie_montant_paye: form.sortie_montant_paye ? parseFloat(form.sortie_montant_paye) : null,
        sortie_mode_paiement: form.sortie_montant_paye ? form.sortie_mode_paiement : null,
        date_main_levee: form.date_main_levee || null,
        bon_sortie_sendra: form.bon_sortie_sendra || null,
        date_paiement_vae: form.date_paiement_vae || null,
        motif_sortie: form.motif_sortie || null,
      })
      setSuccess(`Véhicule ${selected.vehicule_matricule} sorti avec succès`)
      setSortieId(data.id)
      setSortieMatricule(selected.vehicule_matricule)
      setSelected(null)
      fetchVehicules()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du traitement')
    } finally {
      setProcessing(false)
    }
  }

  const joursColor = (j: number | null) => {
    if (!j) return 'text-gray-500'
    if (j > 30) return 'text-red-600 font-bold'
    if (j > 7) return 'text-orange-500 font-semibold'
    return 'text-green-600'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sorties de véhicules</h1>
        <p className="text-sm text-gray-500">{vehicules.length} véhicule{vehicules.length !== 1 ? 's' : ''} actuellement au parc</p>
      </div>

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center justify-between gap-2">
          <span>✅ {success}</span>
          {sortieId && sortieMatricule && (
            <button
              onClick={() => downloadPdf(
                `${import.meta.env.VITE_API_URL || '/api'}/pdf/bon-sortie/${sortieId}`,
                `bon-sortie-${sortieMatricule}.pdf`
              )}
              className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 shrink-0"
            >
              Télécharger Bon de sortie
            </button>
          )}
        </div>
      )}

      {/* Formulaire de sortie */}
      {selected && (
        <div className="bg-white border-2 border-orange-300 rounded-xl overflow-hidden">
          <div className="bg-orange-500 px-5 py-3 flex items-center justify-between">
            <h2 className="text-white font-semibold">
              Traiter la sortie — <span className="font-mono">{selected.vehicule_matricule}</span>
            </h2>
            <button onClick={() => setSelected(null)} className="text-white/80 hover:text-white text-sm">✕ Annuler</button>
          </div>
          <form onSubmit={handleSortie} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-orange-50 rounded-lg p-3">
              <div><span className="text-orange-600 font-medium">Marque/Modèle :</span> {[selected.vehicule_marque, selected.vehicule_modele].filter(Boolean).join(' ') || '—'}</div>
              <div><span className="text-orange-600 font-medium">Zone :</span> {selected.zone_placement || '—'}</div>
              <div><span className="text-orange-600 font-medium">Jours au parc :</span> <span className={joursColor(selected.jours_parc)}>{Math.floor(selected.jours_parc ?? 0)} j</span></div>
              <div><span className="text-orange-600 font-medium">Ordre entrée :</span> {selected.ordre_entree ? `#${selected.ordre_entree}` : '—'}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nom du propriétaire</label>
                <input type="text" value={form.sortie_proprietaire}
                  onChange={e => setForm(f => ({ ...f, sortie_proprietaire: e.target.value }))}
                  placeholder="Nom du récupérateur"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Agent traitant</label>
                <input type="text" value={form.sortie_agent}
                  onChange={e => setForm(f => ({ ...f, sortie_agent: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Montant payé (FCFA)</label>
                <input type="number" value={form.sortie_montant_paye} min="0"
                  onChange={e => setForm(f => ({ ...f, sortie_montant_paye: e.target.value }))}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mode de paiement</label>
                <select value={form.sortie_mode_paiement}
                  onChange={e => setForm(f => ({ ...f, sortie_mode_paiement: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                  {MODES_PAIEMENT.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date de main levée</label>
                <input type="date" value={form.date_main_levee}
                  onChange={e => setForm(f => ({ ...f, date_main_levee: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bon de sortie Sendra</label>
                <input type="text" value={form.bon_sortie_sendra}
                  onChange={e => setForm(f => ({ ...f, bon_sortie_sendra: e.target.value }))}
                  placeholder="N° bon Sendra"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date Paiement / VAE</label>
                <input type="date" value={form.date_paiement_vae}
                  onChange={e => setForm(f => ({ ...f, date_paiement_vae: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Motif de sortie</label>
                <select value={form.motif_sortie}
                  onChange={e => setForm(f => ({ ...f, motif_sortie: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="">— Sélectionner —</option>
                  {MOTIFS_SORTIE.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={processing}
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50 flex justify-center items-center gap-2">
              {processing ? <Spinner size="sm" /> : null}
              Confirmer la sortie
            </button>
          </form>
        </div>
      )}

      {/* Barre de recherche */}
      <input type="text" value={search} onChange={e => setSearch(e.target.value.toUpperCase())}
        placeholder="Filtrer par matricule..."
        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🏛️</p>
          <p>{vehicules.length === 0 ? 'Aucun véhicule au parc actuellement' : 'Aucun résultat pour ce matricule'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Matricule</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Véhicule</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Zone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Jours</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Agent réception</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">{v.vehicule_matricule}</td>
                  <td className="px-4 py-3 text-gray-700 hidden sm:table-cell">
                    {[v.vehicule_marque, v.vehicule_modele].filter(Boolean).join(' ') || '—'}
                    {v.vehicule_couleur && <span className="text-gray-400 ml-1">· {v.vehicule_couleur}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {v.zone_placement ? (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">{v.zone_placement}</span>
                    ) : '—'}
                  </td>
                  <td className={`px-4 py-3 ${joursColor(v.jours_parc)}`}>
                    {Math.floor(v.jours_parc ?? 0)} j
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{v.agent_responsable || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openSortie(v)}
                      className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600">
                      Traiter sortie
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
