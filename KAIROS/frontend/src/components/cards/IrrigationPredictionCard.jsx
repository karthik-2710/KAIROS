import { Droplets, TrendingDown, TrendingUp, ArrowRight } from 'lucide-react'
import Badge from '@/components/ui/Badge'

export default function IrrigationPredictionCard({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 animate-pulse">
        <div className="h-4 w-32 bg-slate-200 rounded mb-4" />
        <div className="h-12 w-full bg-slate-200 rounded mb-4" />
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-6 bg-slate-200 rounded" />)}</div>
      </div>
    )
  }

  const irr = data?.irrigation_prediction
  if (!irr) return null

  const isCritical = irr.status === 'Critical'
  const isWarning = irr.status === 'Warning'
  const bgClass = isCritical ? 'bg-[var(--color-danger)]/15 dark:bg-[var(--color-danger)]/10 border-[var(--color-danger)] dark:border-[var(--color-danger)]/30' :
                  isWarning ? 'bg-[var(--color-accent)]/15 dark:bg-[var(--color-accent)]/10 border-[var(--color-accent)] dark:border-[var(--color-accent)]/30' :
                  'bg-[var(--color-primary)]/15 dark:bg-[var(--color-primary)]/10 border-[var(--color-primary)] dark:border-[var(--color-primary)]/30'

  const iconColor = isCritical ? 'text-[var(--color-danger)]' : isWarning ? 'text-[var(--color-accent)]' : 'text-[var(--color-primary)]'

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 card-hover">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-[var(--color-secondary)]" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Predictive Irrigation</h3>
        </div>
        <Badge label={irr.status} variant={isCritical ? 'danger' : isWarning ? 'warning' : 'success'} />
      </div>

      <div className={`border rounded-xl p-4 mb-4 ${bgClass}`}>
        <p className="text-sm font-medium text-[var(--color-text-primary)] leading-snug">{irr.prediction}</p>
        {irr.trend_analysis && (
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">{irr.trend_analysis}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-2">
        <div>
          <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Projected Moisture</p>
          <div className="flex items-center gap-1.5">
            {irr.hours_until_dry !== null && irr.hours_until_dry < 24 ? <TrendingDown className="w-4 h-4 text-[var(--color-accent)]" /> : <TrendingUp className="w-4 h-4 text-[var(--color-primary)]" />}
            <span className="text-lg font-bold font-poppins text-[var(--color-text-primary)]">{irr.projected_moisture ?? '--'}%</span>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Recommended Vol.</p>
          <div className="flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-[var(--color-secondary)]" />
            <span className="text-lg font-bold font-poppins text-[var(--color-secondary)] dark:text-[var(--color-secondary)]">{irr.recommended_liters} L</span>
          </div>
        </div>
      </div>
      
    </div>
  )
}
