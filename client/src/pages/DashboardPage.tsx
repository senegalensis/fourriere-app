import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/api/client'
import { useAuth } from '@/hooks/useAuth'
import Spinner from '@/components/ui/Spinner'
import StatCard from '@/components/ui/StatCard'

interface Stats {
  total_vehicules: number
  entrees_aujourdhui: number
  sorties_aujourdhui: number
  taux_occupation: number
  places_disponibles: number
}

const IconTruck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
  </svg>
)

const IconArrowDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15" />
  </svg>
)

const IconArrowUp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
  </svg>
)

const IconSquares = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
)

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
    <div className="space-y-6 max-w-5xl">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Bonjour, {user?.username}</h2>
        <p className="text-sm text-slate-500 mt-0.5">Voici un aperçu de l'activité de la fourrière</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Véhicules au parc"
          value={stats?.total_vehicules ?? 0}
          icon={<IconTruck />}
          iconBg="bg-primary-50"
          iconColor="text-primary-600"
        />
        <StatCard
          label="Entrées aujourd'hui"
          value={stats?.entrees_aujourdhui ?? 0}
          icon={<IconArrowDown />}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          label="Sorties aujourd'hui"
          value={stats?.sorties_aujourdhui ?? 0}
          icon={<IconArrowUp />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Places libres"
          value={stats?.places_disponibles ?? 0}
          icon={<IconSquares />}
          iconBg="bg-slate-50"
          iconColor="text-slate-500"
        />
      </div>

      {/* Occupation bar */}
      {stats && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-slate-700">Taux d'occupation du parc</p>
            <p className="text-sm font-bold text-slate-900">{stats.taux_occupation}%</p>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.taux_occupation > 80 ? 'bg-red-500' :
                stats.taux_occupation > 60 ? 'bg-amber-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(stats.taux_occupation, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Actions rapides</p>
        {isAdmin ? (
          <div className="flex gap-3">
            <Link to="/enlevements/nouveau" className="btn-primary flex-1 text-center">
              + Nouvel enlèvement
            </Link>
            <Link to="/reception/nouvelle" className="btn-secondary flex-1 text-center">
              Réceptionner
            </Link>
          </div>
        ) : isFourriere ? (
          <Link to="/reception/nouvelle" className="btn-primary inline-block">
            Réceptionner un véhicule
          </Link>
        ) : (
          <Link to="/enlevements/nouveau" className="btn-primary inline-block">
            + Nouvel enlèvement
          </Link>
        )}
      </div>
    </div>
  )
}
