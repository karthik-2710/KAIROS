import React from 'react'
import { Menu, Bell, Sprout, ChevronDown, LogOut, User } from 'lucide-react'
import { Farm } from '@/types'
import { authAPI } from '@/services/api'
import { useNavigate } from 'react-router-dom'

interface NavbarProps {
  farms: Farm[]
  selectedFarmId: number | null
  onFarmChange: (id: number) => void
  onToggleSidebar: () => void
}

export function Navbar({ farms, selectedFarmId, onFarmChange, onToggleSidebar }: NavbarProps) {
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  const [profileOpen, setProfileOpen] = React.useState(false)
  const [notificationsOpen, setNotificationsOpen] = React.useState(false)
  
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const profileRef = React.useRef<HTMLDivElement>(null)
  const notificationsRef = React.useRef<HTMLDivElement>(null)

  const selectedFarm = farms.find(f => f.id === selectedFarmId) || farms[0]

  // Close dropdowns on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    authAPI.logout()
    navigate('/login')
  }

  // Generate warning/alerts based on farm scores
  const stressedFarms = farms.filter(f => f.health_score < 60)

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#DCE3D6]/70 bg-[#F7F9F5]/80 px-4 backdrop-blur-md md:px-6">
      {/* Mobile Toggle & Brand/Selector */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-[#EDF1EA] hover:text-slate-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Custom Farm Selector Dropdown */}
        {farms.length > 0 && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 rounded-lg border border-[#DCE3D6]/70 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-[#EDF1EA]/30 transition"
            >
              <Sprout className="h-4 w-4 text-[#2E7D32]" />
              <span className="max-w-[120px] truncate">{selectedFarm?.name}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-56 rounded-xl border border-[#DCE3D6] bg-white p-1 shadow-lg ring-1 ring-black/5 animate-fade-in">
                <div className="px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Active Farm
                </div>
                {farms.map((farm) => (
                  <button
                    key={farm.id}
                    onClick={() => {
                      onFarmChange(farm.id)
                      setDropdownOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium transition ${
                      selectedFarmId === farm.id
                        ? 'bg-[#E8F5E9] text-[#1B5E20]'
                        : 'text-slate-600 hover:bg-[#EDF1EA]/50 hover:text-slate-900'
                    }`}
                  >
                    <span>{farm.name}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      farm.health_score >= 80 ? 'bg-green-100 text-green-800' :
                      farm.health_score >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {farm.health_score}%
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notifications & Profile */}
      <div className="flex items-center space-x-3">
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative rounded-lg p-1.5 text-slate-500 hover:bg-[#EDF1EA] hover:text-slate-800 transition"
          >
            <Bell className="h-5 w-5" />
            {stressedFarms.length > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#F7F9F5]" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl border border-[#DCE3D6] bg-white p-1.5 shadow-lg ring-1 ring-black/5 animate-fade-in">
              <div className="px-3 py-2 border-b border-[#EDF1EA]/50 text-xs font-bold text-slate-900 flex justify-between">
                <span>Alerts & Notifications</span>
                <span className="text-[10px] text-[#2E7D32]">{stressedFarms.length} Active</span>
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {stressedFarms.length > 0 ? (
                  stressedFarms.map(f => (
                    <div key={f.id} className="px-3 py-2.5 hover:bg-slate-50 transition rounded-lg text-left">
                      <p className="text-xs font-semibold text-slate-900">Stress warning on {f.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                        Health index dropped to {f.health_score}%. Crop requires watering or nitrogen analysis.
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-6 text-center text-xs text-slate-400">
                    All farms are in optimal condition.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center justify-center h-8 w-8 rounded-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold border border-[#DCE3D6]/70 shadow-sm transition"
          >
            DF
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 origin-top-right rounded-xl border border-[#DCE3D6] bg-white p-1 shadow-lg ring-1 ring-black/5 animate-fade-in">
              <div className="px-3 py-2 text-xs border-b border-[#EDF1EA]/50 text-slate-500">
                <p className="font-semibold text-slate-800">Demo Farmer</p>
                <p className="text-[10px] truncate text-slate-400">demo@kairos.ag</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { setProfileOpen(false); navigate('/app/farms') }}
                  className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-600 hover:bg-[#EDF1EA]/50 hover:text-slate-900"
                >
                  <User className="h-4 w-4" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
