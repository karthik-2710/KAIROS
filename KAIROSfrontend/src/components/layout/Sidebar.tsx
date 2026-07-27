import { NavLink } from "react-router-dom"
import { 
  LayoutDashboard, 
  Sprout, 
  Satellite, 
  Camera, 
  Brain, 
  History,
  X,
  Compass,
  Radio,
  Settings
} from "lucide-react"
import { cn } from "@/utils/cn"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

import { useTranslation } from "react-i18next"

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t } = useTranslation()
  const navItems = [
    { name: t("Dashboard"), to: "/app", icon: LayoutDashboard },
    { name: t("My Farms"), to: "/app/farms", icon: Sprout },
    { name: t("IoT Sensor Grid"), to: "/app/iot", icon: Radio },
    { name: t("Satellite NDVI"), to: "/app/satellite", icon: Satellite },
    { name: t("AI Leaf Scan"), to: "/app/leaf-scan", icon: Camera },
    { name: t("Recommendations"), to: "/app/recommendations", icon: Brain },
    { name: t("Analysis History"), to: "/app/history", icon: History },
    { name: t("System Settings"), to: "/app/settings", icon: Settings },
  ]

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed bottom-4 top-4 left-4 z-40 w-[260px] h-[calc(100vh-2rem)] rounded-3xl border border-slate-200/70 dark:border-white/8 bg-white/95 dark:bg-dark-elevated/95 backdrop-blur-xl transition-transform duration-300 lg:sticky lg:translate-x-0 shadow-premium",
          isOpen ? "translate-x-0" : "-translate-x-[110%]"
        )}
      >
        <div className="flex h-full flex-col justify-between px-4 py-6">
          {/* Logo Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-8">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-900 text-white shadow-sm">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xl font-black tracking-tight text-slate-950 dark:text-white">KAIROS</span>
                  <p className="text-[10px] font-bold text-primary dark:text-primary-400 uppercase tracking-widest -mt-1">{t("Enterprise")}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-200 lg:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav List */}
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  onClick={() => onClose()}
                  className={({ isActive }) => cn(
                    "flex items-center space-x-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-300 select-none",
                    isActive 
                      ? "bg-primary text-white shadow-md dark:shadow-none" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Footer Info */}
          <div className="rounded-2xl bg-slate-50/50 dark:bg-dark-surface p-4 border border-slate-200/50 dark:border-white/10">
            <span className="text-xs font-bold text-slate-900 dark:text-white">{t("SIH Enterprise Platform")}</span>
            <p className="mt-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
              {t("Knowledge-driven Agricultural Intelligence for Sustainability.")}
            </p>
            <div className="mt-3 flex items-center space-x-1.5 bg-white dark:bg-white/5 rounded-full px-2.5 py-1 border border-slate-200/50 dark:border-white/5 w-fit">
              <span className="h-1.5 w-1.5 rounded-full bg-status-success shadow-[0_0_8px_rgba(63,174,90,0.8)] animate-pulse" />
              <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">{t("Live Node")}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
