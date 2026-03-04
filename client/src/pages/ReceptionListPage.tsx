import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '@/api/client'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import SearchBar from '@/components/ui/SearchBar'
import PageHeader from '@/components/ui/PageHeader'

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

const API_BASE = import.meta.env.VITE_API_URL || '/api'

interface Reception {
  id: string
  ordre_entree: number
  vehicule_matricule: string
  vehicule_marque: string
  vehicule_modele: string
  vehicule_couleur: string
  agent_responsable: string
  date_entree: string
  heure_entree: string
  zone_placement: string
  observations: string
  agent_enlevement: string
  cadre_saisie: string
  created_at: string
}

type ZoneVariant = 'purple' | 'info' | 'success' | 'neutral'

const ZONE_VARIANT: Record<string, ZoneVariant> = {
  Sendra:         'purple',
  Ministere:      'info',
  'Ville de Dakar': 'success',
}

export default function ReceptionListPage() {
  const [receptions, setReceptions] = useState<Reception[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchMatricule, setSearchMatricule] = useState('')
  const [page, setPage] = useState(0)
  const LIMIT = 20

  const fetchReceptions = async (search: string, pageNum: number) => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string | number> = { limit: LIMIT, skip: pageNum * LIMIT }
      if (search) params.matricule = search
      const { data } = await api.get('/receptions', { params })
      setReceptions(data.receptions)
      setTotal(data.total)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReceptions(searchMatricule, page)
  }, [page])

  const handleSearch = () => {
    setPage(0)
    fetchReceptions(searchMatricule, 0)
  }

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
  const formatHeure = (h: string) => (h ? h.slice(0, 5) : '—')

  return (
    <div className="space-y-5 max-w-5xl">
      <PageHeader
        title="Véhicules reçus"
        subtitle={`${total} réception${total !== 1 ? 's' : ''} au total`}
        actions={
          <Link to="/reception/nouvelle" className="btn-primary text-sm">
            + Nouvelle réception
          </Link>
        }
      />

      <SearchBar
        value={searchMatricule}
        onChange={setSearchMatricule}
        onSubmit={handleSearch}
        onClear={() => { setSearchMatricule(''); setPage(0); fetchReceptions('', 0) }}
        placeholder="Rechercher par matricule…"
        uppercase
      />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      ) : receptions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm text-center py-16 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 mx-auto mb-3 text-slate-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
          <p className="font-medium">Aucune réception enregistrée</p>
          {searchMatricule && <p className="text-sm mt-1">pour le matricule « {searchMatricule} »</p>}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">N° Entrée</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Matricule</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden sm:table-cell">Véhicule</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Zone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden md:table-cell">Agent reçu</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receptions.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-bold text-sm">
                        {r.ordre_entree}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-slate-900">{r.vehicule_matricule}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-slate-700">
                      {[r.vehicule_marque, r.vehicule_modele].filter(Boolean).join(' ') || '—'}
                      {r.vehicule_couleur && <span className="text-slate-400 ml-1">· {r.vehicule_couleur}</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.zone_placement ? (
                        <Badge variant={ZONE_VARIANT[r.zone_placement] ?? 'neutral'}>
                          {r.zone_placement}
                        </Badge>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-700">{r.agent_responsable}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {formatDate(r.date_entree)}
                      <span className="text-slate-400 ml-1">{formatHeure(r.heure_entree)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => downloadPdf(
                          `${API_BASE}/pdf/bon-entree/${r.id}`,
                          `bon-entree-${r.vehicule_matricule}.pdf`
                        )}
                        className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700"
                      >
                        Bon d'entrée
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > LIMIT && (
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>{page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} sur {total}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  ← Précédent
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={(page + 1) * LIMIT >= total}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  Suivant →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
