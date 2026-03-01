import { useAuth } from '@/hooks/useAuth'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useSyncStore } from '@/store/syncStore'

export default function Header() {
  const { user, logout } = useAuth()
  const isOnline = useOnlineStatus()
  const { pendingCount, syncing } = useSyncStore()

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-primary-800">Fourriere</h1>
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
          isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </span>
        {pendingCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
            {syncing ? 'Sync...' : `${pendingCount} en attente`}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">{user?.username}</span>
        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500 uppercase">{user?.role}</span>
        <button onClick={logout} className="text-sm text-red-600 hover:text-red-800">
          Deconnexion
        </button>
      </div>
    </header>
  )
}
