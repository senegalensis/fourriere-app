import { NavLink } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

const agentNavItems = [
  { to: '/', label: 'Tableau de bord', icon: '📊' },
  { to: '/enlevements/nouveau', label: 'Nouvel enlèvement', icon: '➕' },
  { to: '/enlevements', label: 'Enlèvements', icon: '📋' },
  { to: '/documents', label: 'Documents', icon: '📄' },
]

const fourriereNavItems = [
  { to: '/', label: 'Tableau de bord', icon: '📊' },
  { to: '/reception/nouvelle', label: 'Réception véhicule', icon: '🚗' },
  { to: '/reception', label: 'Véhicules reçus', icon: '📋' },
  { to: '/admin/sorties', label: 'Sorties', icon: '🚪' },
  { to: '/documents', label: 'Documents', icon: '📄' },
]

const greffeNavItems = [
  { to: '/', label: 'Tableau de bord', icon: '📊' },
  { to: '/documents', label: 'Documents', icon: '📄' },
]

const adminNavItems = [
  { to: '/', label: 'Tableau de bord', icon: '📊', group: '' },
  { to: '/enlevements', label: 'Enlèvements', icon: '📋', group: 'Terrain' },
  { to: '/reception', label: 'Réceptions', icon: '🚗', group: 'Fourrière' },
  { to: '/admin/sorties', label: 'Sorties', icon: '🚪', group: 'Fourrière' },
  { to: '/documents', label: 'Documents', icon: '📄', group: 'Fourrière' },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: '👤', group: 'Administration' },
]

export default function Sidebar() {
  const { isAdmin, isFourriere, isGreffe } = useAuth()

  if (isAdmin) {
    const groups = ['', 'Terrain', 'Fourrière', 'Administration']
    return (
      <aside className="hidden md:flex md:flex-col w-56 bg-white border-r border-gray-200 h-full">
        <nav className="flex-1 py-2 overflow-y-auto">
          {groups.map(group => {
            const items = adminNavItems.filter(i => i.group === group)
            if (items.length === 0) return null
            return (
              <div key={group}>
                {group && (
                  <p className="px-4 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">{group}</p>
                )}
                {items.map(item => (
                  <NavLink key={item.to} to={item.to} end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 text-sm ${isActive ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`
                    }
                  >
                    <span>{item.icon}</span>{item.label}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>
      </aside>
    )
  }

  const navItems = isFourriere ? fourriereNavItems : isGreffe ? greffeNavItems : agentNavItems
  return (
    <aside className="hidden md:flex md:flex-col w-56 bg-white border-r border-gray-200 h-full">
      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm ${
                isActive
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
