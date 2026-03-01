import { NavLink } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

const agentNavItems = [
  { to: '/', label: 'Accueil', icon: '📊' },
  { to: '/enlevements/nouveau', label: 'Nouveau', icon: '➕' },
  { to: '/enlevements', label: 'Liste', icon: '📋' },
  { to: '/documents', label: 'Docs', icon: '📄' },
]

const fourriereNavItems = [
  { to: '/', label: 'Accueil', icon: '📊' },
  { to: '/reception/nouvelle', label: 'Réception', icon: '🚗' },
  { to: '/reception', label: 'Reçus', icon: '📋' },
  { to: '/admin/sorties', label: 'Sorties', icon: '🚪' },
]

const adminNavItems = [
  { to: '/', label: 'Accueil', icon: '📊' },
  { to: '/enlevements', label: 'Enlèv.', icon: '📋' },
  { to: '/reception', label: 'Récept.', icon: '🚗' },
  { to: '/admin/sorties', label: 'Sorties', icon: '🚪' },
]

const greffeNavItems = [
  { to: '/', label: 'Accueil', icon: '📊' },
  { to: '/documents', label: 'Docs', icon: '📄' },
]

export default function BottomNav() {
  const { isFourriere, isAdmin, isGreffe } = useAuth()
  const navItems = isAdmin ? adminNavItems : isFourriere ? fourriereNavItems : isGreffe ? greffeNavItems : agentNavItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 md:hidden">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-3 text-xs ${
                isActive ? 'text-primary-600 font-medium' : 'text-gray-500'
              }`
            }
          >
            <span className="text-xl mb-0.5">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
