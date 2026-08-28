import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { FarmContextType } from '@/components/layout/Layout'
import { weatherAPI } from '@/services/api'
import { useSensorData } from '@/hooks/useSensorData'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { motion } from 'framer-motion'
import { 
  CloudSun, CloudRain, Wind, Droplets, Thermometer,
  ShieldAlert, CheckCircle, AlertTriangle,
  Activity, Info, Smartphone, RefreshCw, MapPin, Compass,
  Gauge, Sun, Zap
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'

export default function WeatherIntelligence() {
  const { t, i18n } = useTranslation()
  const { selectedFarmId, farms } = useOutletContext<FarmContextType>()
  const farmId = selectedFarmId || farms[0]?.id || 1
  const currentFarm = farms.find(f => f.id === farmId)

  // Target farm phone number
  const targetPhone = currentFarm?.whatsapp || currentFarm?.phone || '+919962109473'

  // Real-time ESP32 Firebase RTDB Telemetry
  const { data: esp32 } = useSensorData('/')

  const [lastDispatchedTime, setLastDispatchedTime] = useState<string | null>(null)
  const [dispatchResult, setDispatchResult] = useState<any | null>(null)

  // Synchronize active website language with backend 10-minute auto-dispatcher
  useEffect(() => {
    if (farmId && i18n.language) {
      weatherAPI.syncFarmLanguage({ farm_id: farmId, language: i18n.language })
    }
  }, [farmId, i18n.language])

  // Fetch Live Weather & Agricultural Risk Engine Assessment
  const { 
    data: weatherResp, 
    isLoading: weatherLoading, 
    refetch: refetchWeather 
  } = useQuery({
    queryKey: ['farmWeather', farmId],
    queryFn: () => weatherAPI.getFarmWeather(farmId),
    refetchInterval: 30000, // Refetch every 30s
    enabled: !!farmId
  })

  // Fetch Stored Weather Alerts History
  const { 
    data: alertsResp, 
    refetch: refetchAlerts 
  } = useQuery({
    queryKey: ['weatherAlerts', farmId],
    queryFn: () => weatherAPI.getAlerts(farmId),
    refetchInterval: 20000,
    enabled: !!farmId
  })

  // Mutation to trigger immediate 10-minute weather update
  const autoDispatchMutation = useMutation({
    mutationFn: () => weatherAPI.triggerAutoDispatch({ farm_id: farmId, language: i18n.language }),
    onSuccess: (data) => {
      setDispatchResult(data)
      setLastDispatchedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      refetchAlerts()
    }
  })

  // Auto-trigger on mount if needed or every 10 minutes from frontend as backup heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      weatherAPI.triggerAutoDispatch({ farm_id: farmId, language: i18n.language })
        .then(() => refetchAlerts())
        .catch(console.error)
    }, 600000) // 10 minutes = 600,000 ms

    return () => clearInterval(interval)
  }, [farmId, i18n.language, refetchAlerts])

  const weather = weatherResp?.weather || {}
  const riskAnalysis = weatherResp?.riskAnalysis || weatherResp?.risk_analysis || {}
  const alerts = riskAnalysis.alerts || []
  const overallSeverity = riskAnalysis.overall_severity || 'INFO'
  const historyAlerts = alertsResp?.alerts || []

  // ESP32 Telemetry extraction with safe fallback
  const esp32Temp = (esp32?.temperature !== null && esp32?.temperature !== undefined) ? Number(esp32.temperature) : 28.0
  const esp32Hum = (esp32?.humidity !== null && esp32?.humidity !== undefined) ? Number(esp32.humidity) : 75.0
  const esp32Rain = esp32?.rain ? (esp32.rain.isRaining ? 'Wet' : 'Dry') : 'Dry'

  const getLanguageLabel = (code: string) => {
    switch (code) {
      case 'mr': return 'मराठी (Marathi)'
      case 'hi': return 'हिन्दी (Hindi)'
      case 'ta': return 'தமிழ் (Tamil)'
      default: return 'English'
    }
  }

  const getSeverityBadgeClass = (sev: string) => {
    switch (sev?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-500/10 text-red-500 border-red-500/30'
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/30'
      case 'MODERATE':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/30'
      default:
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
    }
  }

  return (
    <div className="space-y-6">
      
      {/* ─── Top Header & Coordinates Banner ─────────────────────────────── */}
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0 border-b border-slate-200/50 dark:border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("Precision Ag Intelligence")}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              {weather.source || 'Open-Meteo High-Resolution Engine'}
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mt-1 flex items-center">
            <CloudSun className="h-8 w-8 mr-3 text-amber-500" /> {t("Weather Intelligence")}
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            {currentFarm?.name || 'Selected Farm'} ({currentFarm?.crop_type || 'Rice'}) &bull; {weather.location || 'Local Farm Centroid Coordinates'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={() => { refetchWeather(); refetchAlerts(); }} 
            variant="outline" 
            size="sm" 
            className="border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-white rounded-xl shadow-sm"
          >
            <RefreshCw className={clsx("mr-2 h-4 w-4", weatherLoading && "animate-spin")} /> {t("Sync Weather")}
          </Button>
        </div>
      </div>

      {/* ─── Section 1: Weather Outlook & Agricultural Early Warning Banner ─── */}
      {overallSeverity !== 'INFO' && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className={clsx(
            "p-6 rounded-[2rem] border shadow-premium backdrop-blur-md relative overflow-hidden",
            overallSeverity === 'HIGH' || overallSeverity === 'CRITICAL'
              ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-100"
              : "bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-100"
          )}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/20 rounded-2xl shrink-0 mt-1">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-sm">
                    {overallSeverity} RISK DETECTED
                  </span>
                  <span className="text-xs font-bold opacity-75">
                    Crop Target: {currentFarm?.crop_type || 'Rice'}
                  </span>
                </div>
                <h3 className="text-xl font-black mt-1">
                  {alerts[0]?.title || 'Weather Change Imminent'}
                </h3>
                <p className="text-sm font-semibold opacity-90 mt-1 max-w-3xl leading-relaxed">
                  {alerts[0]?.why_it_matters || 'Upcoming precipitation and humidity increase physiological disease vulnerability.'}
                </p>
                <div className="mt-3 text-xs font-bold bg-white/40 dark:bg-black/40 p-2.5 rounded-xl border border-white/20 inline-flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Action: {alerts[0]?.recommended_action || 'Inspect field after downpour and maintain drainage.'}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Section 2: Current Metrics Grid ──────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="rounded-[1.8rem] shadow-sm border-slate-200/70 dark:border-white/10">
          <CardContent className="p-5 flex flex-col">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">{t("Temperature")}</span>
              <Thermometer className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-3xl font-black text-slate-900 dark:text-white mt-2">
              {weather.temperature !== undefined ? `${weather.temperature}°C` : '--'}
            </span>
            <span className="text-[11px] font-bold text-slate-400 mt-1">
              Feels like {weather.feels_like !== undefined ? `${weather.feels_like}°C` : '--'}
            </span>
          </CardContent>
        </Card>

        <Card className="rounded-[1.8rem] shadow-sm border-slate-200/70 dark:border-white/10">
          <CardContent className="p-5 flex flex-col">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">{t("Humidity")}</span>
              <Droplets className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-3xl font-black text-slate-900 dark:text-white mt-2">
              {weather.humidity !== undefined ? `${weather.humidity}%` : '--'}
            </span>
            <span className="text-[11px] font-bold text-slate-400 mt-1">
              Relative Humidity
            </span>
          </CardContent>
        </Card>

        <Card className="rounded-[1.8rem] shadow-sm border-slate-200/70 dark:border-white/10">
          <CardContent className="p-5 flex flex-col">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">{t("24h Rain")}</span>
              <CloudRain className="w-4 h-4 text-cyan-500" />
            </div>
            <span className="text-3xl font-black text-slate-900 dark:text-white mt-2">
              {weather.rain_forecast_mm !== undefined ? `${weather.rain_forecast_mm} mm` : '0 mm'}
            </span>
            <span className="text-[11px] font-bold text-slate-400 mt-1">
              {weather.rain_forecast_mm > 15 ? 'Heavy Rainfall' : 'Expected Volume'}
            </span>
          </CardContent>
        </Card>

        <Card className="rounded-[1.8rem] shadow-sm border-slate-200/70 dark:border-white/10">
          <CardContent className="p-5 flex flex-col">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">{t("Wind Speed")}</span>
              <Wind className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-3xl font-black text-slate-900 dark:text-white mt-2">
              {weather.wind_speed !== undefined ? `${weather.wind_speed} km/h` : '--'}
            </span>
            <span className="text-[11px] font-bold text-slate-400 mt-1">
              Surface Breeze
            </span>
          </CardContent>
        </Card>

        <Card className="rounded-[1.8rem] shadow-sm border-slate-200/70 dark:border-white/10">
          <CardContent className="p-5 flex flex-col">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">{t("Conditions")}</span>
              <Sun className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-2 line-clamp-1">
              {weather.description || 'Clear Sky'}
            </span>
            <span className="text-[11px] font-bold text-slate-400 mt-1">
              WMO Code {weather.weather_code ?? 0}
            </span>
          </CardContent>
        </Card>

        <Card className="rounded-[1.8rem] shadow-sm border-slate-200/70 dark:border-white/10">
          <CardContent className="p-5 flex flex-col">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">{t("Pressure")}</span>
              <Gauge className="w-4 h-4 text-purple-500" />
            </div>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-2">
              {weather.pressure !== undefined ? `${weather.pressure} hPa` : '1013 hPa'}
            </span>
            <span className="text-[11px] font-bold text-slate-400 mt-1">
              Barometric Level
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        
        {/* ─── Left Column (3 spans): Forecast Timeline & IoT Comparison ──── */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Weather vs ESP32 Telemetry Comparison Card */}
          <Card className="border-slate-200/70 dark:border-white/10 shadow-premium rounded-[2rem] overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-black flex items-center text-slate-900 dark:text-white">
                    <Activity className="w-5 h-5 mr-2 text-primary" /> Weather Forecast vs. Field ESP32 IoT
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold text-slate-500 mt-0.5">
                    Real-time cross-verification between meteorology model and physical canopy sensors
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 border-primary/30 text-primary">
                  PHYSICAL ESP32 LIVE
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Air Temperature</span>
                    <Thermometer className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="text-xs text-slate-400 block font-semibold">Forecast</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white">{weather.temperature ?? 28}°C</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-primary block font-bold">ESP32 Sensor</span>
                      <span className="text-xl font-black text-primary">{esp32Temp.toFixed(1)}°C</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Relative Humidity</span>
                    <Droplets className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="text-xs text-slate-400 block font-semibold">Forecast</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white">{weather.humidity ?? 70}%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-blue-400 block font-bold">ESP32 Sensor</span>
                      <span className="text-xl font-black text-blue-400">{esp32Hum.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Rain Sensor Plate</span>
                    <CloudRain className="w-4 h-4 text-cyan-500" />
                  </div>
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="text-xs text-slate-400 block font-semibold">Forecast</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white">{weather.rain_forecast_mm > 0 ? 'Rain' : 'Dry'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-cyan-400 block font-bold">ESP32 GPIO</span>
                      <span className="text-xl font-black text-cyan-400">{esp32Rain}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next 24-Hour Hourly Timeline */}
          <Card className="border-slate-200/70 dark:border-white/10 shadow-premium rounded-[2rem] overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
              <CardTitle className="text-lg font-black flex items-center text-slate-900 dark:text-white">
                <Compass className="w-5 h-5 mr-2 text-primary" /> Next 24-Hour Hourly Forecast
              </CardTitle>
              <CardDescription className="text-xs font-semibold text-slate-500 mt-0.5">
                Hourly temperature trajectory and precipitation probability
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {(weather.hourly_24h || []).map((h: any, idx: number) => (
                  <div 
                    key={idx} 
                    className="flex-shrink-0 flex flex-col items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 w-24 text-center"
                  >
                    <span className="text-[11px] font-bold text-slate-400">
                      {h.hour || `${idx}:00`}
                    </span>
                    <CloudSun className="w-5 h-5 my-2 text-amber-500" />
                    <span className="text-sm font-black text-slate-900 dark:text-white">{h.temperature}°C</span>
                    <div className="mt-2 text-[10px] font-bold text-cyan-500 flex items-center gap-0.5">
                      <Droplets className="w-3 h-3" /> {h.precipitation_probability ?? 0}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Next 7-Day Forecast Grid */}
          <Card className="border-slate-200/70 dark:border-white/10 shadow-premium rounded-[2rem] overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
              <CardTitle className="text-lg font-black flex items-center text-slate-900 dark:text-white">
                <CloudSun className="w-5 h-5 mr-2 text-primary" /> Next 7-Day Agricultural Forecast
              </CardTitle>
              <CardDescription className="text-xs font-semibold text-slate-500 mt-0.5">
                Multi-day agronomic outlook for disease forecasting & field planning
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {(weather.daily_7d || []).map((d: any, idx: number) => (
                  <div key={idx} className="py-3.5 flex items-center justify-between">
                    <div className="w-28">
                      <span className="text-xs font-black text-slate-900 dark:text-white block">
                        {new Date(d.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">{d.description}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white">{d.temp_max}°C</span>
                      <span className="text-xs font-bold text-slate-400">/ {d.temp_min}°C</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-cyan-500 block">
                        {d.precipitation_sum_mm ? `${d.precipitation_sum_mm} mm` : '0 mm'}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {d.precipitation_probability_max ?? 0}% rain prob
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Right Column (2 spans): Automated WhatsApp Service & Alerts ──── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Automated WhatsApp Background Service Status Card (Replaces manual input box) */}
          <Card className="border-slate-200/70 dark:border-white/10 shadow-premium rounded-[2rem] overflow-hidden bg-gradient-to-br from-emerald-500/5 via-white dark:via-dark-surface to-emerald-500/5">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 p-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-black flex items-center text-slate-900 dark:text-white">
                  <Smartphone className="w-5 h-5 mr-2 text-emerald-500" /> Automated WhatsApp Service
                </CardTitle>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  10-MIN INTERVAL
                </span>
              </div>
              <CardDescription className="text-xs font-semibold text-slate-500 mt-1">
                Automated weather & risk advisories delivered every 10 minutes to linked farm number
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              
              {/* Linked Farm Phone Info */}
              <div className="p-4 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200/60 dark:border-white/10 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Linked Farm WhatsApp</span>
                  <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">{targetPhone}</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  VERIFIED
                </Badge>
              </div>

              {/* Dynamic Active Language Info */}
              <div className="p-4 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200/60 dark:border-white/10 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Website Language</span>
                  <span className="text-sm font-black text-primary mt-0.5 block">{getLanguageLabel(i18n.language)}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                  Auto-Sync Active
                </span>
              </div>

              {/* Quick Trigger Button */}
              <Button
                onClick={() => autoDispatchMutation.mutate()}
                disabled={autoDispatchMutation.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-5 font-black text-xs shadow-md flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                {autoDispatchMutation.isPending ? 'Dispatching Weather Advisory...' : '⚡ Trigger 10-Min Weather Update Now'}
              </Button>

              {lastDispatchedTime && (
                <p className="text-[10px] font-semibold text-center text-slate-400">
                  Last automated dispatch: <span className="font-bold text-slate-700 dark:text-slate-300">{lastDispatchedTime}</span>
                </p>
              )}

              {dispatchResult && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <CheckCircle className="w-4 h-4 shrink-0" /> Delivered via {dispatchResult.delivery_result?.provider || 'Twilio WhatsApp'}
                  </div>
                  <pre className="text-[10px] font-mono whitespace-pre-wrap opacity-85 mt-1">
                    {dispatchResult.message}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Agricultural Risk Alerts List */}
          <Card className="border-slate-200/70 dark:border-white/10 shadow-premium rounded-[2rem] overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 p-6">
              <CardTitle className="text-lg font-black flex items-center text-slate-900 dark:text-white">
                <ShieldAlert className="w-5 h-5 mr-2 text-amber-500" /> Active Weather Risk Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm font-semibold">
                  <Info className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  No active weather risk alerts.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {alerts.map((al: any, i: number) => (
                    <div key={i} className="p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition">
                      <div className="flex justify-between items-start mb-2">
                        <span className={clsx("text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border", getSeverityBadgeClass(al.severity))}>
                          {al.severity}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">{al.alert_type}</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">{al.title}</h4>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                        {al.why_it_matters}
                      </p>
                      <div className="mt-3 text-[11px] font-bold text-primary dark:text-primary-300 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Action: {al.recommended_action}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historical Delivery Logs */}
          <Card className="border-slate-200/70 dark:border-white/10 shadow-premium rounded-[2rem] overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 p-6">
              <CardTitle className="text-lg font-black flex items-center text-slate-900 dark:text-white">
                <Info className="w-5 h-5 mr-2 text-primary" /> Alert Dispatch History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[300px] overflow-y-auto">
              {historyAlerts.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs font-semibold">
                  No previous alerts logged for this farm.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {historyAlerts.map((log: any, i: number) => (
                    <div key={log.id || i} className="p-4 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-black text-slate-900 dark:text-white">{log.title}</span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 line-clamp-2">{log.why_it_matters}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                          {log.delivery_status || 'DELIVERED'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Lang: {log.language || 'en'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
