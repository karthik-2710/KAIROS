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

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navItems = [
    { name: "Dashboard", to: "/app", icon: LayoutDashboard },
    { name: "My Farms", to: "/app/farms", icon: Sprout },
    { name: "IoT Sensor Grid", to: "/app/iot", icon: Radio },
    { name: "Satellite NDVI", to: "/app/satellite", icon: Satellite },
    { name: "AI Leaf Scan", to: "/app/leaf-scan", icon: Camera },
    { name: "Recommendations", to: "/app/recommendations", icon: Brain },
    { name: "Analysis History", to: "/app/history", icon: History },
    { name: "System Settings", to: "/app/settings", icon: Settings },
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
          "fixed bottom-0 top-0 left-0 z-40 w-64 border-r border-[#DCE3D6]/70 bg-white/70 backdrop-blur-md transition-transform duration-300 lg:sticky lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col justify-between px-4 py-6">
          {/* Logo Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-8">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] text-white shadow-md">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-lg font-bold tracking-tight text-slate-950">KAIROS</span>
                  <p className="text-[9px] font-semibold text-[#2E7D32] uppercase tracking-wider -mt-1">Precision Ag</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="rounded-lg p-1 text-slate-400 hover:bg-[#EDF1EA] hover:text-slate-700 lg:hidden"
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
                    "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 select-none",
                    isActive 
                      ? "bg-[#E8F5E9] text-[#1B5E20] font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)]" 
                      : "text-slate-600 hover:bg-[#EDF1EA]/50 hover:text-slate-900"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Footer Info */}
          <div className="rounded-xl bg-[#EDF1EA]/40 p-4 border border-[#DCE3D6]/30">
            <span className="text-xs font-semibold text-slate-900">SIH Platform</span>
            <p className="mt-1 text-[11px] text-slate-500 leading-normal">
              Knowledge-driven Agricultural Intelligence for Sustainability.
            </p>
            <div className="mt-2.5 flex items-center space-x-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-medium text-slate-600">Local Dev Mode</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
