import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/api/client'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import SearchBar from '@/components/ui/SearchBar'
import PageHeader from '@/components/ui/PageHeader'

interface Enlevement {
  id: string
  vehicule_matricule: string
  vehicule_marque: string
  vehicule_couleur: string
  agent: string
  statut: string
  timestamp: string
  lieu_enlevement?: string
}

const STATUT_LABELS: Record<string, string> = {
  '': 'Tous',
  en_route: 'En route',
  au_parc: 'Au parc',
  sorti: 'Sortis',
}

type StatutVariant = 'info' | 'success' | 'neutral'

const STATUT_VARIANT: Record<string, StatutVariant> = {
  en_route: 'info',
  au_parc: 'success',
  sorti: 'neutral',
}

const LIMIT = 20

export default function EnlevementsListPage() {
  const [enlevements, setEnlevements] = useState<Enlevement[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statut, setStatut] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(0)

  const loadData = async (s: string, mat: string, p: number) => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { limit: LIMIT, skip: p * LIMIT }
      if (s) params.statut = s
      if (mat) params.matricule = mat
      const { data } = await api.get('/enlevements', { params })
      setEnlevements(data.enlevements)
      setTotal(data.total ?? data.enlevements.length)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(statut, search, page)
  }, [statut, search, page])

  const handleStatut = (s: string) => {
    setStatut(s)
    setPage(0)
  }

  const handleSearch = () => {
    setSearch(searchInput.trim().toUpperCase())
    setPage(0)
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearch('')
    setPage(0)
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader
        title="Enlèvements"
        subtitle={total > 0 ? `${total} résultat${total !== 1 ? 's' : ''}` : undefined}
        actions={
          <Link to="/enlevements/nouveau" className="btn-primary text-sm">
            + Nouveau
          </Link>
        }
      />

      {/* Filtres statut */}
      <div className="flex gap-2 flex-wrap">
        {(['', 'en_route', 'au_parc', 'sorti'] as const).map(s => (
          <button
            key={s}
            onClick={() => handleStatut(s)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              statut === s
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {STATUT_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Recherche matricule */}
      <SearchBar
        value={searchInput}
        onChange={setSearchInput}
        onSubmit={handleSearch}
        onClear={clearSearch}
        placeholder="Rechercher par matricule…"
        uppercase
      />

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : enlevements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm text-center py-16 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 mx-auto mb-3 text-slate-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="font-medium">Aucun enlèvement trouvé</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Matricule</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden sm:table-cell">Véhicule</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden md:table-cell">Agent</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden md:table-cell">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enlevements.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-slate-900">{e.vehicule_matricule}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                      {e.vehicule_marque} {e.vehicule_couleur && <span className="text-slate-400">· {e.vehicule_couleur}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUT_VARIANT[e.statut] ?? 'neutral'}>
                        {STATUT_LABELS[e.statut] || e.statut}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{e.agent}</td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell text-xs">
                      {new Date(e.timestamp).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/enlevements/${e.id}`}
                        className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                      >
                        Voir →
                      </Link>
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
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 text-sm"
                >
                  ← Précédent
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={(page + 1) * LIMIT >= total}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 text-sm"
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
