import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Map, PlusCircle, Satellite, Leaf,
  Lightbulb, BarChart3, LogOut, ChevronLeft, ChevronRight,
  Sprout, Factory
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/farms', icon: Map, label: 'My Farms' },
  { to: '/farms/add', icon: PlusCircle, label: 'Add Farm' },
  { to: '/satellite', icon: Satellite, label: 'Satellite' },
  { to: '/upload', icon: Leaf, label: 'Leaf Analysis' },
  { to: '/recommendation', icon: Lightbulb, label: 'Recommendations' },
  { to: '/history', icon: BarChart3, label: 'History' },
  { to: '/twin', icon: Factory, label: 'Digital Twin' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative flex flex-col h-full bg-[var(--color-surface)] border-r border-[var(--color-border)] overflow-hidden"
      style={{ minWidth: collapsed ? 72 : 240 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--color-border)]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center flex-shrink-0">
          <Sprout className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <p className="font-bold text-lg text-[var(--color-text-primary)] font-poppins leading-none">KAIROS</p>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 uppercase tracking-widest">AgriIntelligence</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
              ${isActive
                ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] dark:bg-[var(--color-primary)]/30 dark:text-[var(--color-primary)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text-primary)]'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.1 }}
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-[var(--color-border)] px-2 py-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
            {user?.name?.[0]?.toUpperCase() || 'K'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{user?.name || 'Farmer'}</p>
                <p className="text-xs text-[var(--color-text-muted)] truncate">{user?.email || ''}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-danger)]/15 hover:text-[var(--color-danger)] transition-colors mt-1"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full flex items-center justify-center shadow-none hover:shadow-none transition-shadow z-10"
      >
        {collapsed
          ? <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
          : <ChevronLeft className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
        }
      </button>
    </motion.aside>
  )
}
