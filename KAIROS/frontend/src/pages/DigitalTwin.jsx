import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Thermometer, Droplets, Sun, Wind, CloudRain, ShieldAlert, CheckCircle, Target, Factory, Leaf, Activity, Info
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE = 'http://localhost:5000/api'

export default function DigitalTwin() {
  const [telemetry, setTelemetry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scenarioLoading, setScenarioLoading] = useState(false)

  const scenarios = [
    "Healthy Farm",
    "Water Stress",
    "Early Blight",
    "Late Blight",
    "Heat Wave",
    "Nutrient Deficiency"
  ]

  const fetchTelemetry = async () => {
    try {
      const res = await axios.get(`${API_BASE}/iot/live`)
      // API currently returns the sensor state directly.
      // But we also updated /sensor/latest to return e.g. health_index, temp_class, etc.
      // Let's assume we can fetch the latest from /sensor/latest as well to get intelligence.
      const intelRes = await axios.get(`${API_BASE}/sensor/latest`)
      setTelemetry({ ...res.data, ...intelRes.data })
    } catch (err) {
      console.error("Failed to fetch telemetry:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTelemetry()
    const interval = setInterval(fetchTelemetry, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleScenarioChange = async (scenario) => {
    setScenarioLoading(true)
    try {
      await axios.post(`${API_BASE}/iot/scenario`, { scenario })
      toast.success(`Transitioning to ${scenario}`)
      fetchTelemetry()
    } catch (err) {
      toast.error('Failed to change scenario')
    } finally {
      setScenarioLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-bg)] dark:bg-[var(--color-bg)]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-10 w-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full"
        />
      </div>
    )
  }

  const healthIndex = telemetry?.health_index ?? 0
  let healthColor = "text-[var(--color-primary)]"
  let healthBg = "bg-[var(--color-primary)]"
  if (healthIndex < 40) { healthColor = "text-[var(--color-danger)]"; healthBg = "bg-[var(--color-danger)]" }
  else if (healthIndex < 70) { healthColor = "text-[var(--color-accent)]"; healthBg = "bg-[var(--color-accent)]" }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] dark:bg-[var(--color-bg)] text-[var(--color-text-primary)] dark:text-white p-6 space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] dark:text-gray-100 tracking-tight flex items-center gap-2">
            <Activity className="text-[var(--color-primary)] h-8 w-8" />
            Environmental Intelligence
          </h1>
          <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] mt-1">Live agronomic analysis from IoT sensor fusion</p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-primary)]"></span>
          </span>
          <span className="text-sm font-medium text-[var(--color-primary)] dark:text-[var(--color-primary)]">Engine Active</span>
        </div>
      </div>

      {/* Control Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--color-surface)] dark:bg-[var(--color-surface)] p-6 rounded-2xl shadow-none border border-[var(--color-border)] border-[var(--color-border)]"
      >
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 uppercase tracking-wide text-[var(--color-text-muted)]">
          <Target className="w-4 h-4 text-[var(--color-secondary)]" />
          Simulation Override
        </h2>
        <div className="flex flex-wrap gap-3">
          {scenarios.map(s => (
            <button
              key={s}
              disabled={scenarioLoading}
              onClick={() => handleScenarioChange(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                telemetry?.scenario === s
                  ? 'bg-[var(--color-secondary)] text-white shadow-none '
                  : 'bg-gray-100 dark:bg-gray-700 text-[var(--color-text-secondary)] dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Main Intelligence Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Health Index */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[var(--color-surface)] dark:bg-[var(--color-surface)] p-8 rounded-3xl border border-[var(--color-border)] border-[var(--color-border)] shadow-none flex flex-col items-center justify-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Leaf className="w-48 h-48" />
          </div>
          <h3 className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] font-medium mb-6 uppercase tracking-wider text-sm">Environmental Health Index</h3>
          
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="96" cy="96" r="88" className="stroke-current text-gray-200 dark:text-[var(--color-text-secondary)]" strokeWidth="12" fill="transparent" />
              <motion.circle 
                cx="96" cy="96" r="88" 
                className={`stroke-current ${healthColor}`} 
                strokeWidth="12" 
                fill="transparent" 
                strokeDasharray="552.9" 
                initial={{ strokeDashoffset: 552.9 }}
                animate={{ strokeDashoffset: 552.9 - (552.9 * healthIndex) / 100 }}
                transition={{ duration: 1, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-5xl font-bold ${healthColor}`}>{healthIndex}</span>
              <span className="text-sm font-medium text-[var(--color-text-muted)] mt-1">/ 100</span>
            </div>
          </div>
          
          <div className="mt-8">
            <p className="text-sm text-[var(--color-text-muted)]">Status</p>
            <p className={`text-xl font-bold mt-1 ${healthColor}`}>
              {healthIndex >= 80 ? 'Excellent' : healthIndex >= 60 ? 'Good' : healthIndex >= 40 ? 'Moderate' : 'Poor'}
            </p>
          </div>
        </motion.div>

        {/* Telemetry Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <TelemetryCard 
            title="Temperature" 
            value={telemetry?.temperature?.toFixed(1)} 
            unit="°C" 
            classification={telemetry?.temp_class}
            icon={Thermometer} 
            color="text-[var(--color-accent)]"
            bg="bg-[var(--color-accent)]/10"
          />
          <TelemetryCard 
            title="Humidity" 
            value={telemetry?.humidity?.toFixed(1)} 
            unit="%" 
            classification={telemetry?.hum_class}
            icon={Droplets} 
            color="text-[var(--color-secondary)]"
            bg="bg-[var(--color-secondary)]/10"
          />
          <TelemetryCard 
            title="Soil Moisture" 
            value={telemetry?.soil_moisture?.toFixed(1)} 
            unit="%" 
            classification={telemetry?.moisture_class}
            icon={Wind} 
            color="text-[var(--color-primary)]"
            bg="bg-[var(--color-primary)]/10"
          />
          <TelemetryCard 
            title="Air Quality (MQ135)" 
            value={telemetry?.mq135?.toFixed(0)} 
            unit=" AQI" 
            classification={telemetry?.air_quality_class}
            icon={Wind} 
            color="text-[var(--color-secondary)]"
            bg="bg-[var(--color-secondary)]/10"
          />
          <TelemetryCard 
            title="Light Intensity" 
            value={telemetry?.light?.toFixed(0)} 
            unit=" lux" 
            classification={telemetry?.light_class}
            icon={Sun} 
            color="text-[var(--color-accent)]"
            bg="bg-[var(--color-accent)]/10"
          />
          
          {/* Insights Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--color-secondary)]/15 dark:bg-[var(--color-secondary)]/20 p-6 rounded-3xl border border-[var(--color-secondary)] dark:border-[var(--color-secondary)]/30 shadow-none flex flex-col justify-center"
          >
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-[var(--color-secondary)]" />
              <h3 className="font-semibold text-[var(--color-secondary)] dark:text-[var(--color-secondary)]">Environmental Insights</h3>
            </div>
            <ul className="space-y-2">
              {telemetry?.insights?.map((insight, idx) => (
                <li key={idx} className="text-sm text-[var(--color-secondary)]/80 dark:text-[var(--color-secondary)]/80 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)] mt-1.5 flex-shrink-0" />
                  <span>{insight}</span>
                </li>
              ))}
              {(!telemetry?.insights || telemetry.insights.length === 0) && (
                <li className="text-sm text-[var(--color-secondary)]/60 dark:text-[var(--color-secondary)]/60">No specific insights currently.</li>
              )}
            </ul>
          </motion.div>
        </div>
      </div>

    </div>
  )
}

function TelemetryCard({ title, value, unit, classification, icon: Icon, color, bg }) {
  let badgeColor = "bg-gray-100 text-[var(--color-text-secondary)] dark:bg-gray-700 dark:text-gray-300"
  if (classification === 'Optimal' || classification === 'Excellent' || classification === 'Good' || classification === 'Optimal Photosynthesis') {
    badgeColor = "bg-[var(--color-primary)] text-[var(--color-primary)] dark:bg-[var(--color-primary)]/30 dark:text-[var(--color-primary)]"
  } else if (classification === 'Poor' || classification === 'Extreme Heat' || classification === 'Dry' || classification === 'Waterlogged' || classification === 'Very High') {
    badgeColor = "bg-[var(--color-danger)] text-[var(--color-danger)] dark:bg-[var(--color-danger)]/30 dark:text-[var(--color-danger)]"
  } else if (classification) {
    badgeColor = "bg-[var(--color-accent)] text-[var(--color-accent)] dark:bg-[var(--color-accent)]/30 dark:text-[var(--color-accent)]"
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[var(--color-surface)] dark:bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-border)] border-[var(--color-border)] shadow-none hover:shadow-none transition-shadow relative overflow-hidden group"
    >
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${bg} blur-2xl opacity-50 group-hover:opacity-80 transition-opacity`} />
      
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2.5 rounded-2xl ${bg} ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {classification && (
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${badgeColor}`}>
            {classification}
          </span>
        )}
      </div>
      <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] font-medium text-sm mt-4">{title}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <motion.span 
          key={value}
          initial={{ opacity: 0.5, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-[var(--color-text-primary)] dark:text-gray-100 font-poppins"
        >
          {value ?? '--'}
        </motion.span>
        <span className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] font-medium">{unit}</span>
      </div>
    </motion.div>
  )
}
