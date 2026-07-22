import { Thermometer, Droplets, CloudRain, Sprout } from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'

const metrics = [
  { key: 'temperature', label: 'Temperature', icon: Thermometer, unit: '°C', iconBg: 'bg-[var(--color-accent)]/15', iconColor: 'text-[var(--color-accent)]',
    thresholds: { warning: 35, danger: 40 }, good: 'Normal' },
  { key: 'humidity', label: 'Humidity', icon: Droplets, unit: '%', iconBg: 'bg-[var(--color-secondary)]/15', iconColor: 'text-[var(--color-secondary)]',
    thresholds: { warning: 70, danger: 85 }, good: 'Optimal' },
  { key: 'soil_moisture', label: 'Soil Moisture', icon: Sprout, unit: '%', iconBg: 'bg-[var(--color-primary)]/15', iconColor: 'text-[var(--color-primary)]',
    thresholds: { warning: 35, danger: 20 }, good: 'Moist' },
  { key: 'rain_detected', label: 'Rain', icon: CloudRain, unit: '', iconBg: 'bg-cyan-50', iconColor: 'text-cyan-600',
    isBoolean: true },
]

function getValueColor(metric, value) {
  if (metric.isBoolean) return value ? 'text-[var(--color-secondary)]' : 'text-slate-400'
  if (metric.key === 'soil_moisture') {
    if (value < metric.thresholds.danger) return 'text-[var(--color-danger)]'
    if (value < metric.thresholds.warning) return 'text-[var(--color-accent)]'
    return 'text-[var(--color-primary)]'
  }
  if (value >= metric.thresholds?.danger) return 'text-[var(--color-danger)]'
  if (value >= metric.thresholds?.warning) return 'text-[var(--color-accent)]'
  return 'text-[var(--color-primary)]'
}

function ProgressBar({ value, thresholds, isBoolean, metricKey }) {
  if (isBoolean) return null
  const pct = Math.min(100, Math.max(0, metricKey === 'soil_moisture' ? (100 - value) : value))
  const color =
    metricKey === 'soil_moisture'
      ? (value < (thresholds?.danger || 20) ? 'bg-[var(--color-danger)]' : value < (thresholds?.warning || 35) ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-primary)]')
      : (value >= (thresholds?.danger || 40) ? 'bg-[var(--color-danger)]' : value >= (thresholds?.warning || 35) ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-primary)]')

  return (
    <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function SensorCard({ data, loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {metrics.map(m => (
          <div key={m.key} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 animate-pulse">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-slate-200 rounded-xl" />
              <div className="h-3 bg-slate-200 rounded w-20" />
            </div>
            <div className="h-8 bg-slate-200 rounded w-16 mb-2" />
            <div className="h-1.5 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {metrics.map((metric) => {
        const { key, label, icon: Icon, unit, iconBg, iconColor, thresholds, isBoolean } = metric
        const raw = data?.[key]
        const value = raw ?? null
        const display = isBoolean ? (value ? 'Raining' : 'Dry') : (value !== null ? `${value}${unit}` : '--')
        const valueColor = value !== null ? getValueColor(metric, value) : 'text-[var(--color-text-muted)]'

        return (
          <div key={key} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 card-hover">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
              </div>
              {/* Live indicator */}
              {data && (
                <span className="flex items-center gap-1 text-[10px] text-[var(--color-primary)] font-medium">
                  <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full pulse-live" />
                  LIVE
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] font-medium mb-1">{label}</p>
            <p className={`text-2xl font-bold font-poppins ${valueColor}`}>{display}</p>
            <ProgressBar value={value} thresholds={thresholds} isBoolean={isBoolean} metricKey={key} />
          </div>
        )
      })}
    </div>
  )
}
