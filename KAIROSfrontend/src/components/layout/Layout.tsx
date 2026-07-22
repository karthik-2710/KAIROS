import React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { farmAPI } from '@/services/api'
import { Loader2, Plus, Sprout } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { Farm } from '@/types'

// Outlet Context Type
export interface FarmContextType {
  selectedFarmId: number | null
  farms: Farm[]
  refetchFarms: () => void
}

export function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [selectedFarmId, setSelectedFarmId] = React.useState<number | null>(null)

  // Verify auth
  React.useEffect(() => {
    const token = localStorage.getItem('kairos_token')
    if (!token && location.pathname !== '/login' && location.pathname !== '/register') {
      navigate('/login')
    }
  }, [location, navigate])

  // Sync dark mode class
  React.useEffect(() => {
    const isDark = localStorage.getItem('kairos_dark_mode') === 'true'
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  // Fetch Farms
  const { 
    data: farms = [], 
    isLoading, 
    isError, 
    refetch 
  } = useQuery<Farm[]>({
    queryKey: ['farms'],
    queryFn: farmAPI.getAll,
  })

  // Synchronize selected farm ID
  React.useEffect(() => {
    if (farms.length > 0 && selectedFarmId === null) {
      const stored = localStorage.getItem('kairos_selected_farm_id')
      const storedId = stored ? parseInt(stored) : null
      if (storedId && farms.some(f => f.id === storedId)) {
        setSelectedFarmId(storedId)
      } else {
        setSelectedFarmId(farms[0].id)
      }
    }
  }, [farms, selectedFarmId])

  const handleFarmChange = (id: number) => {
    setSelectedFarmId(id)
    localStorage.setItem('kairos_selected_farm_id', id.toString())
  }

  // Loading Screen
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F7F9F5]">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] text-white shadow-md">
            <Sprout className="h-6 w-6 animate-bounce" />
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-widest pl-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2E7D32]" />
            <span>KAIROS Booting...</span>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F7F9F5] p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              ⚠️
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">Database Connection Failed</h3>
            <p className="mt-2 text-xs text-slate-500 leading-normal">
              Could not retrieve agricultural assets. Please verify that your KAIROS local database file exists or is correctly seeded.
            </p>
            <Button onClick={() => refetch()} variant="outline" className="mt-6 w-full">
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Empty State (no farms defined yet)
  if (farms.length === 0 && !['/login', '/register', '/app/farms'].includes(location.pathname)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F7F9F5] p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-50 to-[#E8F5E9] text-[#2E7D32] border border-[#DCE3D6]">
              <Sprout className="h-7 w-7" />
            </div>
            <h3 className="mt-6 text-base font-bold text-slate-900">No Farms Connected</h3>
            <p className="mt-2 text-xs text-slate-500 leading-normal max-w-xs mx-auto">
              Welcome to KAIROS! Register your first farm parcel to activate IoT feeds, satellite NDVI, and disease scanning features.
            </p>
            <Button onClick={() => navigate('/app/farms', { state: { openModal: true } })} className="mt-6 w-full">
              <Plus className="mr-2 h-4 w-4" /> Add Farm Registry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#F7F9F5] bg-grid-pattern">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar 
          farms={farms} 
          selectedFarmId={selectedFarmId} 
          onFarmChange={handleFarmChange}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-7xl">
            <Outlet context={{ selectedFarmId, farms, refetchFarms: refetch } satisfies FarmContextType} />
          </div>
        </main>
      </div>
    </div>
  )
}
