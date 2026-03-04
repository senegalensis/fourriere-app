import { useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useSyncStore } from '@/store/syncStore'

const PATH_TITLES: Record<string, string> = {
  '/': 'Tableau de bord',
  '/enlevements': 'Enlèvements',
  '/enlevements/nouveau': 'Nouvel enlèvement',
  '/reception': 'Véhicules reçus',
  '/reception/nouvelle': 'Réception véhicule',
  '/admin/sorties': 'Sorties',
  '/documents': 'Documents PDF',
  '/dle/mainlevees': 'Mainlevées DLE',
  '/stats': 'Statistiques',
  '/admin/utilisateurs': 'Utilisateurs',
  '/admin/logs': "Logs d'activité",
  '/profil': 'Mon profil',
  '/carte': 'Carte des enlèvements',
}

function getPageTitle(pathname: string): string {
  if (PATH_TITLES[pathname]) return PATH_TITLES[pathname]
  if (pathname.startsWith('/enlevements/')) return 'Détail enlèvement'
  return 'Fourrière DGCV'
}

export default function Header() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const isOnline = useOnlineStatus()
  const { pendingCount, syncing } = useSyncStore()

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
      <h1 className="text-base font-semibold text-slate-800">{getPageTitle(pathname)}</h1>

      <div className="flex items-center gap-3">
        {/* Online status */}
        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
          isOnline ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </span>

        {/* Sync indicator */}
        {pendingCount > 0 && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium">
            {syncing ? 'Sync…' : `${pendingCount} en attente`}
          </span>
        )}

        {/* User */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-800 leading-none">{user?.username}</p>
            <p className="text-xs text-slate-400 leading-tight mt-0.5 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="ml-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            Déco.
          </button>
        </div>
      </div>
    </header>
  )
}
