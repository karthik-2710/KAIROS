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
import { useTranslation } from 'react-i18next'

export default function SatelliteAnalysis() {
  const { t } = useTranslation()
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
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0 border-b border-slate-200/50 dark:border-white/5 pb-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("GIS Radiometric Panel")}</span>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mt-1 flex items-center">
            <Satellite className="h-8 w-8 mr-3 text-primary dark:text-primary-300" /> {t("Satellite Imagery Analytics")}
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#2E7D32] bg-[#2E7D32]/10 text-white hover:bg-[#2E7D32]/20 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? t("Syncing...") : t("Refresh Analysis")}
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
        <div className="bg-[#FFB300]/10 border border-[#FFB300]/30 rounded-xl p-4 flex items-start space-x-2 text-highlight dark:text-highlight-300">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span className="text-sm font-semibold">Unable to retrieve Sentinel analytics. Please refresh or try again later.</span>
        </div>
      )}

      {/* ─── MAIN MAP VIEWPORT & METADATA GRID ─────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Large GIS Map component (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200/70 dark:border-white/10 shadow-premium rounded-[2rem] relative h-[500px] md:h-[600px] overflow-hidden">
            {/* GIS Top bar header info */}
            <div className="absolute top-6 left-6 right-6 z-10 flex items-center justify-between pointer-events-none">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest glass dark:bg-dark-surface/90 px-4 py-2 rounded-2xl flex items-center shadow-lg">
                <Map className="h-4 w-4 mr-2 text-accent" /> 
                viewer_gis // {currentFarm?.name}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest glass dark:bg-dark-surface/90 px-4 py-2 rounded-2xl shadow-lg">
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
                <div className="h-full w-full flex items-center justify-center bg-black/60 text-slate-500 dark:text-slate-400 text-sm">
                  No spatial boundary defined for this farm.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: GIS Telemetry specs (1 col) */}
        <div className="space-y-6">
          <Card className="h-full border-slate-200/70 dark:border-white/10 shadow-premium rounded-[2rem]">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-white/5">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {t("Satellite Specs & Metadata")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6 text-sm">
              <div className="space-y-1.5 border-b border-slate-100 dark:border-white/5 pb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orbiter Platform</span>
                <p className="font-bold text-slate-900 dark:text-slate-200 text-lg">Sentinel-2A/B Constellation</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spatial Res.</span>
                  <p className="font-bold text-slate-900 dark:text-slate-300">10-meter/pixel</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revisit Time</span>
                  <p className="font-bold text-slate-900 dark:text-slate-300">5 days</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acquisition Date</span>
                  <p className="font-bold text-accent dark:text-accent-300">
                    {satellite?.timestamp ? new Date(satellite.timestamp).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cloud Coverage</span>
                  <p className="font-bold text-slate-900 dark:text-slate-300">
                    {satellite?.cloud_coverage !== undefined ? `${satellite.cloud_coverage}%` : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 border-b border-slate-100 dark:border-white/5 pb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Farm Area</span>
                <p className="font-bold text-slate-900 dark:text-slate-300 text-lg">{currentFarm?.area_ha.toFixed(2)} Hectares</p>
              </div>

              {/* Status checklist specs */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-dark-elevated p-5 text-xs text-slate-500 dark:text-slate-400 space-y-3 leading-relaxed shadow-inner">
                <p className="font-bold text-primary dark:text-primary-300 flex items-center">
                  <Zap className="h-4 w-4 mr-1.5 text-accent" /> Spectral Indices:
                </p>
                <div className="space-y-1.5 font-semibold">
                  <p>• Band 04 (Red): 665nm wavelength</p>
                  <p>• Band 08 (NIR): 842nm wavelength</p>
                  <p className="text-highlight dark:text-highlight-300 font-bold mt-2">Formula: (NIR - RED) / (NIR + RED)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── BOTTOM ROW: STATISTICS GRID ─────────────────────────────────────────── */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Mean NDVI */}
        <Card className="border-slate-200/70 dark:border-white/10 shadow-sm rounded-[2rem]">
          <CardContent className="p-6 space-y-3 text-center h-full flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block flex items-center justify-center">
              <Activity className="h-4 w-4 mr-1 text-accent" /> Mean NDVI Score
            </span>
            {isLoading ? (
              <div className="h-10 w-24 bg-slate-100 dark:bg-white/5 animate-pulse mx-auto rounded-lg mt-4"></div>
            ) : (
              <p className="text-5xl font-black text-slate-900 dark:text-white my-4">{satellite?.ndvi_mean ?? 'N/A'}</p>
            )}
            <Badge variant="outline" className="text-[10px] font-bold border-slate-200 dark:border-white/10 text-slate-500 mx-auto w-fit">Vegetation Index</Badge>
          </CardContent>
        </Card>

        {/* Health Class */}
        <Card className="border-slate-200/70 dark:border-white/10 shadow-sm rounded-[2rem]">
          <CardContent className="p-6 space-y-3 text-center h-full flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block flex items-center justify-center">
              <TrendingUp className="h-4 w-4 mr-1 text-status-success" /> Health Status
            </span>
            {isLoading ? (
              <div className="h-10 w-32 bg-slate-100 dark:bg-white/5 animate-pulse mx-auto rounded-lg mt-4"></div>
            ) : (
              <>
                <p className={`text-4xl font-black my-4 ${health.color}`}>
                  {health.text}
                </p>
                <Badge variant="outline" className={`text-[10px] font-bold mx-auto w-fit ${health.border}`}>Canopy Assessment</Badge>
              </>
            )}
          </CardContent>
        </Card>

        {/* Min/Max Range */}
        <Card className="border-slate-200/70 dark:border-white/10 shadow-sm rounded-[2rem]">
          <CardContent className="p-6 space-y-3 text-center h-full flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block flex items-center justify-center">
              <Maximize className="h-4 w-4 mr-1 text-highlight dark:text-highlight-300" /> Variance (Min / Max)
            </span>
            {isLoading ? (
              <div className="h-10 w-24 bg-slate-100 dark:bg-white/5 animate-pulse mx-auto rounded-lg mt-4"></div>
            ) : (
              <p className="text-4xl font-black text-slate-900 dark:text-white my-4">
                {satellite?.ndvi_min !== undefined && satellite?.ndvi_max !== undefined ? 
                 `${satellite.ndvi_min} / ${satellite.ndvi_max}` : 
                 'N/A'}
              </p>
            )}
            <Badge variant="outline" className="text-[10px] font-bold border-highlight/40 text-highlight dark:text-highlight-300 mx-auto w-fit">Field Uniformity</Badge>
          </CardContent>
        </Card>

        {/* Cloud Coverage */}
        <Card className="border-slate-200/70 dark:border-white/10 shadow-sm rounded-[2rem]">
          <CardContent className="p-6 space-y-3 text-center h-full flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block flex items-center justify-center">
              <Cloud className="h-4 w-4 mr-1 text-slate-400" /> Cloud Mask
            </span>
            {isLoading ? (
              <div className="h-10 w-24 bg-slate-100 dark:bg-white/5 animate-pulse mx-auto rounded-lg mt-4"></div>
            ) : (
              <p className="text-5xl font-black text-slate-900 dark:text-white my-4">
                {satellite?.cloud_coverage !== undefined ? `${satellite.cloud_coverage}%` : 'N/A'}
              </p>
            )}
            <Badge variant="outline" className="text-[10px] font-bold border-slate-200 dark:border-white/10 text-slate-500 mx-auto w-fit">Atmospheric Condition</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Warning info panel at the bottom */}
      <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex items-start space-x-3 text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed shadow-inner">
        <Info className="h-5 w-5 text-highlight dark:text-highlight-300 shrink-0 mt-0.5" />
        <span>
          Satellite analyses are generated from real Sentinel Hub EO data. The analytics shown reflect the most recent pass with optimal cloud cover limits. Historical imagery will become available as sequential satellite passes are captured and recorded over your active parcels.
        </span>
      </div>

    </div>
  )
}
