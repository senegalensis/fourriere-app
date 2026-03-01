import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '@/api/client'
import Spinner from '@/components/ui/Spinner'

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

const ZONE_COLORS: Record<string, string> = {
  Sendra: 'bg-purple-100 text-purple-800',
  Ministere: 'bg-blue-100 text-blue-800',
  'Ville de Dakar': 'bg-green-100 text-green-800',
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
      const params: Record<string, string | number> = {
        limit: LIMIT,
        skip: pageNum * LIMIT,
      }
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    fetchReceptions(searchMatricule, 0)
  }

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('fr-FR') : '—'

  const formatHeure = (h: string) => (h ? h.slice(0, 5) : '—')

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Véhicules reçus</h1>
          <p className="text-sm text-gray-500">{total} réception{total !== 1 ? 's' : ''} au total</p>
        </div>
        <Link
          to="/reception/nouvelle"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
        >
          + Nouvelle réception
        </Link>
      </div>

      {/* Barre de recherche */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-5">
        <input
          type="text"
          value={searchMatricule}
          onChange={(e) => setSearchMatricule(e.target.value.toUpperCase())}
          placeholder="Rechercher par matricule..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
        >
          Rechercher
        </button>
        {searchMatricule && (
          <button
            type="button"
            onClick={() => { setSearchMatricule(''); setPage(0); fetchReceptions('', 0) }}
            className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
          >
            ✕
          </button>
        )}
      </form>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      ) : receptions.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">🏛️</p>
          <p className="font-medium">Aucune réception enregistrée</p>
          {searchMatricule && <p className="text-sm mt-1">pour le matricule « {searchMatricule} »</p>}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">N° Entrée</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Matricule</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Véhicule</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Zone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Agent reçu</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date entrée</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {receptions.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold text-sm">
                        {r.ordre_entree}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-gray-900">{r.vehicule_matricule}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-700">
                      {[r.vehicule_marque, r.vehicule_modele].filter(Boolean).join(' ') || '—'}
                      {r.vehicule_couleur && (
                        <span className="text-gray-400 ml-1">· {r.vehicule_couleur}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.zone_placement ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ZONE_COLORS[r.zone_placement] || 'bg-gray-100 text-gray-700'}`}>
                          {r.zone_placement}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-700">
                      {r.agent_responsable}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(r.date_entree)}
                      <span className="text-gray-400 ml-1 text-xs">{formatHeure(r.heure_entree)}</span>
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

          {/* Pagination */}
          {total > LIMIT && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
              <span>
                {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} sur {total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                >
                  ← Précédent
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={(page + 1) * LIMIT >= total}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
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
