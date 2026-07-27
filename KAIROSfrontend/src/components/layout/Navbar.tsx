import React from 'react'
import { Menu, Bell, Sprout, ChevronDown, LogOut, User, Sun, Moon } from 'lucide-react'
import { Farm } from '@/types'
import { authAPI } from '@/services/api'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

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
  const [isDark, setIsDark] = React.useState(
    () => localStorage.getItem('kairos_dark_mode') === 'true' || 
          (!('kairos_dark_mode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  )
  const { t, i18n } = useTranslation()
  
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

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ta' : 'en'
    i18n.changeLanguage(newLang)
    localStorage.setItem('kairos_language', newLang)
  }

  const toggleTheme = () => {
    const newDark = !isDark
    setIsDark(newDark)
    localStorage.setItem('kairos_dark_mode', String(newDark))
    document.documentElement.classList.toggle('dark', newDark)
  }

  // Generate warning/alerts based on farm scores
  const stressedFarms = farms.filter(f => f.health_score < 60)

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between bg-transparent px-6 md:px-8 pt-4">
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
              className="flex items-center space-x-2 rounded-lg border border-slate-200/70 dark:border-white/10 bg-white dark:bg-dark-bg px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-white/5 transition"
            >
              <Sprout className="h-4 w-4 text-primary" />
              <span className="max-w-[120px] truncate">{selectedFarm?.name}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-56 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-surface p-1 shadow-lg ring-1 ring-black/5 animate-fade-in">
                <div className="px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {t("Select Active Farm")}
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
                        ? 'bg-primary-50 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>{farm.name}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      farm.health_score >= 80 ? 'bg-status-success/20 text-status-success' :
                      farm.health_score >= 60 ? 'bg-status-warning/20 text-status-warning' : 'bg-status-critical/20 text-status-critical'
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
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center h-8 w-8 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-bg text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition shadow-sm"
        >
          {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center justify-center h-8 w-12 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-bg text-xs font-bold text-primary dark:text-primary-300 hover:bg-slate-50 dark:hover:bg-white/5 transition shadow-sm"
        >
          {i18n.language === 'ta' ? 'தமிழ்' : 'EN'}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200 transition"
          >
            <Bell className="h-5 w-5" />
            {stressedFarms.length > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-status-critical ring-2 ring-white dark:ring-dark-surface" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-surface p-1.5 shadow-lg ring-1 ring-black/5 animate-fade-in">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 text-xs font-bold text-slate-900 dark:text-white flex justify-between">
                <span>{t("Alerts & Notifications")}</span>
                <span className="text-[10px] text-primary dark:text-primary-400">{stressedFarms.length} {t("Active")}</span>
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
            className="flex items-center justify-center h-8 w-8 rounded-full bg-primary hover:bg-primary-900 text-white text-xs font-bold shadow-sm transition"
          >
            DF
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 origin-top-right rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-surface p-1 shadow-lg ring-1 ring-black/5 animate-fade-in">
              <div className="px-3 py-2 text-xs border-b border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Demo Farmer</p>
                <p className="text-[10px] truncate">demo@kairos.ag</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { setProfileOpen(false); navigate('/app/farms') }}
                  className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                >
                  <User className="h-4 w-4" />
                  <span>{t("My Profile")}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-status-critical hover:bg-status-critical/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t("Log Out")}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
