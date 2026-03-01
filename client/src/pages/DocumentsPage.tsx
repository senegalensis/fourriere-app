import { useState, useEffect } from 'react'
import api from '@/api/client'
import Spinner from '@/components/ui/Spinner'

interface EnlevementDoc {
  id: string
  vehicule_matricule: string
  vehicule_marque: string | null
  vehicule_modele: string | null
  statut: string
  timestamp: string
}

interface ReceptionMap {
  [enlevement_id: string]: string // enlevement_id -> reception_id
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

      // Build a map: enlevement_id -> reception_id
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(inputValue)
    fetchData(inputValue)
  }

  const handleClear = () => {
    setInputValue('')
    setSearch('')
    fetchData('')
  }

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

  const statutBadge = (s: string) => {
    if (s === 'au_parc') return 'bg-green-100 text-green-700'
    if (s === 'en_route') return 'bg-blue-100 text-blue-700'
    return 'bg-gray-100 text-gray-500'
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Documents PDF</h1>
        <p className="text-sm text-gray-500">Générez les documents officiels pour chaque enlèvement</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-5">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value.toUpperCase())}
          placeholder="Rechercher par matricule..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button type="submit" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
          Rechercher
        </button>
        {search && (
          <button type="button" onClick={handleClear} className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm">
            ✕
          </button>
        )}
      </form>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : enlevements.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">📄</p>
          <p className="font-medium">Aucun enlèvement trouvé</p>
          {search && <p className="text-sm mt-1">pour le matricule « {search} »</p>}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Matricule</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Véhicule</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Date</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Rapport</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Bon d'entrée</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Bon de sortie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enlevements.map(e => {
                const receptionId = receptionMap[e.id] || null
                return (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">{e.vehicule_matricule}</td>
                    <td className="px-4 py-3 text-gray-700 hidden sm:table-cell">
                      {[e.vehicule_marque, e.vehicule_modele].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statutBadge(e.statut)}`}>
                        {e.statut.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{fmtDate(e.timestamp)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => downloadPdf(
                          `${API_BASE}/pdf/rapport-enlevement/${e.id}`,
                          `rapport-enlevement-${e.vehicule_matricule}.pdf`
                        )}
                        className="px-2 py-1 bg-primary-600 text-white rounded text-xs font-medium hover:bg-primary-700"
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
                          className="px-2 py-1 bg-primary-600 text-white rounded text-xs font-medium hover:bg-primary-700"
                        >
                          PDF
                        </button>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {e.statut === 'sorti' ? (
                        <button
                          onClick={() => downloadPdf(
                            `${API_BASE}/pdf/bon-sortie/${e.id}`,
                            `bon-sortie-${e.vehicule_matricule}.pdf`
                          )}
                          className="px-2 py-1 bg-orange-500 text-white rounded text-xs font-medium hover:bg-orange-600"
                        >
                          PDF
                        </button>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
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
