import { motion } from 'framer-motion'
import { clsx } from 'clsx'

export default function Card({ children, className = '', hover = false, glass = false, gradient = null, onClick }) {
  const base = `bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-none p-6`
  const hoverClass = hover ? 'card-hover cursor-pointer' : ''
  const glassClass = glass ? 'glass' : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={clsx(base, hoverClass, glassClass, className)}
      style={gradient ? { background: gradient } : undefined}
    >
      {children}
    </motion.div>
  )
}

export function CardHeader({ title, subtitle, icon: Icon, action, iconBg = 'bg-[var(--color-primary)]/15', iconColor = 'text-[var(--color-primary)]' }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
          {subtitle && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
