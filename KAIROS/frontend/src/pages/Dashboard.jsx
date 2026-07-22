import { useEffect, useState } from 'react'
import { useFarmStore } from '@/store/farmStore'
import { dashboardAPI } from '@/services/api'
import HealthScoreRing from '@/components/ui/HealthScoreRing'
import SensorCard from '@/components/cards/SensorCard'
import WeatherCard from '@/components/cards/WeatherCard'
import SatelliteCard from '@/components/cards/SatelliteCard'
import RecommendationCard from '@/components/cards/RecommendationCard'
import EnvironmentalHealthCard from '@/components/cards/EnvironmentalHealthCard'
import NodeStatusCard from '@/components/cards/NodeStatusCard'
import IrrigationPredictionCard from '@/components/cards/IrrigationPredictionCard'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { MapPin, TrendingUp, Leaf, RefreshCw, Activity, AlertTriangle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

// ─── Dashboard Stats Cards ──────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, suffix = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 card-hover"
    >
      <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className="w-4.5 h-4.5 text-white" />
      </div>
      <p className="text-2xl font-bold font-poppins text-[var(--color-text-primary)]">{value}{suffix}</p>
      <p className="text-xs text-[var(--color-text-muted)] mt-1">{label}</p>
    </motion.div>
  )
}
export default function Dashboard() {
  const navigate = useNavigate()
  const { selectedFarm, analysisData: data, analysisLoading: loading, fetchAnalysis } = useFarmStore()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (selectedFarm?.id) {
      const interval = setInterval(() => fetchAnalysis(selectedFarm.id, true), 30000) // refresh every 30s
      return () => clearInterval(interval)
    }
  }, [selectedFarm?.id, fetchAnalysis])

  const handleRefresh = async () => {
    if (!selectedFarm?.id) return
    setRefreshing(true)
    await fetchAnalysis(selectedFarm.id, true)
    setRefreshing(false)
    toast.success('Dashboard refreshed')
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-[var(--color-text-primary)]">
            Farm Dashboard
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {selectedFarm ? (
              <>
                <MapPin className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {selectedFarm.name} · {selectedFarm.crop_type}
                </span>
              </>
            ) : (
              <span className="text-sm text-[var(--color-text-muted)]">No farm selected</span>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          loading={refreshing}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Farm Health Score" value={data?.health_score ?? '--'} icon={Activity} color="bg-[var(--color-primary)]" suffix="/100" />
        <StatCard label="Total Farms" value={data?.stats?.total_farms ?? '--'} icon={MapPin} color="bg-[var(--color-secondary)]" />
        <StatCard label="Active Alerts" value={data?.stats?.alerts ?? 0} icon={AlertTriangle} color="bg-[var(--color-accent)]" />
        <StatCard label="Diseases Detected" value={data?.stats?.diseases_detected ?? 0} icon={Leaf} color="bg-[var(--color-secondary)]" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Health Score + Recommendation  — Left column */}
        <div className="lg:col-span-1 space-y-5">
          {/* Health Score */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-[var(--color-primary)]/15 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[var(--color-primary)]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Overall Health</h3>
                <p className="text-xs text-[var(--color-text-muted)]">Cross-verified score</p>
              </div>
            </div>
            <div className="flex flex-col items-center py-4">
              <HealthScoreRing score={data?.health_score ?? 0} size={150} />
              <p className="text-xs text-[var(--color-text-muted)] mt-4 text-center max-w-[180px]">
                Combined from satellite, sensors, weather & AI
              </p>
            </div>
          </motion.div>

          {/* Recommendation */}
          {loading
            ? <CardSkeleton />
            : <RecommendationCard data={data?.recommendation} />
          }
        </div>

        {/* Center + Right columns */}
        <div className="lg:col-span-2 space-y-5">
          {/* Sensor + Weather row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest mb-3">
                IoT Sensors · Live
              </h3>
              <SensorCard data={data?.iot} loading={loading} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest mb-3">
                Weather · Real-time
              </h3>
              {loading ? <CardSkeleton /> : <WeatherCard data={data?.weather} />}
            </div>
          </div>

          {/* IoT Deep Integration Row */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest mb-3">
              Hardware Intelligence
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <EnvironmentalHealthCard data={data?.iot} loading={loading} />
              <NodeStatusCard data={data?.iot} loading={loading} />
              <IrrigationPredictionCard data={data?.iot} loading={loading} />
            </div>
          </div>

          {/* Satellite */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest mb-3">
              Satellite Analysis · Sentinel-2
            </h3>
            {loading ? <CardSkeleton /> : <SatelliteCard data={data?.satellite} />}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => navigate('/upload')}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 hover:border-[var(--color-primary)] hover:shadow-none transition-all group text-center"
            >
              <div className="w-10 h-10 bg-[var(--color-primary)]/15 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-[var(--color-primary)] transition-colors">
                <Leaf className="w-5 h-5 text-[var(--color-primary)]" />
              </div>
              <p className="text-xs font-semibold text-[var(--color-text-primary)]">Leaf Scan</p>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Upload & Detect</p>
            </button>
            <button
              onClick={() => navigate('/satellite')}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 hover:border-[var(--color-secondary)] hover:shadow-none transition-all group text-center"
            >
              <div className="w-10 h-10 bg-[var(--color-secondary)]/15 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-[var(--color-secondary)] transition-colors">
                <Activity className="w-5 h-5 text-[var(--color-secondary)]" />
              </div>
              <p className="text-xs font-semibold text-[var(--color-text-primary)]">Satellite</p>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">NDVI Analysis</p>
            </button>
            <button
              onClick={() => navigate('/history')}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 hover:border-[var(--color-secondary)] hover:shadow-none transition-all group text-center"
            >
              <div className="w-10 h-10 bg-[var(--color-secondary)]/15 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-[var(--color-secondary)] transition-colors">
                <TrendingUp className="w-5 h-5 text-[var(--color-secondary)]" />
              </div>
              <p className="text-xs font-semibold text-[var(--color-text-primary)]">History</p>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Trends & Logs</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
