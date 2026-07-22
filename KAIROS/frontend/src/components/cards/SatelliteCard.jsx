import { Satellite, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import Badge from '@/components/ui/Badge'

export default function SatelliteCard({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 animate-pulse">
        <div className="flex gap-3 items-center mb-5"><div className="w-10 h-10 bg-slate-200 rounded-xl" /><div className="h-4 w-32 bg-slate-200 rounded" /></div>
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-8 bg-slate-200 rounded-xl" />)}</div>
      </div>
    )
  }

  const ndvi = data?.ndvi_mean ?? null
  const ndviColor = ndvi === null ? 'text-slate-400' : ndvi >= 0.5 ? 'text-[var(--color-primary)]' : ndvi >= 0.3 ? 'text-[var(--color-accent)]' : 'text-[var(--color-danger)]'
  const ndviLabel = ndvi === null ? 'No Data' : ndvi >= 0.5 ? 'Healthy' : ndvi >= 0.3 ? 'Moderate Stress' : 'Severe Stress'
  const ndviVariant = ndvi === null ? 'default' : ndvi >= 0.5 ? 'success' : ndvi >= 0.3 ? 'warning' : 'danger'

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 card-hover">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-primary)]/15 rounded-xl flex items-center justify-center">
            <Satellite className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Satellite NDVI</h3>
            <p className="text-xs text-[var(--color-text-muted)]">Sentinel-2</p>
          </div>
        </div>
        <Badge label={ndviLabel} variant={ndviVariant} dot />
      </div>

      {/* NDVI value */}
      <div className="flex items-end gap-2 mb-4">
        <p className={`text-4xl font-bold font-poppins ${ndviColor}`}>
          {ndvi !== null ? ndvi.toFixed(3) : '--'}
        </p>
        <p className="text-sm text-[var(--color-text-muted)] mb-1">NDVI</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[var(--color-primary)]/15 dark:bg-[var(--color-primary)]/20 rounded-xl p-3 text-center">
          <p className="text-xs text-[var(--color-primary)] font-medium mb-1">Healthy</p>
          <p className="text-lg font-bold text-[var(--color-primary)]">{data?.healthy_pct ?? '--'}%</p>
        </div>
        <div className="bg-[var(--color-accent)]/15 dark:bg-[var(--color-accent)]/20 rounded-xl p-3 text-center">
          <p className="text-xs text-[var(--color-accent)] font-medium mb-1">Moderate</p>
          <p className="text-lg font-bold text-[var(--color-accent)]">{data?.moderate_pct ?? '--'}%</p>
        </div>
        <div className="bg-[var(--color-danger)]/15 dark:bg-[var(--color-danger)]/20 rounded-xl p-3 text-center">
          <p className="text-xs text-[var(--color-danger)] font-medium mb-1">Stressed</p>
          <p className="text-lg font-bold text-[var(--color-danger)]">{data?.stress_pct ?? '--'}%</p>
        </div>
      </div>

      {/* Last updated */}
      {data?.timestamp && (
        <div className="flex items-center gap-1.5 mt-3 text-xs text-[var(--color-text-muted)]">
          <Clock className="w-3 h-3" />
          <span>Updated {new Date(data.timestamp).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  )
}
