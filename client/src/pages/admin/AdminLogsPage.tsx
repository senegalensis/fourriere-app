import { useEffect, useState } from 'react'
import api from '@/api/client'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'

interface Log {
  id: number
  timestamp: string
  user_name: string
  role: string
  action: string
  details: Record<string, unknown> | null
  ip_address: string | null
}

type MethodVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

const METHOD_VARIANT: Record<string, MethodVariant> = {
  GET:    'info',
  POST:   'success',
  PUT:    'warning',
  DELETE: 'danger',
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [expanded, setExpanded] = useState<number | null>(null)
  const LIMIT = 30

  const fetchLogs = async (pageNum: number) => {
    setLoading(true)
    try {
      const { data } = await api.get('/logs', { params: { limit: LIMIT, skip: pageNum * LIMIT } })
      setLogs(data.logs)
      setTotal(data.total)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs(page) }, [page])

  const parseMethod = (action: string) => action.split(' ')[0] || 'GET'
  const parsePath = (action: string) => action.split(' ').slice(1).join(' ')

  return (
    <div className="space-y-5 max-w-5xl">
      <PageHeader
        title="Logs d'activité"
        subtitle={`${total} action${total !== 1 ? 's' : ''} enregistrée${total !== 1 ? 's' : ''}`}
      />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm text-center py-16 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 mx-auto mb-3 text-slate-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium">Aucun log disponible</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Date/Heure</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Utilisateur</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden sm:table-cell">Méthode</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Action</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => (
                  <>
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                    >
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">
                        {new Date(log.timestamp).toLocaleDateString('fr-FR')}
                        <span className="text-slate-400 ml-1">
                          {new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{log.user_name}</span>
                        <Badge variant="neutral" className="ml-2">{log.role}</Badge>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge variant={METHOD_VARIANT[parseMethod(log.action)] ?? 'neutral'}>
                          <span className="font-mono">{parseMethod(log.action)}</span>
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs truncate max-w-xs">
                        {parsePath(log.action)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400 text-xs">
                        {log.details ? (expanded === log.id ? '▲' : '▼') : ''}
                      </td>
                    </tr>
                    {expanded === log.id && log.details && (
                      <tr key={`${log.id}-detail`} className="bg-slate-50">
                        <td colSpan={5} className="px-4 py-3">
                          <pre className="text-xs text-slate-600 bg-slate-100 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-all">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                          {log.ip_address && (
                            <p className="text-xs text-slate-400 mt-1">IP : {log.ip_address}</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
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
                  className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  ← Précédent
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
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
