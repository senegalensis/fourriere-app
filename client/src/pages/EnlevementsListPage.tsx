import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/api/client'
import Spinner from '@/components/ui/Spinner'

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

const STATUT_COLORS: Record<string, string> = {
  en_route: 'bg-blue-100 text-blue-700',
  au_parc: 'bg-green-100 text-green-700',
  sorti: 'bg-gray-100 text-gray-500'
}

export default function EnlevementsListPage() {
  const [enlevements, setEnlevements] = useState<Enlevement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const params: any = { limit: 50 }
      if (filter) params.statut = filter
      const { data } = await api.get('/enlevements', { params })
      setEnlevements(data.enlevements)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    loadData()
  }, [filter])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Enlevements</h2>
        <Link to="/enlevements/nouveau" className="btn-primary text-sm">+ Nouveau</Link>
      </div>

      <div className="flex gap-2">
        {['', 'en_route', 'au_parc', 'sorti'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full ${
              filter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {s === '' ? 'Tous' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : enlevements.length === 0 ? (
        <p className="text-center text-gray-500 py-8">Aucun enlevement</p>
      ) : (
        <div className="space-y-2">
          {enlevements.map((e) => (
            <Link key={e.id} to={`/enlevements/${e.id}`} className="card block hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{e.vehicule_matricule}</p>
                  <p className="text-xs text-gray-500">{e.vehicule_marque} {e.vehicule_couleur}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUT_COLORS[e.statut] || ''}`}>
                  {e.statut.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                <span>{e.agent}</span>
                <span>{new Date(e.timestamp).toLocaleDateString('fr-FR')}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
