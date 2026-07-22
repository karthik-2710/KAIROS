/**
 * Health Score Ring — SVG-based animated circular progress
 * score: 0–100
 */
export default function HealthScoreRing({ score = 0, size = 140 }) {
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 75 ? '#16A34A' :
    score >= 50 ? '#F59E0B' :
    score >= 25 ? '#F97316' : '#DC2626'

  const label =
    score >= 75 ? 'Excellent' :
    score >= 50 ? 'Moderate' :
    score >= 25 ? 'At Risk' : 'Critical'

  const labelColor =
    score >= 75 ? 'text-[var(--color-primary)]' :
    score >= 50 ? 'text-[var(--color-accent)]' :
    score >= 25 ? 'text-[var(--color-accent)]' : 'text-[var(--color-danger)]'

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={10}
          className="text-slate-100 dark:text-slate-800"
        />
        {/* Progress ring */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
            filter: `drop-shadow(0 0 8px ${color}66)`
          }}
        />
      </svg>
      <div className="-mt-[calc(var(--size)/2+16px)] flex flex-col items-center" style={{ marginTop: `-${size / 2 + 12}px` }}>
        <span className="text-3xl font-bold text-[var(--color-text-primary)] font-poppins leading-none">{score}</span>
        <span className={`text-xs font-semibold mt-1 ${labelColor}`}>{label}</span>
      </div>
    </div>
  )
}
