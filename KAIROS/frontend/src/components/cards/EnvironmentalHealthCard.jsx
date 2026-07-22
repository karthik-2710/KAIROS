import { Activity, Wind, Droplets, Thermometer, Sun, CheckCircle2 } from 'lucide-react'
import Badge from '@/components/ui/Badge'

export default function EnvironmentalHealthCard({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 animate-pulse">
        <div className="h-4 w-32 bg-slate-200 rounded mb-4" />
        <div className="h-12 w-24 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-6 bg-slate-200 rounded" />)}</div>
      </div>
    )
  }

  const index = data?.health_index ?? null
  const tempClass = data?.temp_class ?? 'Unknown'
  const humClass = data?.hum_class ?? 'Unknown'
  const moistureClass = data?.moisture_class ?? 'Unknown'
  const lightClass = data?.light_class ?? 'Unknown'
  const airClass = data?.air_quality_class ?? 'Unknown'
  
  const statusLabel = index === null ? 'No Data' : index >= 80 ? 'Excellent' : index >= 60 ? 'Good' : index >= 40 ? 'Moderate' : 'Poor'
  const statusVariant = index === null ? 'default' : index >= 80 ? 'success' : index >= 60 ? 'info' : index >= 40 ? 'warning' : 'danger'
  const colorClass = index === null ? 'text-slate-400' : index >= 80 ? 'text-[var(--color-primary)]' : index >= 60 ? 'text-[var(--color-secondary)]' : index >= 40 ? 'text-[var(--color-accent)]' : 'text-[var(--color-danger)]'

  const factors = [
    { label: 'Temperature', val: tempClass, icon: Thermometer, color: 'text-[var(--color-accent)]' },
    { label: 'Humidity', val: humClass, icon: Droplets, color: 'text-[var(--color-secondary)]' },
    { label: 'Soil Moisture', val: moistureClass, icon: Activity, color: 'text-[var(--color-primary)]' },
    { label: 'Light', val: lightClass, icon: Sun, color: 'text-[var(--color-accent)]' },
    { label: 'Air Quality', val: airClass, icon: Wind, color: 'text-cyan-500' },
  ]

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 card-hover">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Environmental Health</h3>
        <Badge label={statusLabel} variant={statusVariant} dot />
      </div>
      
      <div className="flex items-end gap-2 mb-6">
        <p className={`text-4xl font-bold font-poppins ${colorClass}`}>
          {index !== null ? `${index}%` : '--'}
        </p>
      </div>

      <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">Contributing Factors</p>
      <div className="space-y-3">
        {factors.map((f, i) => {
          const Icon = f.icon
          const isGood = ['Optimal', 'Excellent', 'Good', 'Moist', 'Optimal Photosynthesis'].includes(f.val)
          return (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${f.color}`} />
                <span className="text-[var(--color-text-primary)] font-medium">{f.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--color-text-secondary)] text-xs">{f.val}</span>
                {isGood && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-primary)]" />}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
