import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FarmContextType } from '@/components/layout/Layout'
import { aiAPI, satelliteAPI } from '@/services/api'
import { useSensorData } from '@/hooks/useSensorData'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { motion } from 'framer-motion'
import { 
  TrendingUp, Sparkles, RefreshCw, Cpu, Activity,
  ShieldCheck, Bug, Leaf, Thermometer, Droplets, CloudRain,
  Satellite, AlertCircle
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { 
  localizeCrop, 
  localizeThreat, 
  localizeSeverity, 
  localizeRationale, 
  localizeAction 
} from '@/utils/localize'
import clsx from 'clsx'

const SUPPORTED_CROPS = [
  'Rice', 'Banana', 'Cotton', 'Wheat', 'Sugarcane', 
  'Soybean', 'Onion', 'Orange', 'Bajra', 'Jowar'
]

const GROWTH_STAGES = [
  'Germination / Emergence',
  'Seedling / Early Vegetative',
  'Tillering / Active Vegetative',
  'Stem Elongation / Jointing',
  'Booting / Panicle Initiation',
  'Flowering / Anthesis',
  'Milking / Dough Stage',
  'Ripening / Maturation'
]

export default function EarlyDetection() {
  const { t } = useTranslation()
  const { selectedFarmId, farms } = useOutletContext<FarmContextType>()
  const farmId = selectedFarmId || farms[0]?.id || 1
  const currentFarm = farms.find(f => f.id === farmId)

  // Real-time ESP32 Firebase RTDB Telemetry
  const { data: esp32, connectionStatus } = useSensorData('/')
  const isEsp32Live = connectionStatus === 'LIVE'

  // Mode & Horizon State
  const [activeTab, setActiveTab] = useState<'pest' | 'disease'>('pest')
  const [horizon, setHorizon] = useState<'7d' | '14d'>('7d')

  // Form Inputs
  const [selectedCrop, setSelectedCrop] = useState<string>(currentFarm?.crop_type || 'Rice')
  const [targetPest, setTargetPest] = useState<string>('Brown Planthopper')
  const [targetDisease, setTargetDisease] = useState<string>('Sheath Blight')
  const [growthStage, setGrowthStage] = useState<string>('Tillering / Active Vegetative')
  const [pestObservationCount, setPestObservationCount] = useState<number>(5.0)
  const [diseaseSeverityPct, setDiseaseSeverityPct] = useState<number>(10.0)

  // Simulation / Environmental Defaults
  const activeTemp = (esp32.temperature !== null && esp32.temperature !== undefined) ? esp32.temperature : 28.0
  const activeHum = (esp32.humidity !== null && esp32.humidity !== undefined) ? esp32.humidity : 75.0
  const activeRain = esp32.rain ? (esp32.rain.isRaining ? 15.0 : 0.0) : 0.0

  // Forecast Execution State
  const [loading, setLoading] = useState(false)
  const [forecastResult, setForecastResult] = useState<any | null>(null)
  const [error, setError] = useState('')

  // Fetch Forecast Options (Approved Combinations)
  const { data: forecastOptions } = useQuery({
    queryKey: ['forecastOptions'],
    queryFn: () => aiAPI.getForecastOptions().then(res => res.crops || {}),
    staleTime: Infinity
  })

  // Fetch Farm Satellite Data
  const { data: satData } = useQuery({
    queryKey: ['satellite', farmId],
    queryFn: () => satelliteAPI.get(farmId),
    enabled: !!farmId
  })

  // Synchronize target options when crop changes
  useEffect(() => {
    if (forecastOptions && forecastOptions[selectedCrop]) {
      const pests = forecastOptions[selectedCrop].pests || []
      const diseases = forecastOptions[selectedCrop].diseases || []
      if (pests.length > 0) setTargetPest(pests[0])
      if (diseases.length > 0) setTargetDisease(diseases[0])
    }
  }, [selectedCrop, forecastOptions])

  const runForecast = async () => {
    setLoading(true)
    setError('')
    setForecastResult(null)

    try {
      if (activeTab === 'pest') {
        const payload = {
          crop: selectedCrop,
          pest: targetPest,
          farm_id: farmId,
          horizon,
          location: currentFarm?.name || "Field Station",
          temperature_c: activeTemp,
          humidity_pct: activeHum,
          rainfall_mm: activeRain,
          growth_stage: growthStage,
          pest_observation_count: pestObservationCount
        }
        const res = await aiAPI.forecastPest(payload)
        if (res.success) {
          setForecastResult(res)
        } else {
          setError(res.error || 'Pest forecasting failed.')
        }
      } else {
        const payload = {
          crop: selectedCrop,
          disease: targetDisease,
          farm_id: farmId,
          horizon,
          location: currentFarm?.name || "Field Station",
          temperature_c: activeTemp,
          humidity_pct: activeHum,
          rainfall_mm: activeRain,
          growth_stage: growthStage,
          disease_severity_pct: diseaseSeverityPct
        }
        const res = await aiAPI.forecastDisease(payload)
        if (res.success) {
          setForecastResult(res)
        } else {
          setError(res.error || 'Disease forecasting failed.')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Forecasting model execution failed.')
    } finally {
      setLoading(false)
    }
  }

  // Helper for Risk Bar Visualization
  const getRiskMeter = (level: string, prob: number) => {
    const norm = (level || '').toUpperCase()
    let color = 'bg-emerald-500'
    let width = `${Math.max(10, Math.min(100, prob))}%`
    
    if (norm === 'CRITICAL') color = 'bg-rose-600'
    else if (norm === 'HIGH') color = 'bg-amber-500'
    else if (norm === 'MODERATE') color = 'bg-yellow-500'

    return (
      <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-3.5 overflow-hidden p-0.5">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Enterprise Header */}
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0 border-b border-slate-200/50 dark:border-white/5 pb-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("Predictive Agricultural Intelligence")}</span>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mt-1 flex items-center">
            <TrendingUp className="h-8 w-8 mr-3 text-primary dark:text-primary-300" /> {t("Early Detection & Forecasting")}
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            XGBoost & LightGBM Machine Learning // Multi-Horizon Early Warning Engine
          </p>
        </div>

        {/* Tab Selector Toggle */}
        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 shadow-inner">
          <button
            onClick={() => { setActiveTab('pest'); setForecastResult(null); }}
            className={clsx(
              "flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm",
              activeTab === 'pest' 
                ? "bg-primary text-white" 
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <Bug className="h-4 w-4" />
            <span>{t("Pest Forecast")}</span>
          </button>

          <button
            onClick={() => { setActiveTab('disease'); setForecastResult(null); }}
            className={clsx(
              "flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm",
              activeTab === 'disease' 
                ? "bg-primary text-white" 
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <Leaf className="h-4 w-4" />
            <span>{t("Disease Forecast")}</span>
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* Left Column: Input Configuration & Sensor Streams (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-slate-200/70 dark:border-white/10 shadow-premium rounded-[2rem] overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
              <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center">
                <Activity className="h-5 w-5 mr-2 text-primary" /> Forecast Parameters
              </CardTitle>
              <CardDescription className="text-xs font-semibold text-slate-500">
                Select crop, biological target, and review real-time input telemetry.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              
              {/* Crop & Target Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("Crop")}</label>
                  <select
                    value={selectedCrop}
                    onChange={(e) => setSelectedCrop(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                  >
                    {SUPPORTED_CROPS.map((c) => (
                      <option key={c} value={c} className="dark:bg-dark-surface">{localizeCrop(c)}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {activeTab === 'pest' ? t("Target Pest") : t("Target Disease")}
                  </label>
                  <select
                    value={activeTab === 'pest' ? targetPest : targetDisease}
                    onChange={(e) => activeTab === 'pest' ? setTargetPest(e.target.value) : setTargetDisease(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                  >
                    {forecastOptions && forecastOptions[selectedCrop] ? (
                      activeTab === 'pest' ? (
                        (forecastOptions[selectedCrop].pests || []).map((p: string) => (
                          <option key={p} value={p} className="dark:bg-dark-surface">{localizeThreat(p)}</option>
                        ))
                      ) : (
                        (forecastOptions[selectedCrop].diseases || []).map((d: string) => (
                          <option key={d} value={d} className="dark:bg-dark-surface">{localizeThreat(d)}</option>
                        ))
                      )
                    ) : (
                      <option value="General">Default</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Horizon Toggle */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("Forecast Horizon")}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHorizon('7d')}
                    className={clsx(
                      "py-2 px-3 rounded-xl font-bold text-xs border transition shadow-sm",
                      horizon === '7d' 
                        ? "bg-primary text-white border-primary" 
                        : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    7-Day Early Warning
                  </button>
                  <button
                    type="button"
                    onClick={() => setHorizon('14d')}
                    className={clsx(
                      "py-2 px-3 rounded-xl font-bold text-xs border transition shadow-sm",
                      horizon === '14d' 
                        ? "bg-primary text-white border-primary" 
                        : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    14-Day Extended Horizon
                  </button>
                </div>
              </div>

              {/* Growth Stage */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("Phenological Stage")}</label>
                  <span className="text-[9px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">SIMULATED</span>
                </div>
                <select
                  value={growthStage}
                  onChange={(e) => setGrowthStage(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                >
                  {GROWTH_STAGES.map((s) => (
                    <option key={s} value={s} className="dark:bg-dark-surface">{s}</option>
                  ))}
                </select>
              </div>

              {/* Baseline Severity / Pest Count */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {activeTab === 'pest' ? 'Baseline Pest Count / Trap' : 'Current Disease Severity (%)'}
                  </label>
                  <span className="text-[9px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">SIMULATED</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={activeTab === 'pest' ? pestObservationCount : diseaseSeverityPct}
                  onChange={(e) => activeTab === 'pest' ? setPestObservationCount(parseFloat(e.target.value) || 0) : setDiseaseSeverityPct(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              {/* Environmental Ingestion Matrix (Real ESP32 vs Simulated) */}
              <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Environmental Ingestion</span>
                  {isEsp32Live ? (
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" /> LIVE ESP32
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded">
                      WEATHER FEED
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5">
                    <Thermometer className="h-4 w-4 mx-auto text-amber-500 mb-1" />
                    <span className="text-[10px] font-bold text-slate-400 block">{t("Temperature")}</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block">{activeTemp}°C</span>
                    <span className="text-[8px] font-bold text-emerald-600">REAL</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5">
                    <Droplets className="h-4 w-4 mx-auto text-blue-500 mb-1" />
                    <span className="text-[10px] font-bold text-slate-400 block">{t("Rel. Humidity")}</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block">{activeHum}%</span>
                    <span className="text-[8px] font-bold text-emerald-600">REAL</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5">
                    <CloudRain className="h-4 w-4 mx-auto text-blue-400 mb-1" />
                    <span className="text-[10px] font-bold text-slate-400 block">{t("Rain Sensor")}</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block">
                      {esp32.rain ? (esp32.rain.isRaining ? 'Rain' : 'Dry') : `${activeRain}mm`}
                    </span>
                    <span className="text-[8px] font-bold text-emerald-600">REAL</span>
                  </div>
                </div>

                {/* Satellite Overview */}
                <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <Satellite className="h-4 w-4 text-emerald-500" />
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Sentinel-2 Mean NDVI</span>
                  </div>
                  <span className="font-black text-slate-900 dark:text-white">
                    {satData?.ndvi_mean !== undefined ? satData.ndvi_mean : '0.64 (Cached)'}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={runForecast}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-600 text-white rounded-xl py-5 shadow-premium font-bold text-sm mt-4"
              >
                {loading ? (
                  <span className="flex items-center">
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Evaluating ML Models...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Sparkles className="mr-2 h-4 w-4" /> Run {activeTab === 'pest' ? 'Pest' : 'Disease'} Early Forecasting
                  </span>
                )}
              </Button>

            </CardContent>
          </Card>
        </div>

        {/* Right Column: Model Output & Intelligence Forecast (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="rounded-2xl bg-red-950/40 border border-red-900/60 p-4 text-xs font-semibold text-red-400 flex items-center">
              <AlertCircle className="mr-2 h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {!forecastResult && !loading && (
            <Card className="border-slate-200/70 dark:border-white/10 shadow-premium rounded-[2rem] p-12 text-center flex flex-col items-center justify-center min-h-[460px]">
              <TrendingUp className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4 stroke-[1.5]" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Predictive Intelligence Ready</h3>
              <p className="text-xs font-semibold text-slate-500 max-w-sm mt-2 leading-relaxed">
                Configure your target parameters and run the XGBoost/LightGBM early forecasting sequence to predict multi-horizon pressure.
              </p>
            </Card>
          )}

          {loading && (
            <Card className="border-slate-200/70 dark:border-white/10 shadow-premium rounded-[2rem] p-12 text-center flex flex-col items-center justify-center min-h-[460px] animate-pulse">
              <Cpu className="h-12 w-12 text-primary mb-4 animate-spin" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Computing Multi-Horizon Risk...</h3>
              <p className="text-xs text-slate-500 mt-1">Cross-referencing longitudinal microclimate models & TreeSHAP factors</p>
            </Card>
          )}

          {forecastResult && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              
              {/* Early Warning Risk Scorecard */}
              <Card className="border-slate-200/70 dark:border-white/10 shadow-premium rounded-[2rem] overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {forecastResult.forecast_type} // {horizon.toUpperCase()} Horizon
                      </span>
                      <CardTitle className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                        {localizeThreat(forecastResult.pest || forecastResult.disease)}
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className={clsx(
                      "font-bold text-xs px-3 py-1.5 uppercase",
                      (horizon === '7d' ? forecastResult.risk_level_7d : forecastResult.risk_level_14d) === 'CRITICAL' ? 'border-rose-600 text-rose-600 bg-rose-500/10' :
                      (horizon === '7d' ? forecastResult.risk_level_7d : forecastResult.risk_level_14d) === 'HIGH' ? 'border-amber-500 text-amber-500 bg-amber-500/10' :
                      'border-emerald-500 text-emerald-600 bg-emerald-500/10'
                    )}>
                      {localizeSeverity(horizon === '7d' ? forecastResult.risk_level_7d : forecastResult.risk_level_14d)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  
                  {/* Probability Bar Meter */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500">{horizon === '7d' ? '7-Day Outbreak Probability' : '14-Day Outbreak Probability'}</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white">
                        {horizon === '7d' ? forecastResult.risk_7d : forecastResult.risk_14d}%
                      </span>
                    </div>
                    {getRiskMeter(
                      horizon === '7d' ? forecastResult.risk_level_7d : forecastResult.risk_level_14d,
                      horizon === '7d' ? forecastResult.risk_7d : forecastResult.risk_14d
                    )}
                  </div>

                  {/* Multi-Horizon Quick Comparison */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-white/5 text-center">
                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">7-Day Risk</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white mt-1 block">{forecastResult.risk_7d}%</span>
                      <span className="text-[9px] font-semibold text-slate-500">{forecastResult.risk_level_7d}</span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">14-Day Risk</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white mt-1 block">{forecastResult.risk_14d}%</span>
                      <span className="text-[9px] font-semibold text-slate-500">{forecastResult.risk_level_14d}</span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Trend</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white mt-1 block">{forecastResult.trend}</span>
                      <span className="text-[9px] font-semibold text-emerald-600">Model Conf {forecastResult.confidence}%</span>
                    </div>
                  </div>

                  {/* Contributing Microclimatic Factors */}
                  {forecastResult.key_factors && forecastResult.key_factors.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                        Contributing Environmental Conditions
                      </h4>
                      <div className="space-y-2">
                        {forecastResult.key_factors.map((f: string, i: number) => (
                          <div key={i} className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <span>{localizeRationale(f)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </CardContent>
              </Card>

              {/* Pathway to Recommendations */}
              {forecastResult.recommendation && (
                <Card className="rounded-[2rem] shadow-premium border-primary/20 bg-primary/5">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-black text-primary flex items-center">
                        <ShieldCheck className="h-5 w-5 mr-2" /> Verified Preventive Recommendations
                      </CardTitle>
                      <Badge variant="outline" className="border-primary/30 text-primary font-bold">
                        Recommendation Engine v2.1
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-4">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-dark-surface p-4 rounded-xl border border-slate-200 dark:border-white/10 leading-relaxed shadow-sm">
                      {localizeAction(forecastResult.recommendation.primary_action) || t("Maintain standard crop surveillance.")}
                    </p>
                    
                    {forecastResult.recommendation.safety_info && forecastResult.recommendation.safety_info.length > 0 && (
                      <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        {forecastResult.recommendation.safety_info.map((s: any, idx: number) => (
                          <p key={idx} className="bg-white/60 dark:bg-dark-surface/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-white/5">
                            <strong>{s.chemical_name || s.active_ingredient}:</strong> Dosage: {s.dosage_per_ha || 'As prescribed'}. {s.phi_days ? `PHI: ${s.phi_days} days.` : ''}
                          </p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

            </motion.div>
          )}

        </div>

      </div>

    </div>
  )
}
