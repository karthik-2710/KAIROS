import React from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FarmContextType } from '@/components/layout/Layout'
import { dashboardAPI, satelliteAPI, marketAPI, weatherAPI } from '@/services/api'
import { useSensorData } from '@/hooks/useSensorData'
import { SensorData, SatelliteData, Recommendation, DashboardStats } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  LineChart,
  Line
} from 'recharts'
import { 
  Thermometer, 
  Droplets, 
  Brain, 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  Cloud as CloudIcon, 
  Map as MapIcon, 
  CloudRain,
  Gauge,
  Radio,
  Clock,
  Wind,
  Store,
  ArrowRight,
  ShieldCheck,
  CloudSun
} from 'lucide-react'
import { FarmMap } from '@/components/ui/FarmMap'
import { getHealthStatus } from '@/utils/health'
import { useTranslation } from 'react-i18next'
import { 
  localizeCrop, 
  localizeThreat, 
  localizeSeverity, 
  localizeRationale, 
  localizeAction 
} from '@/utils/localize'

export default function Dashboard() {
  const { t } = useTranslation()
  const { selectedFarmId, farms } = useOutletContext<FarmContextType>()
  const farmId = selectedFarmId || farms[0]?.id || 1
  const [isSyncing, setIsSyncing] = React.useState(false)

  // Real-Time ESP32 Firebase RTDB Telemetry
  const {
    data: esp32,
    connectionStatus,
    lastUpdatedText,
    liveHistory
  } = useSensorData('/')

  const handleSync = async () => {
    try {
      setIsSyncing(true)
      console.log("[Sync] Triggering Sentinel Hub and Multimodal analysis...")
      const res = await satelliteAPI.trigger(farmId)
      console.log("[Sync] Response received:", res)
      await refetchDash()
    } catch (err: any) {
      console.error("[Sync] Error during sync:", err)
      const errorMsg = err.response?.data?.error || "Failed to synchronize with satellite data."
      alert(`Sync Failed: ${errorMsg}`)
    } finally {
      setIsSyncing(false)
    }
  }

  // Fetch unified dashboard data
  const { 
    data: dashData, 
    isLoading: dashLoading, 
    isError: dashError, 
    refetch: refetchDash 
  } = useQuery({
    queryKey: ['dashboard', farmId],
    queryFn: () => dashboardAPI.get(farmId),
    enabled: !!farmId,
    refetchInterval: 60000
  })

  const currentFarm = farms.find(f => f.id === farmId)

  // Fetch market intelligence summary for active farm's crop
  const { data: marketSummary } = useQuery({
    queryKey: ['market-summary', farmId, currentFarm?.crop_type],
    queryFn: () => marketAPI.getSummary(farmId, currentFarm?.crop_type, 'Maharashtra'),
    enabled: !!farmId,
    staleTime: 60000 * 30
  })

  // Fetch farm weather risk assessment for Dashboard Warning Card
  const { data: weatherRiskData } = useQuery({
    queryKey: ['dash-weather-risk', farmId],
    queryFn: () => weatherAPI.getFarmWeather(farmId),
    enabled: !!farmId,
    staleTime: 30000
  })

  // Dynamic Badge for the Node
  const getConnectionBadge = () => {
    switch (connectionStatus) {
      case 'LIVE':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-1 text-xs font-bold flex items-center shadow-sm">
            <span className="relative flex h-2 w-2 mr-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {t("Live Node")}
          </Badge>
        )
      case 'STALE':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2.5 py-1 text-xs font-bold flex items-center">
            <span className="h-2 w-2 rounded-full bg-amber-500 mr-1.5" />
            {t("Unstable")}
          </Badge>
        )
      case 'ERROR':
        return (
          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 px-2.5 py-1 text-xs font-bold flex items-center">
            <span className="h-2 w-2 rounded-full bg-rose-500 mr-1.5" />
            {t("Critical")}
          </Badge>
        )
      default:
        return (
          <Badge className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30 px-2.5 py-1 text-xs font-bold flex items-center">
            <span className="h-2 w-2 rounded-full bg-slate-400 mr-1.5" />
            {t("offline")}
          </Badge>
        )
    }
  }

  // Dynamic Badge for Individual Real Sensor Cards
  const getCardStatusBadge = () => {
    if (connectionStatus === 'LIVE') {
      return (
        <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
          ● {t("Live Node")}
        </span>
      )
    }
    if (connectionStatus === 'STALE') {
      return (
        <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
          ● {t("Unstable")}
        </span>
      )
    }
    if (connectionStatus === 'ERROR') {
      return (
        <span className="text-[9px] font-bold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
          ● {t("Critical")}
        </span>
      )
    }
    return (
      <span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
        {t("offline")}
      </span>
    )
  }

  // Custom live chart tooltip
  const CustomLiveTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-surface p-4 shadow-xl text-xs space-y-1.5">
          <p className="font-bold text-slate-800 dark:text-slate-200">
            {payload[0].payload.time} <span className="text-[10px] text-slate-400 font-mono">LIVE</span>
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 text-xs font-semibold" style={{ color: entry.color }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}: {entry.value}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  if (dashLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Skeleton className="h-[600px] xl:col-span-2 rounded-3xl" />
          <Skeleton className="h-[600px] rounded-3xl" />
        </div>
      </div>
    )
  }

  if (dashError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-status-critical" />
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{t("Sorry, I am having trouble connecting right now. Please try again later.")}</h3>
        <p className="text-slate-500">{t("Please provide a valid API key.")}</p>
        <Button onClick={() => refetchDash()} variant="outline">{t("Refresh Analysis")}</Button>
      </div>
    )
  }

  const sensor = (dashData?.sensor || {}) as SensorData
  const satellite = (dashData?.satellite || {}) as SatelliteData
  const recommendation = (dashData?.recommendation || {}) as Recommendation
  const stats = (dashData?.stats || { alerts: 0, diseases_detected: 0, total_farms: 0, last_analysis: null }) as DashboardStats
  const healthScore = recommendation.health_score || currentFarm?.health_score || 0

  const isEsp32Live = connectionStatus === 'LIVE'

  return (
    <div className="space-y-8 pb-12">
      {/* Enterprise Header */}
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center">
            {currentFarm?.name} <span className="ml-3 text-2xl font-semibold text-slate-400">/ {t("Command Center")}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <Badge variant="outline" className="border-slate-300 dark:border-white/20 text-slate-600 dark:text-slate-300 rounded-lg font-bold">
              {t("Crop")}: {localizeCrop(currentFarm?.crop_type)}
            </Badge>
            <Badge variant="outline" className="border-slate-300 dark:border-white/20 text-slate-600 dark:text-slate-300 rounded-lg font-bold">
              {t("Area")}: {currentFarm?.area_ha} ha
            </Badge>
            <div className="flex items-center space-x-2">
              {getConnectionBadge()}
              <span className="text-[11px] font-medium text-slate-400 font-mono">
                {t("Latest Capture")}: {lastUpdatedText}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={handleSync} className="bg-primary hover:bg-primary-600 text-white shadow-premium rounded-xl px-6 py-5 font-bold" disabled={isSyncing}>
            {isSyncing ? t("Syncing...") : t("Sync Satellite & IoT")}
          </Button>
        </div>
      </div>

      {/* ─── WEATHER INTELLIGENCE & EARLY WARNING CARD ─────────────────── */}
      {weatherRiskData?.risk_analysis && weatherRiskData.risk_analysis.overall_severity !== 'INFO' && (
        <div className="p-5 rounded-[2rem] border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-premium">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 shrink-0">
              <CloudSun className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white">
                  {weatherRiskData.risk_analysis.overall_severity} WEATHER ALERT
                </span>
                <span className="text-xs font-bold opacity-80">
                  {weatherRiskData.weather?.location} &bull; {weatherRiskData.weather?.temperature}°C
                </span>
              </div>
              <h4 className="text-base font-black mt-0.5">
                {weatherRiskData.risk_analysis.alerts?.[0]?.title || 'Weather Risk Alert'}
              </h4>
              <p className="text-xs opacity-90 line-clamp-1 mt-0.5">
                {weatherRiskData.risk_analysis.alerts?.[0]?.why_it_matters}
              </p>
            </div>
          </div>
          <Link
            to="/app/weather"
            className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition self-start md:self-auto"
          >
            {t("View Weather Details")} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ─── LIVE ESP32 HARDWARE STREAM (PRIMARY TELEMETRY HUB - 5 SENSORS) ─────────── */}
      <Card className="rounded-[2rem] shadow-premium border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-white dark:via-dark-surface to-emerald-500/5 overflow-hidden">
        <CardContent className="p-6 md:p-8 space-y-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                <Radio className={`h-5 w-5 ${isEsp32Live ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {t("ESP32 Physical Field Telemetry")}
                  </h3>
                  <span className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                    {t("Hardware Stream")}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("Direct real-time feed from Firebase RTDB (kairos-15394). Real hardware values displayed.")}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs font-semibold text-slate-500">
              <div className="flex items-center space-x-1.5 bg-white dark:bg-white/5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>{t("Last Telemetry")}: <strong>{esp32.timestamp || lastUpdatedText}</strong></span>
              </div>
              {getConnectionBadge()}
            </div>
          </div>

          {/* The 5 Real ESP32 Sensor Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            
            {/* 1. Real Temperature */}
            <div className="p-5 bg-white dark:bg-dark-surface rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t("Temperature")}</span>
                {getCardStatusBadge()}
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {esp32.temperature !== null ? `${esp32.temperature}°C` : (isEsp32Live ? 'Reading...' : t('offline'))}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                <Thermometer className="h-3.5 w-3.5 text-amber-500" />
                <span>DHT11 (GPIO 4)</span>
              </div>
            </div>

            {/* 2. Real Humidity */}
            <div className="p-5 bg-white dark:bg-dark-surface rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t("Rel. Humidity")}</span>
                {getCardStatusBadge()}
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {esp32.humidity !== null ? `${esp32.humidity}%` : (isEsp32Live ? 'Reading...' : t('offline'))}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                <Droplets className="h-3.5 w-3.5 text-blue-500" />
                <span>{t("Canopy Weather")}</span>
              </div>
            </div>

            {/* 3. Real Soil Moisture */}
            <div className="p-5 bg-white dark:bg-dark-surface rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t("Soil Moisture")}</span>
                {getCardStatusBadge()}
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {esp32.soil ? `${esp32.soil.percentage}%` : (isEsp32Live ? 'Reading...' : t('offline'))}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                <Droplets className="h-3.5 w-3.5 text-emerald-500" />
                <span>GPIO 34 (ADC {esp32.soil?.rawValue ?? 2704})</span>
              </div>
            </div>

            {/* 4. Real Rain Sensor */}
            <div className="p-5 bg-white dark:bg-dark-surface rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t("Rain Sensor")}</span>
                {getCardStatusBadge()}
              </div>
              <div className="flex items-baseline space-x-2">
                <span className={`text-2xl font-black ${esp32.rain?.isRaining ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                  {esp32.rain ? (esp32.rain.isRaining ? t('Rain Detected') : t('No Rain')) : (isEsp32Live ? 'Reading...' : t('offline'))}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                <CloudRain className="h-3.5 w-3.5 text-blue-500" />
                <span>HW-103 ({esp32.rain?.rawValue ?? 4095})</span>
              </div>
            </div>

            {/* 5. Real Gas Sensor */}
            <div className="p-5 bg-white dark:bg-dark-surface rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t("Gas Sensor")}</span>
                {getCardStatusBadge()}
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {esp32.gas ? `${esp32.gas.rawValue}` : (isEsp32Live ? 'Reading...' : t('offline'))} 
                  {esp32.gas && <span className="text-sm font-normal text-slate-400 ml-1">ADC</span>}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                <Gauge className="h-3.5 w-3.5 text-emerald-500" />
                <span>MQ-135 AO (GPIO 35)</span>
              </div>
            </div>

          </div>

          {/* Real-time Hardware Chart Stream */}
          {liveHistory.length > 1 && (
            <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider">
                  {t("Live Telemetry")} ({liveHistory.length})
                </span>
                <span className="text-[11px] text-slate-400">Firebase RTDB</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={liveHistory} margin={{ top: 5, right: 15, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.1)" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomLiveTooltip />} />
                    <Line type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#FFB300" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#3B82F6" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="soil" name="Soil (%)" stroke="#10B981" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="gas" name="Gas (ADC)" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Top Layout: GIS Map (Left 2/3) + Hero Stats (Right 1/3) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main GIS Map Panel */}
        <Card className="xl:col-span-2 overflow-hidden border-slate-200/70 dark:border-white/10 shadow-premium rounded-[2rem] relative h-[500px] md:h-[600px] flex flex-col">
          <div className="absolute top-6 left-6 z-10 glass dark:bg-dark-surface/90 px-5 py-3 rounded-2xl flex items-center space-x-3 shadow-lg">
            <MapIcon className="h-5 w-5 text-accent" />
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t("GIS Layer")}</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">{t("Sentinel-2 NDVI Overlay")}</p>
            </div>
          </div>

          <div className="flex-1 w-full bg-slate-50 dark:bg-dark-bg relative">
             <FarmMap mode="view" polygon={currentFarm?.polygon as string | undefined} ndviColor={
                (satellite.ndvi_mean || 0) >= 0.8 ? '#3FAE5A' : 
                (satellite.ndvi_mean || 0) >= 0.6 ? '#153B35' : 
                (satellite.ndvi_mean || 0) >= 0.4 ? '#C48A2A' : 
                (satellite.ndvi_mean || 0) >= 0.2 ? '#D88A1F' : '#B9382A'
             } height="100%" />
          </div>

          {/* Map Footer Metrics */}
          <div className="bg-white dark:bg-dark-surface p-6 border-t border-slate-200/50 dark:border-white/5 flex flex-wrap justify-between items-center gap-4 z-10">
            <div className="flex items-center space-x-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("Mean NDVI")}</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-0.5">{satellite.ndvi_mean !== undefined ? satellite.ndvi_mean : 'N/A'}</p>
              </div>
              <div className="w-px h-10 bg-slate-200 dark:bg-white/10" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("Latest Capture")}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1.5 text-slate-400" />
                  {satellite.timestamp ? new Date(satellite.timestamp).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="w-px h-10 bg-slate-200 dark:bg-white/10" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("Cloud Cover")}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center">
                  <CloudIcon className="h-4 w-4 mr-1.5 text-slate-400" />
                  {satellite.cloud_coverage !== undefined ? `${satellite.cloud_coverage}%` : 'N/A'}
                </p>
              </div>
            </div>
            <Badge className="px-3 py-1.5 text-xs font-bold shadow-sm" style={{ backgroundColor: getHealthStatus(satellite.ndvi_mean).bg, color: 'white' }}>
              {getHealthStatus(satellite.ndvi_mean).text}
            </Badge>
          </div>
        </Card>

        {/* Hero Intelligence Stack (Right Col) */}
        <div className="flex flex-col space-y-6">
          
          {/* Main Health Metric */}
          <Card className={`relative overflow-hidden shadow-premium rounded-[2rem] border-0 text-white ${healthScore >= 75 ? 'bg-primary' : healthScore >= 60 ? 'bg-status-warning' : 'bg-status-critical'}`}>
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white opacity-10 blur-2xl pointer-events-none" />
            <CardContent className="p-8 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-white/80">{t("System Health Index")}</span>
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div className="mt-8 mb-4">
                <span className="text-8xl font-black tracking-tighter block leading-none">{healthScore}<span className="text-4xl text-white/70">%</span></span>
              </div>
              <div>
                <div className="inline-flex items-center bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
                  {healthScore >= 75 ? t('Optimal Baseline') : healthScore >= 60 ? t('Elevated Risk Detected') : t('Critical Intervention Required')}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Alerts */}
          <Card className={`shadow-premium rounded-[2rem] flex-1 flex flex-col justify-center border-slate-200/70 dark:border-white/10 ${stats.alerts > 0 ? 'bg-status-critical/10 border-status-critical/30' : 'bg-white dark:bg-dark-surface'}`}>
            <CardContent className="p-8 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t("Active Threats")}</span>
                <AlertTriangle className={`h-6 w-6 ${stats.alerts > 0 ? 'text-status-critical animate-pulse' : 'text-slate-300 dark:text-slate-600'}`} />
              </div>
              <div className="mt-auto">
                <span className={`text-7xl font-black tracking-tighter ${stats.alerts > 0 ? 'text-status-critical' : 'text-slate-900 dark:text-white'}`}>{stats.alerts}</span>
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                {stats.alerts > 0 ? t('Priority alerts require immediate agronomic review.') : t('All monitored parameters are within safe operational thresholds.')}
              </p>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Middle Grid: Subsurface Telemetry & Recommendations */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Soil Telemetry Line Chart */}
        <Card className="lg:col-span-2 shadow-sm rounded-3xl border-slate-200/70 dark:border-white/10">
          <CardHeader className="pb-2 px-8 pt-8">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-xl font-black">{t("Subsurface Soil Moisture")}</CardTitle>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 text-[10px] font-bold">
                    ● {t("Live Node")}
                  </Badge>
                </div>
                <CardDescription className="mt-1 font-medium">
                  {t("Real-time physical capacitance probe reading from ESP32 GPIO 34.")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-80 px-4 pb-8 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { time: '10:00', moisture: esp32.soil ? esp32.soil.percentage : 47.5 },
                { time: '12:00', moisture: esp32.soil ? esp32.soil.percentage : 48.1 },
                { time: '14:00', moisture: esp32.soil ? esp32.soil.percentage : 47.8 },
                { time: '16:00', moisture: esp32.soil ? esp32.soil.percentage : 48.6 },
                { time: 'Now', moisture: esp32.soil ? esp32.soil.percentage : 48.0 },
              ]} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2388FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2388FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.1)" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="moisture" name="Soil Moisture (%)" stroke="#2388FF" strokeWidth={3} fillOpacity={1} fill="url(#colorMoisture)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Actionable AI Recommendations */}
        <Card className="flex flex-col shadow-sm rounded-3xl border-slate-200/70 dark:border-white/10 overflow-hidden">
          <div className="bg-primary px-8 py-6 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-black text-white flex items-center">
                <Brain className="h-5 w-5 mr-2 opacity-80" /> {t("AI Directive")}
              </CardTitle>
              <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 border-0 text-white shadow-none font-bold">
                {recommendation.severity === 'None' ? t('Healthy') : localizeSeverity(recommendation.severity)}
              </Badge>
            </div>
          </div>
          <CardContent className="p-8 flex flex-col flex-1 bg-white dark:bg-dark-surface space-y-6">
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                {localizeThreat(recommendation.primary_issue) || t('No immediate threats detected.')}
              </h4>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {localizeRationale(recommendation.diagnostic_summary) || t('System analysis indicates optimal growth conditions across all parameters.')}
              </p>
            </div>
            
            <div className="mt-auto pt-6 border-t border-slate-100 dark:border-white/10">
              <span className="text-[10px] font-bold text-primary dark:text-primary-400 uppercase tracking-widest block mb-3">{t("Executive Action")}</span>
              <div className="bg-slate-50 dark:bg-dark-elevated rounded-2xl p-5 border border-slate-200/60 dark:border-white/5 shadow-inner">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                  {(recommendation.recommended_actions && recommendation.recommended_actions.length > 0) 
                    ? localizeAction(recommendation.recommended_actions[0]) 
                    : t('Maintain current agronomic schedule.')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── LIVE CROP MARKET INTELLIGENCE WIDGET ─────────── */}
      <Card className="rounded-[2rem] border-slate-200/70 dark:border-white/10 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white shadow-premium overflow-hidden relative">
        <div className="absolute right-0 top-0 w-96 h-full bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider">
                {t("Live Market Intelligence")}
              </Badge>
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                {t("Source")}: AGMARKNET (Govt. of India)
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <Store className="h-5 w-5 text-emerald-400" />
              <span>{localizeCrop(currentFarm?.crop_type)} ({currentFarm?.crop_type || 'Rice'})</span>
              <span className="text-slate-400 text-sm font-semibold">/ Maharashtra Mandis</span>
            </h3>
            <p className="text-xs text-slate-300 max-w-xl font-medium leading-relaxed">
              {marketSummary?.top_nearby_mandi ? (
                <>
                  {t("Top nearby trading mandi")}: <strong className="text-white font-bold">{marketSummary.top_nearby_mandi}</strong> ({marketSummary.top_nearby_distance_km ? `${marketSummary.top_nearby_distance_km} km` : 'Local APMC'}) • {t("Observed")}: {marketSummary.latest_observation_date || 'Today'}
                </>
              ) : (
                t("Real-time APMC agricultural mandi auction prices and proximity analytics for your active farm.")
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[180px]">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
                {t("Modal Price")}
              </span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {marketSummary?.modal_price ? `₹${marketSummary.modal_price.toLocaleString('en-IN')}` : '₹—'}
                </span>
                <span className="text-xs text-slate-300 font-semibold">/ quintal</span>
              </div>
              <div className="text-[11px] font-semibold text-emerald-400 mt-0.5">
                {marketSummary?.price_per_kg ? `≈ ₹${marketSummary.price_per_kg}/kg` : ''}
              </div>
            </div>

            <Link to="/app/market-prices">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-2xl px-5 py-6 shadow-lg flex items-center space-x-2 transition-transform hover:scale-105">
                <span>{t("View All Mandis")}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row: Distinct Microclimate & Environmental Conditions */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        
        {/* Soil Moisture Card */}
        <Card className="shadow-sm rounded-3xl border-slate-200/70 dark:border-white/10 p-8 flex flex-col justify-between bg-white dark:bg-dark-surface relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("Soil Moisture")}</span>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 text-[9px] font-bold">
                ● {t("Live Node")}
              </Badge>
            </div>
            <div className="mt-4 flex flex-col">
              <span className="text-6xl font-black text-slate-900 dark:text-white">
                {esp32.soil ? `${esp32.soil.percentage}%` : (sensor.soil_moisture !== undefined ? `${sensor.soil_moisture}%` : '48%')}
              </span>
              <div className="mt-4 flex items-center space-x-2">
                <Badge variant="outline" className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                  <TrendingUp className="h-3.5 w-3.5 text-status-success mr-1.5" /> {t("Target 45%+ ")}
                </Badge>
                {esp32.soil && (
                  <span className="text-xs text-slate-400 font-mono">ADC: {esp32.soil.rawValue}</span>
                )}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-4 border-t border-slate-100 dark:border-white/5 pt-3">
            {t("Real-time physical capacitance probe reading from ESP32 GPIO 34.")}
          </p>
        </Card>

        {/* Canopy Agro-Meteorological Weather Service */}
        <Card className="shadow-sm rounded-3xl border-slate-200/70 dark:border-white/10 p-8 bg-white dark:bg-dark-surface xl:col-span-2">
           <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("Macro Agro-Meteorology")}</span>
                  <span className="bg-blue-500/10 text-blue-600 border border-blue-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded">
                    {t("Weather API Feed")}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center">
                  {currentFarm?.name || t('Farm Field Station')}
                </h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Wind className="h-7 w-7" />
              </div>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("Wind Speed")}</span>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">14 <span className="text-sm font-normal text-slate-400">km/h</span></p>
                <p className="text-xs text-slate-500 font-medium mt-1">{t("Moderate")}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("Solar Flux")}</span>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">4,520 <span className="text-sm font-normal text-slate-400">Lux</span></p>
                <p className="text-xs text-slate-500 font-medium mt-1">{t("Optimal")}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("Pressure")}</span>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">1013 <span className="text-sm font-normal text-slate-400">hPa</span></p>
                <p className="text-xs text-slate-500 font-medium mt-1">{t("Optimal")}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("Cloud Cover")}</span>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{satellite.cloud_coverage !== undefined ? `${satellite.cloud_coverage}%` : '12%'}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">Sentinel-2 Layer</p>
              </div>
           </div>
        </Card>
      </div>

    </div>
  )
}
