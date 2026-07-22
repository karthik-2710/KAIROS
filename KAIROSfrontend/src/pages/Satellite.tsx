import React from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FarmContextType } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  Satellite, 
  Map,
  Zap,
  Info,
  Cloud,
  Activity,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Maximize
} from 'lucide-react'
import { dashboardAPI, satelliteAPI } from '@/services/api'
import { FarmMap } from '@/components/ui/FarmMap'
import { getHealthStatus } from '@/utils/health'

export default function SatelliteAnalysis() {
  const { selectedFarmId, farms } = useOutletContext<FarmContextType>()
  const farmId = selectedFarmId || farms[0]?.id || 1
  const currentFarm = farms.find(f => f.id === farmId) || farms[0]

  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Use the exact same query as the Dashboard to ensure 100% data consistency
  const { 
    data: dashData, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['dashboard', farmId],
    queryFn: () => dashboardAPI.get(farmId),
    enabled: !!farmId
  })

  const satellite = dashData?.satellite

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setError(null)
    try {
      await satelliteAPI.trigger(farmId)
      await refetch()
    } catch (err: any) {
      console.error(err)
      const errorMsg = err.response?.data?.error || "Failed to synchronize with Sentinel Hub."
      setError(`Sync Failed: ${errorMsg}`)
    } finally {
      setIsRefreshing(false)
    }
  }

  const health = getHealthStatus(satellite?.ndvi_mean)

  return (
    <div className="space-y-6 text-slate-300">
      
      {/* Page Header */}
      <div className="flex flex-col justify-between space-y-3 sm:flex-row sm:items-center sm:space-y-0 border-b border-[#1e2e22]/50 pb-4">
        <div>
          <span className="text-[9px] font-bold text-[#2E7D32] uppercase tracking-wider">GIS Radiometric Panel</span>
          <h1 className="text-xl font-bold tracking-tight text-white mt-1 flex items-center">
            <Satellite className="h-5 w-5 mr-2 text-[#2E7D32]" /> Satellite Imagery Analytics
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#2E7D32] bg-[#2E7D32]/10 text-white hover:bg-[#2E7D32]/20 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Syncing...' : 'Refresh Analysis'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-4 flex items-start space-x-2 text-red-200">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}
      
      {!satellite && !isLoading && !error && (
        <div className="bg-[#FFB300]/10 border border-[#FFB300]/30 rounded-xl p-4 flex items-start space-x-2 text-[#FFB300]">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span className="text-sm font-semibold">Unable to retrieve Sentinel analytics. Please refresh or try again later.</span>
        </div>
      )}

      {/* ─── MAIN MAP VIEWPORT & METADATA GRID ─────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Large GIS Map component (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-[#1e2e22] bg-[#0A0E0C] overflow-hidden relative shadow-2xl h-full min-h-[400px]">
            {/* GIS Top bar header info */}
            <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-950/80 px-2.5 py-1 rounded border border-[#1e2e22] backdrop-blur flex items-center">
                <Map className="h-3 w-3 mr-1 text-[#2E7D32]" /> 
                viewer_gis // {currentFarm?.name}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-950/80 px-2.5 py-1 rounded border border-[#1e2e22] backdrop-blur">
                Mode: Observation
              </span>
            </div>

            {/* Farm Map Integration */}
            <div className="h-full w-full">
              {currentFarm?.polygon ? (
                 <FarmMap 
                   mode="view" 
                   polygon={currentFarm.polygon as string} 
                   height="100%"
                   ndviColor={health.bg}
                 />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-black/60 text-slate-500 text-sm">
                  No spatial boundary defined for this farm.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: GIS Telemetry specs (1 col) */}
        <div className="space-y-6">
          <Card className="border-[#1e2e22] bg-[#0A0E0C] h-full">
            <CardHeader className="pb-3 border-b border-[#1e2e22]/50">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Satellite Specs & Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="space-y-1.5 border-b border-[#1e2e22]/40 pb-3">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Orbiter Platform</span>
                <p className="font-bold text-slate-200">Sentinel-2A/B Constellation</p>
              </div>

              <div className="grid grid-cols-2 gap-3 border-b border-[#1e2e22]/40 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Spatial Res.</span>
                  <p className="font-semibold text-slate-300">10-meter/pixel</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Revisit Time</span>
                  <p className="font-semibold text-slate-300">5 days</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-b border-[#1e2e22]/40 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Acquisition Date</span>
                  <p className="font-semibold text-[#FFB300]">
                    {satellite?.timestamp ? new Date(satellite.timestamp).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Cloud Coverage</span>
                  <p className="font-semibold text-slate-300">
                    {satellite?.cloud_coverage !== undefined ? `${satellite.cloud_coverage}%` : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="space-y-1 border-b border-[#1e2e22]/40 pb-3">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Farm Area</span>
                <p className="font-semibold text-slate-300">{currentFarm?.area_ha.toFixed(2)} Hectares</p>
              </div>

              {/* Status checklist specs */}
              <div className="rounded-xl border border-[#1e2e22]/70 bg-slate-950/40 p-3 text-[10px] text-slate-400 space-y-2 leading-relaxed">
                <p className="font-bold text-[#2E7D32] flex items-center">
                  <Zap className="h-3 w-3 mr-1 text-[#2E7D32]" /> Spectral Indices:
                </p>
                <div className="space-y-1 font-semibold">
                  <p>• Band 04 (Red): 665nm wavelength</p>
                  <p>• Band 08 (NIR): 842nm wavelength</p>
                  <p className="text-[#FFB300] font-bold mt-1">Formula: (NIR - RED) / (NIR + RED)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── BOTTOM ROW: STATISTICS GRID ─────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Mean NDVI */}
        <Card className="border-[#1e2e22] bg-[#0A0E0C]">
          <CardContent className="pt-5 space-y-1 text-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide block flex items-center justify-center">
              <Activity className="h-3 w-3 mr-0.5 text-blue-500" /> Mean NDVI Score
            </span>
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-800 animate-pulse mx-auto rounded mt-2"></div>
            ) : (
              <p className="text-2xl font-black text-white">{satellite?.ndvi_mean ?? 'N/A'}</p>
            )}
            <Badge variant="outline" className="text-[8px] py-0">Vegetation Index</Badge>
          </CardContent>
        </Card>

        {/* Health Class */}
        <Card className="border-[#1e2e22] bg-[#0A0E0C]">
          <CardContent className="pt-5 space-y-1 text-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide block flex items-center justify-center">
              <TrendingUp className="h-3 w-3 mr-0.5 text-green-500" /> Health Status
            </span>
            {isLoading ? (
              <div className="h-8 w-24 bg-slate-800 animate-pulse mx-auto rounded mt-2"></div>
            ) : (
              <>
                <p className={`text-2xl font-black ${health.color}`}>
                  {health.text}
                </p>
                <Badge variant="outline" className={`text-[8px] py-0 ${health.border}`}>Canopy Assessment</Badge>
              </>
            )}
          </CardContent>
        </Card>

        {/* Min/Max Range */}
        <Card className="border-[#1e2e22] bg-[#0A0E0C]">
          <CardContent className="pt-5 space-y-1 text-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide block flex items-center justify-center">
              <Maximize className="h-3 w-3 mr-0.5 text-[#FFB300]" /> Variance (Min / Max)
            </span>
            {isLoading ? (
              <div className="h-8 w-20 bg-slate-800 animate-pulse mx-auto rounded mt-2"></div>
            ) : (
              <p className="text-2xl font-black text-white">
                {satellite?.ndvi_min !== undefined && satellite?.ndvi_max !== undefined ? 
                 `Min: ${satellite.ndvi_min} / Max: ${satellite.ndvi_max}` : 
                 'N/A'}
              </p>
            )}
            <Badge variant="outline" className="text-[8px] py-0 border-[#FFB300]/40 text-[#FFB300]">Field Uniformity</Badge>
          </CardContent>
        </Card>

        {/* Cloud Coverage */}
        <Card className="border-[#1e2e22] bg-[#0A0E0C]">
          <CardContent className="pt-5 space-y-1 text-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide block flex items-center justify-center">
              <Cloud className="h-3 w-3 mr-0.5 text-slate-400" /> Cloud Mask
            </span>
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-800 animate-pulse mx-auto rounded mt-2"></div>
            ) : (
              <p className="text-2xl font-black text-slate-300">
                {satellite?.cloud_coverage !== undefined ? `${satellite.cloud_coverage}%` : 'N/A'}
              </p>
            )}
            <Badge variant="outline" className="text-[8px] py-0">Atmospheric Condition</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Warning info panel at the bottom */}
      <div className="bg-[#EDF1EA]/5 border border-[#1e2e22] rounded-xl p-4 flex items-start space-x-2 text-xs text-slate-400 leading-relaxed">
        <Info className="h-4.5 w-4.5 text-[#FFB300] shrink-0 mt-0.5" />
        <span>
          Satellite analyses are generated from real Sentinel Hub EO data. The analytics shown reflect the most recent pass with optimal cloud cover limits. Historical imagery will become available as sequential satellite passes are captured and recorded over your active parcels.
        </span>
      </div>

    </div>
  )
}
