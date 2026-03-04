import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import api from '@/api/client'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'
import SearchBar from '@/components/ui/SearchBar'

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
  mainlevee_id: string | null
  dle_nom: string | null
  date_mainlevee: string | null
  mainlevee_statut: string | null
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
    proprietaire_adresse: '',
    proprietaire_telephone: '',
    sortie_agent: user?.username || '',
    sortie_montant_paye: '',
    sortie_mode_paiement: 'Espèces',
    reference_paiement: '',
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
      proprietaire_adresse: '',
      proprietaire_telephone: '',
      sortie_agent: user?.username || '',
      sortie_montant_paye: '',
      sortie_mode_paiement: 'Espèces',
      reference_paiement: '',
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
        proprietaire_adresse: form.proprietaire_adresse || null,
        proprietaire_telephone: form.proprietaire_telephone || null,
        sortie_agent: form.sortie_agent,
        sortie_montant_paye: form.sortie_montant_paye ? parseFloat(form.sortie_montant_paye) : null,
        sortie_mode_paiement: form.sortie_montant_paye ? form.sortie_mode_paiement : null,
        reference_paiement: form.reference_paiement || null,
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
    if (!j) return 'text-slate-500'
    if (j > 30) return 'text-red-600 font-bold'
    if (j > 7) return 'text-orange-500 font-semibold'
    return 'text-green-600'
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <PageHeader
        title="Sorties de véhicules"
        subtitle={`${vehicules.length} véhicule${vehicules.length !== 1 ? 's' : ''} actuellement au parc`}
      />

      {/* Banner succès */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-600 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {success}
          </div>
          {sortieId && sortieMatricule && (
            <button
              onClick={() => downloadPdf(
                `${import.meta.env.VITE_API_URL || '/api'}/pdf/bon-sortie/${sortieId}`,
                `bon-sortie-${sortieMatricule}.pdf`
              )}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 shrink-0"
            >
              Télécharger Bon de sortie
            </button>
          )}
        </div>
      )}

      {/* Formulaire de sortie */}
      {selected && (
        <div className="bg-white rounded-2xl border-2 border-orange-300 overflow-hidden">
          <div className="bg-orange-500 px-5 py-4 flex items-center justify-between">
            <h2 className="text-white font-semibold">
              Traiter la sortie — <span className="font-mono">{selected.vehicule_matricule}</span>
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

          <form onSubmit={handleSortie} className="p-5 space-y-5">
            {/* Résumé véhicule */}
            <div className="grid grid-cols-2 gap-3 text-sm bg-orange-50 rounded-xl p-4">
              <div><span className="text-orange-600 font-medium">Marque/Modèle :</span> {[selected.vehicule_marque, selected.vehicule_modele].filter(Boolean).join(' ') || '—'}</div>
              <div><span className="text-orange-600 font-medium">Zone :</span> {selected.zone_placement || '—'}</div>
              <div><span className="text-orange-600 font-medium">Jours au parc :</span> <span className={joursColor(selected.jours_parc)}>{Math.floor(selected.jours_parc ?? 0)} j</span></div>
              <div><span className="text-orange-600 font-medium">Ordre entrée :</span> {selected.ordre_entree ? `#${selected.ordre_entree}` : '—'}</div>
            </div>

            {/* Indicateur mainlevée */}
            {selected.mainlevee_id ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-600 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <div>
                  <p className="font-medium text-green-800">Mainlevée DLE active</p>
                  <p className="text-green-600 text-xs">{selected.dle_nom} · {selected.date_mainlevee ? new Date(selected.date_mainlevee).toLocaleDateString('fr-FR') : ''}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-red-500 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <div>
                  <p className="font-medium text-red-800">Mainlevée DLE manquante</p>
                  <p className="text-red-600 text-xs">Une mainlevée DLE Office active est requise avant de traiter la sortie.</p>
                </div>
              </div>
            )}

            {/* Propriétaire */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Propriétaire</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nom et prénoms</label>
                  <input type="text" value={form.sortie_proprietaire}
                    onChange={e => setForm(f => ({ ...f, sortie_proprietaire: e.target.value }))}
                    placeholder="Nom du récupérateur"
                    className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Téléphone</label>
                  <input type="tel" value={form.proprietaire_telephone}
                    onChange={e => setForm(f => ({ ...f, proprietaire_telephone: e.target.value }))}
                    placeholder="7X XXX XX XX"
                    className="input-field" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Adresse</label>
                  <input type="text" value={form.proprietaire_adresse}
                    onChange={e => setForm(f => ({ ...f, proprietaire_adresse: e.target.value }))}
                    placeholder="Quartier, Ville"
                    className="input-field" />
                </div>
              </div>
            </div>

            {/* Paiement & sortie */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Paiement &amp; sortie</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Agent traitant</label>
                  <input type="text" value={form.sortie_agent}
                    onChange={e => setForm(f => ({ ...f, sortie_agent: e.target.value }))}
                    className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Montant payé (FCFA)</label>
                  <input type="number" value={form.sortie_montant_paye} min="0"
                    onChange={e => setForm(f => ({ ...f, sortie_montant_paye: e.target.value }))}
                    placeholder="0"
                    className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Mode de paiement</label>
                  <select value={form.sortie_mode_paiement}
                    onChange={e => setForm(f => ({ ...f, sortie_mode_paiement: e.target.value }))}
                    className="input-field">
                    {MODES_PAIEMENT.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Référence de paiement</label>
                  <input type="text" value={form.reference_paiement}
                    onChange={e => setForm(f => ({ ...f, reference_paiement: e.target.value }))}
                    placeholder="N° référence"
                    className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date de main levée</label>
                  <input type="date" value={form.date_main_levee}
                    onChange={e => setForm(f => ({ ...f, date_main_levee: e.target.value }))}
                    className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Bon de sortie Sendra</label>
                  <input type="text" value={form.bon_sortie_sendra}
                    onChange={e => setForm(f => ({ ...f, bon_sortie_sendra: e.target.value }))}
                    placeholder="N° bon Sendra"
                    className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date Paiement / VAE</label>
                  <input type="date" value={form.date_paiement_vae}
                    onChange={e => setForm(f => ({ ...f, date_paiement_vae: e.target.value }))}
                    className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Motif de sortie</label>
                  <select value={form.motif_sortie}
                    onChange={e => setForm(f => ({ ...f, motif_sortie: e.target.value }))}
                    className="input-field">
                    <option value="">— Sélectionner —</option>
                    {MOTIFS_SORTIE.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
            )}

            <button
              type="submit"
              disabled={processing || !selected.mainlevee_id}
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {processing ? <Spinner size="sm" /> : null}
              {!selected.mainlevee_id ? '🔒 Mainlevée requise' : 'Confirmer la sortie'}
            </button>
          </form>
        </div>
      )}

      {/* Filtre + tableau */}
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
          <p className="font-medium">{vehicules.length === 0 ? 'Aucun véhicule au parc actuellement' : 'Aucun résultat pour ce matricule'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Matricule</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden sm:table-cell">Véhicule</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Zone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Jours</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden md:table-cell">Agent réception</th>
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
                  <td className="px-4 py-3">
                    {v.zone_placement ? (
                      <Badge variant="info">{v.zone_placement}</Badge>
                    ) : '—'}
                  </td>
                  <td className={`px-4 py-3 ${joursColor(v.jours_parc)}`}>
                    {Math.floor(v.jours_parc ?? 0)} j
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{v.agent_responsable || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openSortie(v)}
                      className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600"
                    >
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
