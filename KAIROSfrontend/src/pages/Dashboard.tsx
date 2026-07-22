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
  CartesianGrid,
  PieChart, 
  Pie, 
  Cell
} from 'recharts'
import { 
  Thermometer, 
  Droplets, 
  CloudRain, 
  Brain, 
  Satellite, 
  AlertTriangle, 
  Activity,
  TrendingUp,
  Calendar as CalendarIcon,
  Cloud as CloudIcon
} from 'lucide-react'
import { FarmMap } from '@/components/ui/FarmMap'
import { getHealthStatus } from '@/utils/health'

export default function Dashboard() {
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
        <div className="rounded-lg border border-[#DCE3D6] bg-white p-3 shadow-md text-xs space-y-1.5">
          <p className="font-semibold text-slate-800">{payload[0].payload.date} ({payload[0].payload.time})</p>
          <div className="flex items-center space-x-2 text-[#2E7D32]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D32]" />
            <span>Soil Moisture: {payload[0].value}%</span>
          </div>
          <div className="flex items-center space-x-2 text-[#FFB300]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FFB300]" />
            <span>Temperature: {payload[1].value}°C</span>
          </div>
        </div>
      )
    }
    return null
  }

  // Loading skeleton layout
  if (dashLoading || historyLoading || !dashData) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  const sensor = dashData?.sensor || {}
  const weather = dashData?.weather || {}
  const satellite = dashData?.satellite || {}
  const recommendation = dashData?.recommendation || {}
  const stats = dashData?.stats || { alerts: 0, diseases_detected: 0, total_farms: 0, last_analysis: null }

  // NDVI Pie chart data
  const ndviPieData = [
    { name: 'Healthy', value: satellite.healthy_pct || 0, color: '#2E7D32' },
    { name: 'Moderate', value: satellite.moderate_pct || 0, color: '#FFB300' },
    { name: 'Stress', value: satellite.stress_pct || 0, color: '#ef4444' }
  ]

  const healthScore = recommendation.health_score || currentFarm?.health_score || 0

  return (
    <div className="space-y-6">
      {/* Dashboard Page Header */}
      <div className="flex flex-col justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {currentFarm?.name} Analytics
          </h1>
          <p className="text-xs text-slate-500">
            Registered crop: <strong className="text-slate-800">{currentFarm?.crop_type}</strong> • Area: {currentFarm?.area_ha} ha
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Last Telemetry check: {sensor.timestamp ? new Date(sensor.timestamp).toLocaleTimeString() : 'offline'}
          </span>
          <Button onClick={handleSync} variant="outline" size="sm" disabled={isSyncing}>
            {isSyncing ? "Syncing..." : "Sync Assets"}
          </Button>
        </div>
      </div>
      
      {/* Farm Map Overview */}
      <Card className="overflow-hidden border-[#DCE3D6]">
        <div className="grid md:grid-cols-3">
          <div className="md:col-span-2 p-0 bg-slate-100">
             <FarmMap mode="view" polygon={currentFarm?.polygon as string | undefined} ndviColor={
                (satellite.ndvi_mean || 0) >= 0.8 ? '#1B5E20' : 
                (satellite.ndvi_mean || 0) >= 0.6 ? '#2E7D32' : 
                (satellite.ndvi_mean || 0) >= 0.4 ? '#FBC02D' : 
                (satellite.ndvi_mean || 0) >= 0.2 ? '#F57C00' : '#d32f2f'
             } height="300px" />
          </div>
          <div className="p-6 flex flex-col justify-center space-y-4 bg-white border-l border-[#DCE3D6]/50">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center">
                <Satellite className="h-4 w-4 mr-2 text-slate-500" /> Sentinel-2 Analysis
              </h3>
              <p className="text-xs text-slate-500 mt-1">Latest cloud-free statistical extraction</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mean NDVI</span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">{satellite.ndvi_mean !== undefined ? satellite.ndvi_mean : 'N/A'}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Health</span>
                <div className="mt-1">
                  <Badge style={{
                    backgroundColor: getHealthStatus(satellite.ndvi_mean).bg,
                    color: 'white'
                  }}>
                    {getHealthStatus(satellite.ndvi_mean).text}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="pt-3 border-t border-[#EDF1EA]/70 flex justify-between items-center text-xs text-slate-600">
               <div className="flex items-center"><CalendarIcon className="h-3.5 w-3.5 mr-1 text-slate-400"/> {satellite.timestamp ? new Date(satellite.timestamp).toLocaleDateString() : 'N/A'}</div>
               <div className="flex items-center"><CloudIcon className="h-3.5 w-3.5 mr-1 text-slate-400"/> {satellite.cloud_coverage !== undefined ? `${satellite.cloud_coverage}%` : 'N/A'} Clouds</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Farm Health Index */}
        <Card className="hover:border-[#DCE3D6] transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Farm Health Score</span>
              <Activity className={`h-4 w-4 ${healthScore >= 75 ? 'text-green-600' : healthScore >= 60 ? 'text-amber-500' : 'text-red-500'}`} />
            </div>
            <div className="mt-2.5 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{healthScore}%</span>
              <Badge variant={healthScore >= 75 ? 'success' : healthScore >= 60 ? 'warning' : 'destructive'}>
                {healthScore >= 75 ? 'Optimal' : healthScore >= 60 ? 'Unstable' : 'Critical'}
              </Badge>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-400">Composite index of sat + IoT feeds</p>
          </CardContent>
        </Card>

        {/* IoT Moisture */}
        <Card className="hover:border-[#DCE3D6] transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Soil Moisture</span>
              <Droplets className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2.5 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{sensor.soil_moisture !== undefined ? `${sensor.soil_moisture}%` : 'N/A'}</span>
              <span className="text-[10px] text-slate-500 flex items-center">
                <TrendingUp className="h-3 w-3 text-green-500 mr-0.5" /> Target 45%+
              </span>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-400">IoT sensor reading at 15cm depth</p>
          </CardContent>
        </Card>



        {/* Active Alerts */}
        <Card className="hover:border-[#DCE3D6] transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Critical Warnings</span>
              <AlertTriangle className={`h-4 w-4 ${stats.alerts > 0 ? 'text-red-500 animate-bounce' : 'text-slate-400'}`} />
            </div>
            <div className="mt-2.5 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{stats.alerts}</span>
              <Badge variant={stats.alerts > 0 ? 'destructive' : 'secondary'}>
                {stats.alerts > 0 ? 'Needs Attention' : 'Cleared'}
              </Badge>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-400">Active recommendations matching issues</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts & Side Widgets Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Soil moisture chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Soil Moisture & Temperature Index</CardTitle>
            <CardDescription>Visualizing continuous real-time readings from telemetry sensor nodes.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFB300" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#FFB300" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDF1EA" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="moisture" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorMoisture)" />
                  <Area type="monotone" dataKey="temp" stroke="#FFB300" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                No telemetry logs registered for this parcel.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Weather Widget */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle>Canopy Weather</CardTitle>
            <CardDescription>Live station metrics & forecast.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex-1 flex flex-col justify-center">
            {weather.temperature !== undefined ? (
              <>
                {/* Header Temp */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[#FFB300]">
                      <Thermometer className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{weather.temperature}°C</h3>
                      <p className="text-[10px] text-slate-500">Feels like {weather.feels_like}°C • {weather.description}</p>
                    </div>
                  </div>
                </div>

                {/* Weather items */}
                <div className="grid grid-cols-4 gap-2 border-t border-b border-[#EDF1EA]/70 py-4">
                  <div className="text-center">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Humidity</span>
                    <p className="mt-1 text-xs font-bold text-slate-800">{weather.humidity}%</p>
                  </div>
                  <div className="text-center border-l border-[#EDF1EA]/70">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Wind</span>
                    <p className="mt-1 text-xs font-bold text-slate-800">{weather.wind_speed} km/h</p>
                  </div>
                  <div className="text-center border-l border-[#EDF1EA]/70">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Pressure</span>
                    <p className="mt-1 text-xs font-bold text-slate-800">{weather.pressure}</p>
                  </div>
                  <div className="text-center border-l border-[#EDF1EA]/70">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Rain</span>
                    <p className="mt-1 text-xs font-bold text-slate-800">{weather.rain_forecast_mm} mm</p>
                  </div>
                </div>

                {/* Bottom Info Location */}
                <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                  <CloudRain className="h-4.5 w-4.5 text-blue-500" />
                  <span>Station: {weather.location}</span>
                </div>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-slate-400 text-center">
                Weather service not configured.<br />Please provide a valid API key.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations & Satellite NDVI break downs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* AI Recommendations panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Agronomic Recommendations</CardTitle>
                <CardDescription>Cross-verified guidelines from AI models & IoT telemetry feeds.</CardDescription>
              </div>
              <Badge variant={recommendation.severity === 'High' ? 'destructive' : recommendation.severity === 'Moderate' ? 'warning' : 'success'}>
                {recommendation.severity === 'None' ? 'Healthy' : `${recommendation.severity} Threat`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-[#EDF1EA]/30 p-4 border border-[#DCE3D6]/50">
              <div className="flex items-start space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-[#2E7D32] border border-[#DCE3D6] shrink-0 mt-0.5">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{recommendation.problem}</h4>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{recommendation.reason}</p>
                </div>
              </div>
            </div>

            {/* Suggested actions list */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Suggested Action Item</span>
              <p className="mt-1.5 text-xs text-slate-700 bg-white border border-[#DCE3D6]/70 p-3 rounded-lg leading-relaxed shadow-sm">
                {recommendation.action}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* NDVI Zone analysis circular stats */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>NDVI Vegetation Zones</CardTitle>
            <CardDescription>Crop leaf growth zones based on Sentinel-2 bands.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center flex-1 pb-6 space-y-4">
            {/* Pie Chart container */}
            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ndviPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {ndviPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Mean NDVI</span>
                <p className="text-xl font-extrabold text-slate-900">{satellite.ndvi_mean}</p>
              </div>
            </div>

            {/* Labels legends */}
            <div className="w-full grid grid-cols-3 gap-2 text-center text-xs border-t border-[#EDF1EA]/70 pt-4">
              <div>
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#2E7D32] mr-1.5" />
                <span className="text-slate-500 text-[10px]">Healthy</span>
                <p className="font-bold text-slate-900 mt-0.5">{satellite.healthy_pct}%</p>
              </div>
              <div className="border-l border-r border-[#EDF1EA]/70">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#FFB300] mr-1.5" />
                <span className="text-slate-500 text-[10px]">Moderate</span>
                <p className="font-bold text-slate-900 mt-0.5">{satellite.moderate_pct}%</p>
              </div>
              <div>
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#ef4444] mr-1.5" />
                <span className="text-slate-500 text-[10px]">Stress</span>
                <p className="font-bold text-slate-900 mt-0.5">{satellite.stress_pct}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
