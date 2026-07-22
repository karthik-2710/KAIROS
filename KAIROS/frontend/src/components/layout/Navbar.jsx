import { Bell, Sun, Moon, ChevronDown, Wifi, WifiOff } from 'lucide-react'
import { useFarmStore, useThemeStore } from '@/store/farmStore'
import { useAuthStore } from '@/store/authStore'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const { farms, selectedFarm, setSelectedFarm } = useFarmStore()
  const { isDark, toggleTheme } = useThemeStore()
  const { user } = useAuthStore()
  const [sensorOnline, setSensorOnline] = useState(true)
  const [showFarmDropdown, setShowFarmDropdown] = useState(false)

  // Simulate sensor status ping
  useEffect(() => {
    const interval = setInterval(() => {
      setSensorOnline(prev => Math.random() > 0.05 ? true : prev)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="h-16 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-6 z-20 flex-shrink-0">
      {/* Left: Farm Selector */}
      <div className="relative">
        <button
          onClick={() => setShowFarmDropdown(!showFarmDropdown)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[var(--color-bg)] transition-colors"
        >
          <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></div>
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            {selectedFarm?.name || 'Select Farm'}
          </span>
          <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
        </button>

        {showFarmDropdown && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-none py-1 z-50">
            {farms.length === 0 ? (
              <p className="px-4 py-3 text-sm text-[var(--color-text-muted)]">No farms added yet</p>
            ) : (
              farms.map(farm => (
                <button
                  key={farm.id}
                  onClick={() => { setSelectedFarm(farm); setShowFarmDropdown(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-bg)] transition-colors
                    ${selectedFarm?.id === farm.id ? 'text-[var(--color-primary)] font-medium' : 'text-[var(--color-text-primary)]'}`}
                >
                  <p className="font-medium">{farm.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{farm.crop_type} · {farm.area_ha} ha</p>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Sensor Status */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
          ${sensorOnline ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' : 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]'}`}
        >
          {sensorOnline
            ? <><div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] pulse-live"></div> IoT Live</>
            : <><WifiOff className="w-3 h-3" /> Offline</>
          }
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[var(--color-bg)] transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        {/* Notifications */}
        <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[var(--color-bg)] transition-colors relative text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-danger)] rounded-full border-2 border-[var(--color-surface)]"></span>
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold cursor-pointer">
          {user?.name?.[0]?.toUpperCase() || 'K'}
        </div>
      </div>
    </header>
  )
}
