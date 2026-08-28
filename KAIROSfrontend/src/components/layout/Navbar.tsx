import React from 'react'
import { Menu, Bell, Sprout, ChevronDown, LogOut, User, Sun, Moon, Globe } from 'lucide-react'
import { Farm } from '@/types'
import { authAPI } from '@/services/api'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { localizeCrop } from '@/utils/localize'

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
  const [langDropdownOpen, setLangDropdownOpen] = React.useState(false)
  const [isDark, setIsDark] = React.useState(
    () => localStorage.getItem('kairos_dark_mode') === 'true' || 
          (!('kairos_dark_mode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  )
  const { t, i18n } = useTranslation()
  
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const profileRef = React.useRef<HTMLDivElement>(null)
  const notificationsRef = React.useRef<HTMLDivElement>(null)
  const langRef = React.useRef<HTMLDivElement>(null)

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
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    authAPI.logout()
    navigate('/login')
  }

  const handleLanguageChange = (newLang: string) => {
    i18n.changeLanguage(newLang)
    localStorage.setItem('kairos_language', newLang)
    setLangDropdownOpen(false)
  }

  const getLanguageLabel = (lng: string) => {
    switch (lng) {
      case 'ta': return 'தமிழ்'
      case 'mr': return 'मराठी'
      case 'hi': return 'हिन्दी'
      default: return 'EN'
    }
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
              <div className="absolute left-0 mt-1.5 w-56 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-surface p-1 shadow-lg ring-1 ring-black/5 animate-fade-in z-50">
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
                    <div>
                      <span>{farm.name}</span>
                      <span className="block text-[10px] text-slate-400">{localizeCrop(farm.crop_type)}</span>
                    </div>
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
          title="Toggle Theme"
        >
          {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        {/* Multilingual Selector Dropdown (EN, MR, HI) */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            className="flex items-center space-x-1.5 h-8 px-3 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-bg text-xs font-bold text-primary dark:text-primary-300 hover:bg-slate-50 dark:hover:bg-white/5 transition shadow-sm"
            title="Switch Language"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{getLanguageLabel(i18n.language)}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {langDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-36 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-surface p-1 shadow-lg ring-1 ring-black/5 animate-fade-in z-50">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${
                  i18n.language === 'en' ? 'bg-primary-50 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <span>English</span>
                {i18n.language === 'en' && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </button>
              <button
                onClick={() => handleLanguageChange('ta')}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${
                  i18n.language === 'ta' ? 'bg-primary-50 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <span>தமிழ் (Tamil)</span>
                {i18n.language === 'ta' && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </button>
              <button
                onClick={() => handleLanguageChange('mr')}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${
                  i18n.language === 'mr' ? 'bg-primary-50 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <span>मराठी (Marathi)</span>
                {i18n.language === 'mr' && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </button>
              <button
                onClick={() => handleLanguageChange('hi')}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${
                  i18n.language === 'hi' ? 'bg-primary-50 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <span>हिन्दी (Hindi)</span>
                {i18n.language === 'hi' && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </button>
            </div>
          )}
        </div>

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
            <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-surface p-1.5 shadow-lg ring-1 ring-black/5 animate-fade-in z-50">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 text-xs font-bold text-slate-900 dark:text-white flex justify-between">
                <span>{t("Alerts & Notifications")}</span>
                <span className="text-[10px] text-primary dark:text-primary-400">{stressedFarms.length} {t("Active")}</span>
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {stressedFarms.length > 0 ? (
                  stressedFarms.map(f => (
                    <div key={f.id} className="px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition rounded-lg text-left">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">Stress warning on {f.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                        Health index dropped to {f.health_score}%. Crop requires watering or nitrogen analysis.
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-4 text-center text-xs text-slate-400">
                    {t("Cleared")}
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
            className="flex items-center space-x-2 rounded-lg p-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/60 text-xs font-bold text-primary dark:text-primary-300">
              <User className="h-4 w-4" />
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-surface p-1 shadow-lg ring-1 ring-black/5 animate-fade-in z-50">
              <div className="border-b border-slate-100 dark:border-white/5 px-3 py-2">
                <p className="text-xs font-bold text-slate-900 dark:text-white">KAIROS Farmer</p>
                <p className="text-[10px] text-slate-400">Precision Ag Platform</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-status-critical hover:bg-red-50 dark:hover:bg-red-950/30 transition mt-1"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{t("Log Out")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
