import { NavLink } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

// ── Heroicons outline (SVG inline) ──────────────────────────────
const IconDashboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
)

const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
)

const IconList = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
  </svg>
)

const IconTruck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
  </svg>
)

const IconArrowRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
)

const IconDocument = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
)

const IconDocumentCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" />
  </svg>
)

const IconChartPie = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
  </svg>
)

const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
)

const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconMapPin = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
)

const IconUserCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const IconLogout = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </svg>
)

// ── Nav item type ────────────────────────────────────────────────
interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  group?: string
}

// ── Nav sets ─────────────────────────────────────────────────────
const dleOfficeNavItems: NavItem[] = [
  { to: '/', label: 'Tableau de bord', icon: <IconDashboard />, group: '' },
  { to: '/dle/mainlevees', label: 'Mainlevées', icon: <IconDocumentCheck />, group: 'DLE Office' },
  // { to: '/carte', label: 'Carte', icon: <IconMapPin />, group: 'DLE Office' }, // désactivé temporairement
  { to: '/profil', label: 'Mon profil', icon: <IconUserCircle />, group: 'DLE Office' },
]

const agentNavItems: NavItem[] = [
  { to: '/', label: 'Tableau de bord', icon: <IconDashboard />, group: '' },
  { to: '/enlevements/nouveau', label: 'Nouvel enlèvement', icon: <IconPlus />, group: 'Terrain' },
  { to: '/enlevements', label: 'Enlèvements', icon: <IconList />, group: 'Terrain' },
  { to: '/documents', label: 'Documents', icon: <IconDocument />, group: 'Terrain' },
  { to: '/profil', label: 'Mon profil', icon: <IconUserCircle />, group: 'Compte' },
]

const fourriereNavItems: NavItem[] = [
  { to: '/', label: 'Tableau de bord', icon: <IconDashboard />, group: '' },
  { to: '/reception/nouvelle', label: 'Réception véhicule', icon: <IconPlus />, group: 'Fourrière' },
  { to: '/reception', label: 'Véhicules reçus', icon: <IconTruck />, group: 'Fourrière' },
  { to: '/admin/sorties', label: 'Sorties', icon: <IconArrowRight />, group: 'Fourrière' },
  { to: '/documents', label: 'Documents', icon: <IconDocument />, group: 'Fourrière' },
  // { to: '/carte', label: 'Carte', icon: <IconMapPin />, group: 'Fourrière' }, // désactivé temporairement
  { to: '/profil', label: 'Mon profil', icon: <IconUserCircle />, group: 'Compte' },
]

const adminNavItems: NavItem[] = [
  { to: '/', label: 'Tableau de bord', icon: <IconDashboard />, group: '' },
  { to: '/enlevements/nouveau', label: 'Nouvel enlèvement', icon: <IconPlus />, group: 'Terrain' },
  { to: '/enlevements', label: 'Enlèvements', icon: <IconList />, group: 'Terrain' },
  { to: '/reception', label: 'Réceptions', icon: <IconTruck />, group: 'Fourrière' },
  { to: '/admin/sorties', label: 'Sorties', icon: <IconArrowRight />, group: 'Fourrière' },
  { to: '/documents', label: 'Documents', icon: <IconDocument />, group: 'Fourrière' },
  // { to: '/carte', label: 'Carte', icon: <IconMapPin />, group: 'Fourrière' }, // désactivé temporairement
  { to: '/dle/mainlevees', label: 'Mainlevées DLE', icon: <IconDocumentCheck />, group: 'Administration' },
  { to: '/stats', label: 'Statistiques', icon: <IconChartPie />, group: 'Administration' },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: <IconUsers />, group: 'Administration' },
  { to: '/admin/logs', label: 'Logs activité', icon: <IconClock />, group: 'Administration' },
  { to: '/profil', label: 'Mon profil', icon: <IconUserCircle />, group: 'Compte' },
]

// ── NavLink item ─────────────────────────────────────────────────
function SidebarLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive
            ? 'bg-white/10 text-white font-medium'
            : 'text-slate-300 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      {item.icon}
      <span>{item.label}</span>
    </NavLink>
  )
}

// ── Sidebar ──────────────────────────────────────────────────────
export default function Sidebar() {
  const { user, logout, isAdmin, isFourriere, isDleOffice } = useAuth()

  const navItems = isAdmin
    ? adminNavItems
    : isFourriere
    ? fourriereNavItems
    : isDleOffice
    ? dleOfficeNavItems
    : agentNavItems

  // Collect unique groups in order
  const groups = Array.from(new Set(navItems.map(i => i.group ?? '')))

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-navy-600 h-full shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="/logo-entete.png" alt="DGCV" className="h-9 brightness-0 invert" />
          <div>
            <p className="text-white font-semibold text-sm leading-none">Cadre de Vie</p>
            <p className="text-slate-400 text-xs leading-tight mt-0.5">Gestion fourrière</p>
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {groups.map(group => {
          const items = navItems.filter(i => (i.group ?? '') === group)
          if (items.length === 0) return null
          return (
            <div key={group} className="space-y-1">
              {group && (
                <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                  {group}
                </p>
              )}
              {items.map(item => (
                <SidebarLink key={item.to} item={item} />
              ))}
            </div>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.username}</p>
              <p className="text-slate-400 text-xs capitalize truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Déconnexion"
            className="text-slate-400 hover:text-red-400 transition-colors ml-2"
          >
            <IconLogout />
          </button>
        </div>
      </div>
    </aside>
  )
}
