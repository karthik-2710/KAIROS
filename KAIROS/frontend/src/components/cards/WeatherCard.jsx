import { Thermometer, Wind, Droplets, CloudRain, Eye, Cloud } from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'

function WeatherStat({ icon: Icon, label, value, iconColor }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-[var(--color-secondary)]/15 dark:bg-[var(--color-secondary)]/30 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className={`w-4 h-4 ${iconColor || 'text-[var(--color-secondary)]'}`} />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{value}</p>
      </div>
    </div>
  )
}

export default function WeatherCard({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 animate-pulse space-y-4">
        <div className="flex gap-3 items-center mb-4">
          <div className="w-10 h-10 bg-slate-200 rounded-xl" />
          <div><div className="h-3 w-20 bg-slate-200 rounded mb-2" /><div className="h-2 w-16 bg-slate-200 rounded" /></div>
        </div>
        <div className="h-16 bg-slate-200 rounded-xl mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-12 bg-slate-200 rounded-xl" />)}
        </div>
      </div>
    )
  }

  const rainRisk = data?.rain_forecast_mm > 10 ? 'High' : data?.rain_forecast_mm > 2 ? 'Moderate' : 'Low'
  const rainColor = rainRisk === 'High' ? 'text-[var(--color-secondary)]' : rainRisk === 'Moderate' ? 'text-cyan-600' : 'text-slate-400'

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white card-hover">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[var(--color-secondary)] text-xs font-medium uppercase tracking-widest">Weather</p>
          <p className="text-sm font-medium mt-0.5 opacity-90">{data?.location || 'Farm Location'}</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold font-poppins">{data?.temperature ?? '--'}°</p>
          <p className="text-[var(--color-secondary)] text-xs mt-1">{data?.description || 'Clear'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-[var(--color-surface)]/10 backdrop-blur-sm rounded-xl p-3">
          <p className="text-[var(--color-secondary)] text-xs mb-1">Humidity</p>
          <p className="text-lg font-bold">{data?.humidity ?? '--'}%</p>
        </div>
        <div className="bg-[var(--color-surface)]/10 backdrop-blur-sm rounded-xl p-3">
          <p className="text-[var(--color-secondary)] text-xs mb-1">Wind</p>
          <p className="text-lg font-bold">{data?.wind_speed ?? '--'} km/h</p>
        </div>
        <div className="bg-[var(--color-surface)]/10 backdrop-blur-sm rounded-xl p-3">
          <p className="text-[var(--color-secondary)] text-xs mb-1">Rain 24h</p>
          <p className="text-lg font-bold">{data?.rain_forecast_mm ?? 0} mm</p>
        </div>
        <div className="bg-[var(--color-surface)]/10 backdrop-blur-sm rounded-xl p-3">
          <p className="text-[var(--color-secondary)] text-xs mb-1">Rain Risk</p>
          <p className="text-lg font-bold">{rainRisk}</p>
        </div>
      </div>
    </div>
  )
}
