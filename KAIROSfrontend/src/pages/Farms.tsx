import React from 'react'
import { useOutletContext, useLocation } from 'react-router-dom'
import { FarmContextType } from '@/components/layout/Layout'
import { farmAPI } from '@/services/api'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { 
  Sprout, 
  Map as MapIcon, 
  Trash2, 
  Plus, 
  LayoutGrid, 
  Layers, 
  MapPin, 
  Calendar,
  AlertCircle,
  User,
  Activity,
  Cpu,
  Edit,
  CloudSun,
  Shield,
  ArrowRight
} from 'lucide-react'
import { FarmMap } from '@/components/ui/FarmMap'

interface ExtraMetadata {
  owner: string
  location: string
  growthStage: string
  plantingDate: string
  harvestDate: string
  weatherZone: string
  satelliteCoverage: string
}

export default function Farms() {
  const { farms, refetchFarms } = useOutletContext<FarmContextType>()
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editMode, setEditMode] = React.useState(false)
  const [targetEditId, setTargetEditId] = React.useState<number | null>(null)
  
  // Form fields
  const [name, setName] = React.useState('')
  const [cropType, setCropType] = React.useState('Rice')
  const [area, setArea] = React.useState('2.5')
  const [polygon, setPolygon] = React.useState('[[11.0168,76.9558],[11.0268,76.9558],[11.0268,76.9658],[11.0168,76.9658]]')
  
  // Extra fields
  const [owner, setOwner] = React.useState('Demo Farmer')
  const [location, setLocation] = React.useState('Coimbatore, TN')
  const [growthStage, setGrowthStage] = React.useState('Vegetative')
  const [plantingDate, setPlantingDate] = React.useState('2026-05-10')
  const [harvestDate, setHarvestDate] = React.useState('2026-09-15')
  const [weatherZone, setWeatherZone] = React.useState('Zone B - Subtropical')
  const [satelliteCoverage, setSatelliteCoverage] = React.useState('Sentinel-2 Tile 43PGP')

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  // Helper to load/save extra metadata from localstorage
  const getExtraMetadata = (id: number): ExtraMetadata => {
    const data = localStorage.getItem(`kairos_farm_extra_${id}`)
    if (data) {
      try {
        return JSON.parse(data)
      } catch {}
    }
    // Default fallback values
    return {
      owner: 'Demo Farmer',
      location: 'Coimbatore, TN',
      growthStage: id === 2 ? 'Flowering' : id === 3 ? 'Maturation' : 'Vegetative',
      plantingDate: '2026-05-10',
      harvestDate: '2026-09-15',
      weatherZone: 'Zone B - Subtropical',
      satelliteCoverage: 'Sentinel-2 Tile 43PGP'
    }
  }

  const saveExtraMetadata = (id: number, meta: ExtraMetadata) => {
    localStorage.setItem(`kairos_farm_extra_${id}`, JSON.stringify(meta))
  }

  const handleOpenCreate = () => {
    setName('')
    setCropType('Rice')
    setArea('3.0')
    setPolygon('') // start with empty or default GeoJSON
    
    setOwner('Demo Farmer')
    setLocation('Coimbatore, TN')
    setGrowthStage('Vegetative')
    setPlantingDate('2026-05-10')
    setHarvestDate('2026-09-15')
    setWeatherZone('Zone B - Subtropical')
    setSatelliteCoverage('Sentinel-2 Tile 43PGP')

    setEditMode(false)
    setTargetEditId(null)
    setModalOpen(true)
  }

  const routerLocation = useLocation()
  React.useEffect(() => {
    if (routerLocation.state && (routerLocation.state as any).openModal) {
      handleOpenCreate()
      // Clear the state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title)
    }
  }, [routerLocation.state])

  const handleOpenEdit = (id: number) => {
    const farm = farms.find(f => f.id === id)
    if (!farm) return

    setName(farm.name)
    setCropType(farm.crop_type)
    setArea(farm.area_ha.toString())
    setPolygon(typeof farm.polygon === 'string' ? farm.polygon : JSON.stringify(farm.polygon))

    const meta = getExtraMetadata(id)
    setOwner(meta.owner)
    setLocation(meta.location)
    setGrowthStage(meta.growthStage)
    setPlantingDate(meta.plantingDate)
    setHarvestDate(meta.harvestDate)
    setWeatherZone(meta.weatherZone)
    setSatelliteCoverage(meta.satelliteCoverage)

    setEditMode(true)
    setTargetEditId(id)
    setModalOpen(true)
  }

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Farm name is required')
      return
    }

    if (!polygon || polygon.trim() === '') {
      setError('Please draw a valid field boundary on the map.')
      return
    }

    try {
      const geojson = JSON.parse(polygon)
      if (geojson.type !== 'Polygon') {
        throw new Error()
      }
    } catch {
      setError('Invalid field boundary generated. Please redraw the polygon.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const payload = {
        name: name.trim(),
        crop_type: cropType,
        area_ha: parseFloat(area) || 0,
        polygon: polygon.trim()
      }

      let updatedId = targetEditId

      if (editMode && targetEditId !== null) {
        await farmAPI.update(targetEditId, payload)
      } else {
        const newFarm = await farmAPI.create(payload)
        updatedId = newFarm.id
      }
      
      // Save extra metadata variables
      if (updatedId !== null) {
        saveExtraMetadata(updatedId, {
          owner: owner.trim(),
          location: location.trim(),
          growthStage,
          plantingDate,
          harvestDate,
          weatherZone: weatherZone.trim(),
          satelliteCoverage: satelliteCoverage.trim()
        })
      }

      setModalOpen(false)
      refetchFarms()
    } catch (err: any) {
      setError(err.message || 'Failed to sync farm parcel data.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFarm = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this farm parcel registry? Telemetry data histories will be unlinked.")) return
    try {
      await farmAPI.delete(id)
      localStorage.removeItem(`kairos_farm_extra_${id}`)
      refetchFarms()
    } catch (err) {
      alert("Failed to delete farm")
    }
  }

  // Summary Metrics calculations
  const totalAcreage = farms.reduce((acc, f) => acc + f.area_ha, 0)
  const avgHealth = farms.length > 0 ? Math.round(farms.reduce((acc, f) => acc + f.health_score, 0) / farms.length) : 0
  const activeAlerts = farms.filter(f => f.health_score < 60).length

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col justify-between space-y-3 sm:flex-row sm:items-center sm:space-y-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Farm Registry Center</h1>
          <p className="text-xs text-slate-500">
            Manage your registered agricultural land parcels, owner specs, device nodes, and crop parameters.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-[#2E7D32] hover:bg-[#1B5E20]">
          <Plus className="mr-2 h-4 w-4" /> Register Land Parcel
        </Button>
      </div>

      {/* ─── SUMMARY STATS ROW ─────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="hover:border-[#DCE3D6] transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Registered Farms</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{farms.length}</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-green-50 text-[#2E7D32] border border-[#DCE3D6]/50 flex items-center justify-center">
              <LayoutGrid className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-[#DCE3D6] transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aggregate Acreage</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalAcreage.toFixed(1)} <span className="text-xs font-semibold text-slate-400">Ha</span></p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-green-50 text-[#2E7D32] border border-[#DCE3D6]/50 flex items-center justify-center">
              <Sprout className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-[#DCE3D6] transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mean Crop Health</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{avgHealth}%</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-green-50 text-[#2E7D32] border border-[#DCE3D6]/50 flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-[#DCE3D6] transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Device Alert Status</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{activeAlerts}</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-red-50 text-red-600 border border-red-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── GRID OF REGISTERED FARMS ───────────────────────────────────────────── */}
      <div className="space-y-6">
        {farms.map((farm) => {
          const meta = getExtraMetadata(farm.id)

          // Parse coordinates for centroid display
          let centroid = "11.02, 76.95"
          try {
            const coords = typeof farm.polygon === 'string' ? JSON.parse(farm.polygon) : farm.polygon
            if (Array.isArray(coords) && coords.length > 0) {
              const latSum = coords.reduce((acc: number, val: number[]) => acc + val[0], 0)
              const lonSum = coords.reduce((acc: number, val: number[]) => acc + val[1], 0)
              centroid = `${(latSum / coords.length).toFixed(4)}, ${(lonSum / coords.length).toFixed(4)}`
            }
          } catch {}

          return (
            <Card key={farm.id} className="relative overflow-hidden transition-all hover:border-[#DCE3D6] shadow-sm">
              {/* Health color bar indicator */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                farm.health_score >= 80 ? 'bg-[#2E7D32]' : 
                farm.health_score >= 60 ? 'bg-[#FFB300]' : 'bg-red-500'
              }`} />

              <CardContent className="p-6 pt-8 space-y-6">
                
                {/* Section 1: Header name and primary parameters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EDF1EA]/60 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-extrabold text-slate-900">{farm.name}</h3>
                      <Badge variant={farm.health_score >= 80 ? 'success' : farm.health_score >= 60 ? 'warning' : 'destructive'} className="py-0 px-1.5 text-[9px] font-bold">
                        {farm.health_score}% Index
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-semibold">
                      <span className="flex items-center"><User className="h-3.5 w-3.5 mr-1 text-slate-400" /> Owner: {meta.owner}</span>
                      <span className="flex items-center"><MapPin className="h-3.5 w-3.5 mr-1 text-slate-400" /> Lat/Lon Centroid: {centroid}</span>
                      <span className="flex items-center"><Sprout className="h-3.5 w-3.5 mr-1 text-[#2E7D32]" /> Crop: {farm.crop_type}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <Button onClick={() => handleOpenEdit(farm.id)} variant="outline" size="sm" className="h-8 text-xs">
                      <Edit className="mr-1.5 h-3.5 w-3.5 text-slate-600" /> Edit Info
                    </Button>
                    <Button onClick={() => handleDeleteFarm(farm.id)} variant="ghost" size="sm" className="h-8 text-xs text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Section 2: Detailed Parameters Grid & Small Map */}
                <div className="grid gap-6 md:grid-cols-5">
                  
                  {/* Text details (3 cols) */}
                  <div className="md:col-span-3 grid gap-4 sm:grid-cols-2 text-xs">
                    
                    <div className="bg-[#F7F9F5]/40 border border-[#DCE3D6]/20 p-3.5 rounded-xl space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Growth Stage Status</span>
                      <p className="font-bold text-slate-800 flex items-center">
                        <Activity className="h-3.5 w-3.5 mr-1.5 text-[#2E7D32]" /> {meta.growthStage} Stage
                      </p>
                    </div>

                    <div className="bg-[#F7F9F5]/40 border border-[#DCE3D6]/20 p-3.5 rounded-xl space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Weather Classification</span>
                      <p className="font-bold text-slate-800 flex items-center">
                        <CloudSun className="h-3.5 w-3.5 mr-1.5 text-[#2E7D32]" /> {meta.weatherZone}
                      </p>
                    </div>

                    <div className="bg-[#F7F9F5]/40 border border-[#DCE3D6]/20 p-3.5 rounded-xl space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Satellite Tile Registry</span>
                      <p className="font-bold text-slate-800 flex items-center">
                        <Layers className="h-3.5 w-3.5 mr-1.5 text-[#2E7D32]" /> {meta.satelliteCoverage}
                      </p>
                    </div>

                    <div className="bg-[#F7F9F5]/40 border border-[#DCE3D6]/20 p-3.5 rounded-xl space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Field Area Size</span>
                      <p className="font-bold text-slate-800 flex items-center">
                        <LayoutGrid className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> {farm.area_ha} Hectares
                      </p>
                    </div>

                    <div className="bg-[#F7F9F5]/40 border border-[#DCE3D6]/20 p-3.5 rounded-xl space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Planting Date</span>
                      <p className="font-bold text-slate-800 flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400" /> {meta.plantingDate}
                      </p>
                    </div>

                    <div className="bg-[#F7F9F5]/40 border border-[#DCE3D6]/20 p-3.5 rounded-xl space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Est. Harvest Target</span>
                      <p className="font-bold text-slate-800 flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400" /> {meta.harvestDate}
                      </p>
                    </div>

                  </div>

                  {/* SVG Map (2 cols) */}
                  <div className="md:col-span-2 h-40 border border-[#DCE3D6]/70 rounded-xl bg-slate-900 relative overflow-hidden flex items-center justify-center">
                    {/* Dark Grid Backdrop */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                    
                    {/* SVG map visual overlay */}
                    <svg className="h-full w-full max-w-[160px]" viewBox="0 0 100 100">
                      {/* Polygon */}
                      <polygon 
                        points="20,20 80,15 85,75 15,80" 
                        fill="rgba(46, 125, 50, 0.1)" 
                        stroke="#2E7D32" 
                        strokeWidth="1.2"
                      />
                      
                      {/* Blinking Sensor Pins */}
                      <circle cx="35" cy="35" r="2.5" fill="#FFB300" />
                      <circle cx="35" cy="35" r="6" stroke="#FFB300" strokeWidth="0.8" fill="none" className="animate-ping" style={{ animationDuration: '3s' }} />

                      <circle cx="65" cy="40" r="2.5" fill="#FFB300" />
                      <circle cx="65" cy="40" r="6" stroke="#FFB300" strokeWidth="0.8" fill="none" className="animate-ping" style={{ animationDuration: '4s' }} />

                      <circle cx="50" cy="65" r="2.5" fill="#FFB300" />
                      <circle cx="50" cy="65" r="6" stroke="#FFB300" strokeWidth="0.8" fill="none" className="animate-ping" style={{ animationDuration: '2.5s' }} />
                    </svg>

                    <div className="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[8px] border border-slate-800 font-bold text-slate-400 flex items-center">
                      <MapIcon className="h-3 w-3 mr-1 text-[#2E7D32]" /> IoT Sensor Pins Active
                    </div>
                  </div>

                </div>

                {/* Section 3: Active Hardware Devices Panel */}
                <div className="border-t border-[#EDF1EA]/70 pt-4 space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Active Edge Mesh Devices</span>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="flex items-center space-x-1.5 bg-[#F7F9F5] border-[#DCE3D6]/60">
                      <Cpu className="h-3 w-3 text-[#2E7D32]" />
                      <span className="font-semibold text-slate-700">IoT_NODE_01 (Soil/Temp)</span>
                    </Badge>
                    <Badge variant="outline" className="flex items-center space-x-1.5 bg-[#F7F9F5] border-[#DCE3D6]/60">
                      <Cpu className="h-3 w-3 text-[#2E7D32]" />
                      <span className="font-semibold text-slate-700">IoT_NODE_02 (Soil/NPK)</span>
                    </Badge>
                    <Badge variant="outline" className="flex items-center space-x-1.5 bg-[#F7F9F5] border-[#DCE3D6]/60">
                      <Cpu className="h-3 w-3 text-[#2E7D32]" />
                      <span className="font-semibold text-slate-700">IoT_NODE_03 (Soil pH)</span>
                    </Badge>
                    <Badge variant="outline" className="flex items-center space-x-1.5 bg-[#F7F9F5] border-[#DCE3D6]/60">
                      <Shield className="h-3 w-3 text-[#FFB300]" />
                      <span className="font-semibold text-slate-700">LORA_GATEWAY_HUB_01</span>
                    </Badge>
                  </div>
                </div>

              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* New / Edit Farm Modal Form */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setError('') }}
        title={editMode ? "Modify Farm Parcel Information" : "Register Farm Land Parcel"}
      >
        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-xs font-semibold text-red-700 flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Farm Name & Owner */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 pl-0.5 flex items-center">
                <LayoutGrid className="h-3.5 w-3.5 mr-1 text-slate-400" /> Farm Name
              </label>
              <Input
                type="text"
                placeholder="West Barley Field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 pl-0.5 flex items-center">
                <User className="h-3.5 w-3.5 mr-1 text-slate-400" /> Owner Name
              </label>
              <Input
                type="text"
                placeholder="John Doe"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Area & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 pl-0.5 flex items-center">
                <LayoutGrid className="h-3.5 w-3.5 mr-1 text-slate-400" /> Size (Ha) - Auto Calculated
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="3.2"
                value={area}
                disabled={true}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 pl-0.5 flex items-center">
                <MapPin className="h-3.5 w-3.5 mr-1 text-slate-400" /> Location (City)
              </label>
              <Input
                type="text"
                placeholder="Coimbatore, TN"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Crop Type & Growth Stage */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 pl-0.5 flex items-center">
                <Sprout className="h-3.5 w-3.5 mr-1 text-slate-400" /> Crop Type
              </label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                disabled={loading}
                className="flex h-10 w-full rounded-lg border border-[#DCE3D6] bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                <option value="Rice">Rice</option>
                <option value="Mango">Mango</option>
                <option value="Wheat">Wheat</option>
                <option value="Cotton">Cotton</option>
                <option value="Barley">Barley</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 pl-0.5 flex items-center">
                <Activity className="h-3.5 w-3.5 mr-1 text-slate-400" /> Growth Stage
              </label>
              <select
                value={growthStage}
                onChange={(e) => setGrowthStage(e.target.value)}
                disabled={loading}
                className="flex h-10 w-full rounded-lg border border-[#DCE3D6] bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                <option value="Germination">Germination</option>
                <option value="Vegetative">Vegetative</option>
                <option value="Maturation">Maturation</option>
              </select>
            </div>
          </div>

          {/* Planting & Harvest Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 pl-0.5 flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1 text-slate-400" /> Planting Date
              </label>
              <Input
                type="date"
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 pl-0.5 flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1 text-slate-400" /> Harvest Target
              </label>
              <Input
                type="date"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Weather Zone & Satellite Tile */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 pl-0.5 flex items-center">
                <CloudSun className="h-3.5 w-3.5 mr-1 text-slate-400" /> Weather Zone
              </label>
              <Input
                type="text"
                placeholder="Zone B - Subtropical"
                value={weatherZone}
                onChange={(e) => setWeatherZone(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 pl-0.5 flex items-center">
                <Layers className="h-3.5 w-3.5 mr-1 text-slate-400" /> Satellite Tile
              </label>
              <Input
                type="text"
                placeholder="Sentinel-2 Tile 43PGP"
                value={satelliteCoverage}
                onChange={(e) => setSatelliteCoverage(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Polygon Boundaries Interactive Map */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-0.5">
              <label className="text-xs font-bold text-slate-700">Field Boundary</label>
              <span className="text-[9px] text-[#2E7D32] bg-[#E8F5E9] px-1.5 py-0.5 rounded-full font-bold">Draw to auto-calculate area</span>
            </div>
            <div className="border border-[#DCE3D6] rounded-xl overflow-hidden shadow-inner">
              <FarmMap 
                mode="edit" 
                polygon={polygon} 
                onChange={(geo, areaHa) => {
                  setPolygon(geo)
                  setArea(areaHa.toFixed(2))
                }} 
                height="280px" 
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex space-x-3 pt-3 border-t border-[#EDF1EA]/50 justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => { setModalOpen(false); setError('') }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={loading} className="bg-[#2E7D32] hover:bg-[#1B5E20]">
              {editMode ? "Modify Information" : "Register Land Parcel"} <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  )
}
export { AlertCircle }
