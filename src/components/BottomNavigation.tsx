import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: '首页', icon: '🏠' },
  { to: '/stats', label: '统计', icon: '📊' },
  { to: '/records', label: '记录', icon: '📋' },
  { to: '/settings', label: '设置', icon: '⚙️' },
]

export default function BottomNavigation() {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40
                 border-t border-gray-200 dark:border-gray-700
                 bg-white/95 dark:bg-gray-800/95 backdrop-blur"
      style={{ paddingBottom: 'var(--safe-area-inset-bottom)' }}
    >
      <ul className="grid grid-cols-4">
        {items.map((it) => (
          <li key={it.to}>
            <NavLink
              to={it.to}
              end={it.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs transition-colors
                 ${isActive
                   ? 'text-primary-500 font-semibold'
                   : 'text-gray-500 dark:text-gray-400 hover:text-primary-400'}`
              }
            >
              <span className="text-xl leading-none">{it.icon}</span>
              <span>{it.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
