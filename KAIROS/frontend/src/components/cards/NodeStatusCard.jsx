import { Cpu, Battery, Signal, Clock, AlertTriangle } from 'lucide-react'
import Badge from '@/components/ui/Badge'

export default function NodeStatusCard({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 animate-pulse">
        <div className="h-4 w-32 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-6 bg-slate-200 rounded" />)}</div>
      </div>
    )
  }

  const node = data?.node_status
  if (!node) return null

  const isOnline = !node.is_offline
  const statusColor = isOnline ? 'text-[var(--color-primary)]' : 'text-[var(--color-danger)]'
  const badgeVariant = isOnline ? 'success' : 'danger'

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 card-hover">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-slate-400" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Node Status</h3>
        </div>
        <Badge label={node.status} variant={badgeVariant} dot />
      </div>

      {!isOnline && (
        <div className="bg-[var(--color-danger)]/15 dark:bg-[var(--color-danger)]/20 border border-[var(--color-danger)] dark:border-[var(--color-danger)]/30 rounded-xl p-3 mb-4 flex gap-3 items-start">
          <AlertTriangle className="w-4 h-4 text-[var(--color-danger)] mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-[var(--color-danger)] dark:text-[var(--color-danger)]">Sensor Offline Alert</p>
            <p className="text-[10px] text-[var(--color-danger)] dark:text-[var(--color-danger)] mt-0.5">Telemetry has been lost. Recommendation engine is currently ignoring stale values.</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <Clock className="w-4 h-4" />
            <span>Last Update</span>
          </div>
          <span className="font-medium text-[var(--color-text-primary)] text-xs">
            {node.last_update === 'Never' ? 'Never' : new Date(node.last_update).toLocaleTimeString()}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <Battery className="w-4 h-4" />
            <span>Battery Level</span>
          </div>
          <span className="font-medium text-[var(--color-text-primary)]">{node.battery_level}%</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <Signal className="w-4 h-4" />
            <span>Signal Strength</span>
          </div>
          <span className="font-medium text-[var(--color-text-primary)]">{node.signal_strength}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm border-t border-[var(--color-border)] pt-3">
          <span className="text-[var(--color-text-secondary)] text-xs">Telemetry Rate</span>
          <span className="font-medium text-[var(--color-text-primary)] text-xs">{node.update_rate_seconds}s</span>
        </div>
      </div>
    </div>
  )
}
