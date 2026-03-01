import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/api/client'
import { useAuth } from '@/hooks/useAuth'
import Spinner from '@/components/ui/Spinner'



interface Stats {
  total_vehicules: number
  entrees_aujourdhui: number
  sorties_aujourdhui: number
  taux_occupation: number
  places_disponibles: number
}

export default function DashboardPage() {
  const { user, isAdmin, isFourriere } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/stats/dashboard')
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Bonjour, {user?.username}</h2>
        <p className="text-sm text-gray-500">Tableau de bord</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Vehicules" value={stats?.total_vehicules ?? 0} color="blue" />
        <StatCard label="Entrees aujourd'hui" value={stats?.entrees_aujourdhui ?? 0} color="green" />
        <StatCard label="Sorties aujourd'hui" value={stats?.sorties_aujourdhui ?? 0} color="amber" />
        <StatCard label="Places libres" value={stats?.places_disponibles ?? 0} color="gray" />
      </div>

      {stats && (
        <div className="card">
          <p className="text-sm text-gray-500">Taux d'occupation</p>
          <div className="mt-2 h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full transition-all"
              style={{ width: `${Math.min(stats.taux_occupation, 100)}%` }}
            />
          </div>
          <p className="text-right text-sm font-medium mt-1">{stats.taux_occupation}%</p>
        </div>
      )}

      {isAdmin ? (
        <div className="flex gap-3">
          <Link to="/enlevements/nouveau" className="btn-primary flex-1 text-center">
            Nouvel enlèvement
          </Link>
          <Link to="/reception/nouvelle" className="btn-secondary flex-1 text-center">
            Réceptionner
          </Link>
        </div>
      ) : isFourriere ? (
        <Link to="/reception/nouvelle" className="btn-primary block text-center">
          Réceptionner un véhicule
        </Link>
      ) : (
        <Link to="/enlevements/nouveau" className="btn-primary block text-center">
          Nouvel enlèvement
        </Link>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    gray: 'bg-gray-50 text-gray-700'
  }
  return (
    <div className="card">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colors[color] || ''}`}>{value}</p>
    </div>
  )
}
