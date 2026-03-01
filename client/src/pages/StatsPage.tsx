import { useEffect, useState } from 'react'
import api from '@/api/client'
import Spinner from '@/components/ui/Spinner'
import StatCard from '@/components/ui/StatCard'
import PageHeader from '@/components/ui/PageHeader'

interface AgentStat {
  agent: string
  total_enlevements: number
  aujourdhui: number
  cette_semaine: number
  ce_mois: number
  sorties_effectuees: number
}

interface DashboardStats {
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

const exportCSV = (agents: AgentStat[]) => {
  const headers = ['Agent', 'Total', "Aujourd'hui", 'Cette semaine', 'Ce mois', 'Sorties']
  const rows = agents.map(a => [
    a.agent,
    a.total_enlevements,
    a.aujourdhui,
    a.cette_semaine,
    a.ce_mois,
    a.sorties_effectuees,
  ])
  const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `stats-agents-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
}

export default function StatsPage() {
  const [agents, setAgents] = useState<AgentStat[]>([])
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/stats/agents'),
      api.get('/stats/dashboard'),
    ])
      .then(([agentsRes, dashRes]) => {
        setAgents(agentsRes.data)
        setDashboard(dashRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Statistiques"
        subtitle="Vue d'ensemble de l'activité"
        actions={
          agents.length > 0 ? (
            <button
              onClick={() => exportCSV(agents)}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Exporter CSV
            </button>
          ) : undefined
        }
      />

      {/* KPIs */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Au parc actuellement"
            value={dashboard.total_vehicules}
            icon={<IconTruck />}
            iconBg="bg-primary-50"
            iconColor="text-primary-600"
          />
          <StatCard
            label="Entrées aujourd'hui"
            value={dashboard.entrees_aujourdhui}
            icon={<IconArrowDown />}
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />
          <StatCard
            label="Sorties aujourd'hui"
            value={dashboard.sorties_aujourdhui}
            icon={<IconArrowUp />}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
          <StatCard
            label="Places libres"
            value={dashboard.places_disponibles}
            icon={<IconSquares />}
            iconBg="bg-slate-50"
            iconColor="text-slate-500"
          />
        </div>
      )}

      {/* Taux d'occupation */}
      {dashboard && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-slate-700">Taux d'occupation du parc</p>
            <p className="text-sm font-bold text-slate-900">{dashboard.taux_occupation}%</p>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                dashboard.taux_occupation > 80 ? 'bg-red-500' :
                dashboard.taux_occupation > 60 ? 'bg-amber-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(dashboard.taux_occupation, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Tableau par agent */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Performance par agent</h2>
        </div>
        {agents.length === 0 ? (
          <p className="text-center py-10 text-slate-400">Aucune donnée disponible</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Agent</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Total</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Auj.</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden sm:table-cell">Semaine</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden md:table-cell">Mois</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden md:table-cell">Sorties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agents.map((a, i) => (
                  <tr key={a.agent} className={`hover:bg-slate-50 transition-colors ${i === 0 ? 'bg-amber-50' : ''}`}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        {i === 0 && <span className="text-amber-500 text-sm">🥇</span>}
                        {i === 1 && <span className="text-slate-400 text-sm">🥈</span>}
                        {i === 2 && <span className="text-amber-700 text-sm">🥉</span>}
                        {i > 2 && <span className="w-5 text-xs text-slate-400 text-center">{i + 1}</span>}
                        {a.agent}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">{a.total_enlevements}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${a.aujourdhui > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                        {a.aujourdhui}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700 hidden sm:table-cell">{a.cette_semaine}</td>
                    <td className="px-4 py-3 text-right text-slate-700 hidden md:table-cell">{a.ce_mois}</td>
                    <td className="px-4 py-3 text-right text-slate-500 hidden md:table-cell">{a.sorties_effectuees}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td className="px-4 py-2 text-xs font-semibold text-slate-600">Total</td>
                  <td className="px-4 py-2 text-right text-xs font-bold text-slate-900">
                    {agents.reduce((s, a) => s + Number(a.total_enlevements), 0)}
                  </td>
                  <td className="px-4 py-2 text-right text-xs font-bold text-green-600">
                    {agents.reduce((s, a) => s + Number(a.aujourdhui), 0)}
                  </td>
                  <td className="px-4 py-2 text-right text-xs text-slate-700 hidden sm:table-cell">
                    {agents.reduce((s, a) => s + Number(a.cette_semaine), 0)}
                  </td>
                  <td className="px-4 py-2 text-right text-xs text-slate-700 hidden md:table-cell">
                    {agents.reduce((s, a) => s + Number(a.ce_mois), 0)}
                  </td>
                  <td className="px-4 py-2 text-right text-xs text-slate-500 hidden md:table-cell">
                    {agents.reduce((s, a) => s + Number(a.sorties_effectuees), 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
