import React from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FarmContextType } from '@/components/layout/Layout'
import { dashboardAPI, sensorAPI, satelliteAPI } from '@/services/api'
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
  CartesianGrid
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
  Zap
} from 'lucide-react'
import { FarmMap } from '@/components/ui/FarmMap'
import { getHealthStatus } from '@/utils/health'
import { useTranslation } from 'react-i18next'

export default function Dashboard() {
  const { t } = useTranslation()
  const { selectedFarmId, farms } = useOutletContext<FarmContextType>()
  const farmId = selectedFarmId || farms[0]?.id || 1
  const [isSyncing, setIsSyncing] = React.useState(false)

  const handleSync = async () => {
    try {
      setIsSyncing(true)
      console.log("[Sync] Request sent to trigger Sentinel Hub analysis...")
      const res = await satelliteAPI.trigger(farmId)
      console.log("[Sync] Sentinel response received:", res)
      await refetchDash()
      console.log("[Sync] Dashboard state updated.")
    } catch (err: any) {
      console.error("[Sync] Error during sync:", err)
      const errorMsg = err.response?.data?.error || "Failed to synchronize with Sentinel Hub. Retaining previous data."
      alert(`Sync Failed: ${errorMsg}`)
    } finally {
      setIsSyncing(false)
    }
  }

  // Fetch unified dashboard data
  const { 
    data: dashData, 
    isLoading: dashLoading, 
    refetch: refetchDash 
  } = useQuery({
    queryKey: ['dashboard', farmId],
    queryFn: () => dashboardAPI.get(farmId),
    enabled: !!farmId
  })

  // Fetch historical sensor data for the chart
  const { 
    data: sensorHistory = [], 
    isLoading: historyLoading 
  } = useQuery({
    queryKey: ['sensorHistory', farmId],
    queryFn: () => sensorAPI.getHistory(farmId),
    enabled: !!farmId
  })

  const currentFarm = farms.find(f => f.id === farmId)

  // Map sensor history for charts
  const chartData = React.useMemo(() => {
    return sensorHistory.map(h => {
      const date = new Date(h.timestamp || '')
      return {
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        moisture: h.soil_moisture,
        temp: h.temperature
      }
    })
  }, [sensorHistory])

  // Custom tooltips
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-surface p-4 shadow-xl text-xs space-y-2">
          <p className="font-bold text-slate-800 dark:text-slate-200">{payload[0].payload.date} <span className="text-slate-400">({payload[0].payload.time})</span></p>
          <div className="flex items-center space-x-2 text-accent dark:text-accent-300">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="font-semibold">Moisture: {payload[0].value}%</span>
          </div>
          <div className="flex items-center space-x-2 text-highlight dark:text-highlight-300">
            <span className="h-2 w-2 rounded-full bg-highlight" />
            <span className="font-semibold">Temperature: {payload[1].value}°C</span>
          </div>
        </div>
      )
    }
    return null
  }

  // Loading skeleton layout
  if (dashLoading || historyLoading || !dashData) {
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

  const sensor = dashData?.sensor || {}
  const weather = dashData?.weather || {}
  const satellite = dashData?.satellite || {}
  const recommendation = dashData?.recommendation || {}
  const stats = dashData?.stats || { alerts: 0, diseases_detected: 0, total_farms: 0, last_analysis: null }


  const healthScore = recommendation.health_score || currentFarm?.health_score || 0

  return (
    <div className="space-y-8 pb-12">
      {/* Enterprise Header */}
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center">
            {currentFarm?.name} <span className="ml-3 text-2xl font-semibold text-slate-400">/ {t("Command Center")}</span>
          </h1>
          <div className="flex items-center space-x-4 mt-2">
            <Badge variant="outline" className="border-slate-300 dark:border-white/20 text-slate-600 dark:text-slate-300 rounded-lg">
              {t("Crop")}: {currentFarm?.crop_type}
            </Badge>
            <Badge variant="outline" className="border-slate-300 dark:border-white/20 text-slate-600 dark:text-slate-300 rounded-lg">
              {t("Area")}: {currentFarm?.area_ha} ha
            </Badge>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
              <Zap className="h-3 w-3 mr-1 text-accent" />
              {t("Live Telemetry")}: {sensor.timestamp ? new Date(sensor.timestamp).toLocaleTimeString() : t('offline')}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={handleSync} className="bg-primary hover:bg-primary-600 text-white shadow-premium rounded-xl px-6 py-5" disabled={isSyncing}>
            {isSyncing ? t("Syncing...") : t("Sync Satellite & IoT")}
          </Button>
        </div>
      </div>
      
      {/* Top Asymmetric Layout: GIS Map (Left 2/3) + Hero Stats (Right 1/3) */}
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
            {/* Ambient Background Glow */}
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

      {/* Middle Grid: Telemetry & Recommendations */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Soil Telemetry Line Chart */}
        <Card className="lg:col-span-2 shadow-sm rounded-3xl border-slate-200/70 dark:border-white/10">
          <CardHeader className="pb-2 px-8 pt-8">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-black">{t("IoT Subsurface Telemetry")}</CardTitle>
                <CardDescription className="mt-1 font-medium">{t("Real-time moisture and temperature gradients at root zone.")}</CardDescription>
              </div>
              <Badge variant="outline" className="border-accent/30 text-accent bg-accent/5 rounded-lg px-3 py-1 font-bold">Live Stream</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-80 px-4 pb-8 pt-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2388FF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2388FF" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C48A2A" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#C48A2A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.1)" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="moisture" stroke="#2388FF" strokeWidth={3} fillOpacity={1} fill="url(#colorMoisture)" />
                  <Area type="monotone" dataKey="temp" stroke="#C48A2A" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col h-full w-full items-center justify-center text-center p-6 space-y-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 mx-4 mt-2">
                <Activity className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{t("No telemetry logs registered.")}</h4>
                <Button variant="outline" size="sm" className="font-bold border-slate-200 dark:border-white/10 rounded-xl">
                  Connect IoT Node
                </Button>
              </div>
            )}
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
                {recommendation.severity === 'None' ? t('Healthy') : `${recommendation.severity} ${t('Risk')}`}
              </Badge>
            </div>
          </div>
          <CardContent className="p-8 flex flex-col flex-1 bg-white dark:bg-dark-surface space-y-6">
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">{recommendation.problem || t('No immediate threats detected.')}</h4>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{recommendation.reason || t('System analysis indicates optimal growth conditions across all parameters.')}</p>
            </div>
            
            <div className="mt-auto pt-6 border-t border-slate-100 dark:border-white/10">
              <span className="text-[10px] font-bold text-primary dark:text-primary-400 uppercase tracking-widest block mb-3">{t("Executive Action")}</span>
              <div className="bg-slate-50 dark:bg-dark-elevated rounded-2xl p-5 border border-slate-200/60 dark:border-white/5 shadow-inner">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                  {recommendation.action || t('Maintain current agronomic schedule.')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Detailed Metrics */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Current Sensor Snapshot */}
        <Card className="shadow-sm rounded-3xl border-slate-200/70 dark:border-white/10 p-8 flex flex-col justify-center bg-white dark:bg-dark-surface relative overflow-hidden">
          <div className="absolute right-0 top-0 p-8 opacity-5">
            <Droplets className="h-32 w-32" />
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("Soil Moisture")}</span>
          <div className="mt-4 flex flex-col">
            <span className="text-6xl font-black text-slate-900 dark:text-white">{sensor.soil_moisture !== undefined ? `${sensor.soil_moisture}%` : 'N/A'}</span>
            <div className="mt-4 flex items-center space-x-2">
              <Badge variant="outline" className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                <TrendingUp className="h-3.5 w-3.5 text-status-success mr-1.5" /> {t("Target 45%+ ")}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Live Weather Overview */}
        <Card className="shadow-sm rounded-3xl border-slate-200/70 dark:border-white/10 p-8 bg-white dark:bg-dark-surface xl:col-span-2">
           <div className="flex justify-between items-start mb-8">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("Canopy Weather")}</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center">
                  {weather.location || t('Unknown Station')}
                </h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-highlight/10 text-highlight dark:text-highlight-300">
                <Thermometer className="h-7 w-7" />
              </div>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("Temperature")}</span>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{weather.temperature !== undefined ? `${weather.temperature}°C` : 'N/A'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{t("Feels like")} {weather.feels_like}°C</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("Humidity")}</span>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{weather.humidity !== undefined ? `${weather.humidity}%` : 'N/A'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("Wind Speed")}</span>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{weather.wind_speed !== undefined ? `${weather.wind_speed}` : 'N/A'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">km/h</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("Rain Forecast")}</span>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{weather.rain_forecast_mm !== undefined ? `${weather.rain_forecast_mm}` : 'N/A'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">mm (24h)</p>
              </div>
           </div>
        </Card>
      </div>

    </div>
  )
}
