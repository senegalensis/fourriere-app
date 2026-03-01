import { useState, useEffect } from 'react'
import api from '@/api/client'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'
import SearchBar from '@/components/ui/SearchBar'
import { useAuth } from '@/hooks/useAuth'

interface VehiculeAuParc {
  id: string
  vehicule_matricule: string
  vehicule_marque: string | null
  vehicule_modele: string | null
  vehicule_couleur: string | null
  vehicule_vin: string | null
  cadre_saisie: string | null
  date_enlevement: string | null
  timestamp: string
  jours_parc: number | null
  zone_placement: string | null
  ordre_entree: number | null
  mainlevee_id: string | null
  dle_nom: string | null
  date_mainlevee: string | null
  mainlevee_statut: string | null
}

interface Mainlevee {
  id: string
  enlevement_id: string
  vehicule_matricule: string
  vehicule_marque: string | null
  vehicule_modele: string | null
  vehicule_couleur: string | null
  vehicule_vin: string | null
  cadre_saisie: string | null
  dle_nom: string
  dle_grade: string | null
  date_mainlevee: string
  statut: 'active' | 'utilisee'
  created_at: string
}

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const downloadPdf = async (url: string, filename: string) => {
  const token = localStorage.getItem('token')
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) return
  const blob = await res.blob()
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}

export default function DLEOfficePage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'parc' | 'historique'>('parc')

  const [vehicules, setVehicules] = useState<VehiculeAuParc[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<VehiculeAuParc | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ mainleveeId: string; matricule: string } | null>(null)
  const [form, setForm] = useState({
    dle_nom: user?.username || '',
    dle_grade: '',
    date_mainlevee: new Date().toISOString().split('T')[0],
  })

  const [historique, setHistorique] = useState<Mainlevee[]>([])
  const [histLoading, setHistLoading] = useState(false)
  const [histSearch, setHistSearch] = useState('')
  const [histPage, setHistPage] = useState(0)
  const [histTotal, setHistTotal] = useState(0)
  const HIST_LIMIT = 20

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

  const fetchHistorique = async (page = 0) => {
    setHistLoading(true)
    try {
      const { data } = await api.get('/mainlevees', { params: { limit: HIST_LIMIT, skip: page * HIST_LIMIT } })
      setHistorique(data.mainlevees)
      setHistTotal(data.total)
    } catch {
    } finally {
      setHistLoading(false)
    }
  }

  useEffect(() => { fetchVehicules() }, [])

  useEffect(() => {
    if (tab === 'historique') fetchHistorique(histPage)
  }, [tab, histPage])

  const filtered = vehicules.filter(v =>
    !search || v.vehicule_matricule.toUpperCase().includes(search.toUpperCase())
  )

  const filteredHist = historique.filter(m =>
    !histSearch || m.vehicule_matricule.toUpperCase().includes(histSearch.toUpperCase())
  )

  const openForm = (v: VehiculeAuParc) => {
    setSelected(v)
    setForm({ dle_nom: user?.username || '', dle_grade: '', date_mainlevee: new Date().toISOString().split('T')[0] })
    setError('')
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    setError('')
    try {
      const { data } = await api.post('/mainlevees', {
        enlevement_id: selected.id,
        dle_nom: form.dle_nom,
        dle_grade: form.dle_grade || null,
        date_mainlevee: form.date_mainlevee,
      })
      setSuccess({ mainleveeId: data.id, matricule: selected.vehicule_matricule })
      setSelected(null)
      fetchVehicules()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  const joursColor = (j: number | null) => {
    if (!j) return 'text-slate-500'
    if (j > 30) return 'text-red-600 font-bold'
    if (j > 7) return 'text-orange-500 font-semibold'
    return 'text-green-600'
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR')

  return (
    <div className="space-y-5 max-w-5xl">
      <PageHeader
        title="Mainlevées DLE"
        subtitle={`${vehicules.length} véhicule${vehicules.length !== 1 ? 's' : ''} au parc · ${histTotal} mainlevée${histTotal !== 1 ? 's' : ''} émise${histTotal !== 1 ? 's' : ''}`}
      />

      {/* Onglets */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setTab('parc')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'parc'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Véhicules au parc
          {vehicules.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">{vehicules.length}</span>
          )}
        </button>
        <button
          onClick={() => setTab('historique')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'historique'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Historique
          {histTotal > 0 && (
            <span className="ml-2 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">{histTotal}</span>
          )}
        </button>
      </div>

      {/* ===== ONGLET AU PARC ===== */}
      {tab === 'parc' && (
        <>
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-700 flex items-center justify-between gap-2">
              <span>Mainlevée créée pour <span className="font-mono font-bold">{success.matricule}</span></span>
              <button
                onClick={() => downloadPdf(`${API_BASE}/pdf/mainlevee/${success.mainleveeId}`, `mainlevee-${success.matricule}.pdf`)}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 shrink-0"
              >
                Télécharger PDF
              </button>
            </div>
          )}

          {selected && (
            <div className="bg-white rounded-2xl border-2 border-primary-300 overflow-hidden">
              <div className="bg-primary-600 px-5 py-4 flex items-center justify-between">
                <h2 className="text-white font-semibold">
                  Créer une mainlevée — <span className="font-mono">{selected.vehicule_matricule}</span>
                </h2>
                <button
                  onClick={() => setSelected(null)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm bg-primary-50 rounded-xl p-4">
                  <div><span className="text-primary-700 font-medium">Immatriculation :</span> <span className="font-mono">{selected.vehicule_matricule}</span></div>
                  <div><span className="text-primary-700 font-medium">Véhicule :</span> {[selected.vehicule_marque, selected.vehicule_modele].filter(Boolean).join(' ') || '—'}</div>
                  {selected.vehicule_vin && (
                    <div className="col-span-2"><span className="text-primary-700 font-medium">N° Série :</span> <span className="font-mono">{selected.vehicule_vin}</span></div>
                  )}
                  <div><span className="text-primary-700 font-medium">Motif :</span> {selected.cadre_saisie || '—'}</div>
                  <div><span className="text-primary-700 font-medium">Jours au parc :</span> <span className={joursColor(selected.jours_parc)}>{Math.floor(selected.jours_parc ?? 0)} j</span></div>
                </div>

                {selected.mainlevee_id && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    ⚠️ Une mainlevée active existe déjà pour ce véhicule. La créer à nouveau remplacera l'ancienne.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nom et prénoms du signataire *</label>
                    <input type="text" value={form.dle_nom} required
                      onChange={e => setForm(f => ({ ...f, dle_nom: e.target.value }))}
                      placeholder="Prénom Nom"
                      className="input-field" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Grade / Fonction</label>
                    <input type="text" value={form.dle_grade}
                      onChange={e => setForm(f => ({ ...f, dle_grade: e.target.value }))}
                      placeholder="Ex : Inspecteur, Chef de service…"
                      className="input-field" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Date de la mainlevée *</label>
                    <input type="date" value={form.date_mainlevee} required
                      onChange={e => setForm(f => ({ ...f, date_mainlevee: e.target.value }))}
                      className="input-field" />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
                )}

                <button type="submit" disabled={saving}
                  className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50 flex justify-center items-center gap-2">
                  {saving ? <Spinner size="sm" /> : null}
                  Émettre la mainlevée
                </button>
              </form>
            </div>
          )}

          <SearchBar
            value={search}
            onChange={setSearch}
            onClear={() => setSearch('')}
            placeholder="Filtrer par matricule…"
            uppercase
          />

          {loading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm text-center py-12 text-slate-400">
              <p className="font-medium">{vehicules.length === 0 ? 'Aucun véhicule au parc actuellement' : 'Aucun résultat'}</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Matricule</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden sm:table-cell">Véhicule</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Jours</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Mainlevée</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{v.vehicule_matricule}</td>
                      <td className="px-4 py-3 text-slate-700 hidden sm:table-cell">
                        {[v.vehicule_marque, v.vehicule_modele].filter(Boolean).join(' ') || '—'}
                        {v.vehicule_couleur && <span className="text-slate-400 ml-1">· {v.vehicule_couleur}</span>}
                      </td>
                      <td className={`px-4 py-3 font-medium ${joursColor(v.jours_parc)}`}>
                        {Math.floor(v.jours_parc ?? 0)} j
                      </td>
                      <td className="px-4 py-3">
                        {v.mainlevee_id ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="success">Active</Badge>
                            <button
                              onClick={() => downloadPdf(`${API_BASE}/pdf/mainlevee/${v.mainlevee_id}`, `mainlevee-${v.vehicule_matricule}.pdf`)}
                              className="text-xs text-primary-600 hover:underline"
                            >
                              PDF
                            </button>
                          </div>
                        ) : (
                          <Badge variant="neutral">Aucune</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openForm(v)}
                          className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700"
                        >
                          {v.mainlevee_id ? 'Renouveler' : 'Émettre mainlevée'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ===== ONGLET HISTORIQUE ===== */}
      {tab === 'historique' && (
        <>
          <SearchBar
            value={histSearch}
            onChange={setHistSearch}
            onClear={() => setHistSearch('')}
            placeholder="Filtrer par matricule…"
            uppercase
          />

          {histLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : filteredHist.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm text-center py-12 text-slate-400">
              <p className="font-medium">{historique.length === 0 ? "Aucune mainlevée émise pour l'instant" : 'Aucun résultat'}</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Matricule</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden sm:table-cell">Véhicule</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden md:table-cell">Signataire</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Statut</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHist.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{m.vehicule_matricule}</td>
                      <td className="px-4 py-3 text-slate-700 hidden sm:table-cell">
                        {[m.vehicule_marque, m.vehicule_modele].filter(Boolean).join(' ') || '—'}
                        {m.vehicule_couleur && <span className="text-slate-400 ml-1">· {m.vehicule_couleur}</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-700 hidden md:table-cell">
                        <div>{m.dle_nom}</div>
                        {m.dle_grade && <div className="text-xs text-slate-400">{m.dle_grade}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-700 text-xs">
                        {formatDate(m.date_mainlevee)}
                        <div className="text-slate-400">{formatDate(m.created_at)}</div>
                      </td>
                      <td className="px-4 py-3">
                        {m.statut === 'active' ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="neutral">Utilisée</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => downloadPdf(`${API_BASE}/pdf/mainlevee/${m.id}`, `mainlevee-${m.vehicule_matricule}.pdf`)}
                          className="px-3 py-1.5 border border-primary-300 text-primary-600 rounded-lg text-xs font-medium hover:bg-primary-50"
                        >
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {histTotal > HIST_LIMIT && (
                <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                  <span>{histPage * HIST_LIMIT + 1}–{Math.min((histPage + 1) * HIST_LIMIT, histTotal)} sur {histTotal}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setHistPage(p => p - 1)}
                      disabled={histPage === 0}
                      className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
                    >
                      ← Préc.
                    </button>
                    <button
                      onClick={() => setHistPage(p => p + 1)}
                      disabled={(histPage + 1) * HIST_LIMIT >= histTotal}
                      className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
                    >
                      Suiv. →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
