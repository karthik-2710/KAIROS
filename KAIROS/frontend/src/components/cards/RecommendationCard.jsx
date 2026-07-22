import { AlertTriangle, CheckCircle2, Droplets, Bug, Flame, Activity } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'

const severityMap = {
  'Critical': { icon: AlertTriangle, color: 'text-[var(--color-danger)]', bg: 'bg-[var(--color-danger)]/15', variant: 'danger' },
  'High':     { icon: Flame, color: 'text-[var(--color-accent)]', bg: 'bg-[var(--color-accent)]/15', variant: 'warning' },
  'Moderate': { icon: Droplets, color: 'text-[var(--color-accent)]', bg: 'bg-[var(--color-accent)]/15', variant: 'warning' },
  'Low':      { icon: Bug, color: 'text-[var(--color-secondary)]', bg: 'bg-[var(--color-secondary)]/15', variant: 'info' },
  'None':     { icon: CheckCircle2, color: 'text-[var(--color-primary)]', bg: 'bg-[var(--color-primary)]/15', variant: 'success' },
}

export default function RecommendationCard({ data, loading = false }) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 animate-pulse space-y-4">
        <div className="h-4 w-40 bg-slate-200 rounded" />
        <div className="h-16 bg-slate-200 rounded-xl" />
        <div className="h-10 bg-slate-200 rounded-xl" />
      </div>
    )
  }

  const severity = data?.severity || 'None'
  const { icon: Icon, color, bg, variant } = severityMap[severity] || severityMap['None']

  return (
    <div className={`rounded-2xl p-6 border card-hover
      ${severity === 'None'
        ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-[var(--color-primary)] dark:from-emerald-950/40 dark:border-[var(--color-primary)]'
        : 'bg-[var(--color-surface)] border-[var(--color-border)]'
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Agronomic Decision</h3>
            <Badge label={severity === 'None' ? 'Optimal' : severity} variant={variant} size="sm" />
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Confidence: {data?.confidence || 100}%</p>
        </div>
      </div>

      <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">{data?.primary_issue || 'All systems normal'}</p>
      <p className="text-xs text-[var(--color-text-muted)] mb-3 line-clamp-2">{data?.diagnostic_summary}</p>
      
      {/* Show just one top action if available */}
      {data?.recommended_actions?.length > 0 ? (
        <p className="text-xs text-[var(--color-text-secondary)] mb-4 flex items-start gap-2 bg-[var(--color-primary)]/15/50 p-2 rounded-lg">
           <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
           {data.recommended_actions[0]}
        </p>
      ) : (
        <p className="text-xs text-[var(--color-text-secondary)] mb-4">
           Continue monitoring. No immediate action required.
        </p>
      )}

      {/* Source pills */}
      {data?.supporting_evidence && (
        <div className="mb-4">
          <p className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">Evidence Used</p>
          <div className="flex flex-wrap gap-1.5">

          {data.supporting_evidence.map(src => (
            <span key={src} className="text-[10px] px-2 py-0.5 bg-[var(--color-bg)] rounded-full font-medium text-[var(--color-text-muted)] border border-[var(--color-border)]">
              {src}
            </span>
          ))}
          </div>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        fullWidth
        onClick={() => navigate('/recommendation')}
      >
        View Full Analysis →
      </Button>
    </div>
  )
}
