import { useState, useEffect } from 'react'
import api from '@/api/client'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import SearchBar from '@/components/ui/SearchBar'
import PageHeader from '@/components/ui/PageHeader'

interface EnlevementDoc {
  id: string
  vehicule_matricule: string
  vehicule_marque: string | null
  vehicule_modele: string | null
  statut: string
  timestamp: string
}

interface ReceptionMap {
  [enlevement_id: string]: string
}

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

type StatutVariant = 'info' | 'success' | 'neutral'

const STATUT_VARIANT: Record<string, StatutVariant> = {
  au_parc: 'success',
  en_route: 'info',
  sorti: 'neutral',
}

const STATUT_LABELS: Record<string, string> = {
  au_parc: 'Au parc',
  en_route: 'En route',
  sorti: 'Sorti',
}

export default function DocumentsPage() {
  const [enlevements, setEnlevements] = useState<EnlevementDoc[]>([])
  const [receptionMap, setReceptionMap] = useState<ReceptionMap>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [inputValue, setInputValue] = useState('')

  const fetchData = async (matricule: string) => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { limit: 100, skip: 0 }
      if (matricule) params.matricule = matricule

      const [enlRes, recRes] = await Promise.all([
        api.get('/enlevements', { params }),
        api.get('/receptions', { params: { limit: 500, skip: 0 } }).catch(() => ({ data: { receptions: [] } }))
      ])

      setEnlevements(enlRes.data.enlevements || [])

      const map: ReceptionMap = {}
      for (const r of recRes.data.receptions || []) {
        if (r.enlevement_id) map[r.enlevement_id] = r.id
      }
      setReceptionMap(map)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData('') }, [])

  const handleSearch = () => {
    setSearch(inputValue)
    fetchData(inputValue)
  }

  const handleClear = () => {
    setInputValue('')
    setSearch('')
    fetchData('')
  }

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

  return (
    <div className="space-y-5 max-w-5xl">
      <PageHeader
        title="Documents PDF"
        subtitle="Générez les documents officiels pour chaque enlèvement"
      />

      <SearchBar
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSearch}
        onClear={handleClear}
        placeholder="Rechercher par matricule…"
        uppercase
      />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : enlevements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm text-center py-16 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 mx-auto mb-3 text-slate-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="font-medium">Aucun enlèvement trouvé</p>
          {search && <p className="text-sm mt-1">pour le matricule « {search} »</p>}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Matricule</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden sm:table-cell">Véhicule</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden md:table-cell">Date</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Rapport</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Bon d'entrée</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Bon de sortie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enlevements.map(e => {
                const receptionId = receptionMap[e.id] || null
                return (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{e.vehicule_matricule}</td>
                    <td className="px-4 py-3 text-slate-700 hidden sm:table-cell">
                      {[e.vehicule_marque, e.vehicule_modele].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUT_VARIANT[e.statut] ?? 'neutral'}>
                        {STATUT_LABELS[e.statut] || e.statut.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell text-xs">{fmtDate(e.timestamp)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => downloadPdf(
                          `${API_BASE}/pdf/rapport-enlevement/${e.id}`,
                          `rapport-enlevement-${e.vehicule_matricule}.pdf`
                        )}
                        className="px-2.5 py-1 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700"
                      >
                        PDF
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {receptionId ? (
                        <button
                          onClick={() => downloadPdf(
                            `${API_BASE}/pdf/bon-entree/${receptionId}`,
                            `bon-entree-${e.vehicule_matricule}.pdf`
                          )}
                          className="px-2.5 py-1 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700"
                        >
                          PDF
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {e.statut === 'sorti' ? (
                        <button
                          onClick={() => downloadPdf(
                            `${API_BASE}/pdf/bon-sortie/${e.id}`,
                            `bon-sortie-${e.vehicule_matricule}.pdf`
                          )}
                          className="px-2.5 py-1 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600"
                        >
                          PDF
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
