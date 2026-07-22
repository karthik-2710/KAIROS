export default function Badge({ label, variant = 'default', size = 'sm', dot = false }) {
  const variants = {
    default:  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    success:  'bg-[var(--color-primary)]/15 text-[var(--color-primary)] dark:bg-[var(--color-primary)]/30 dark:text-[var(--color-primary)]',
    warning:  'bg-[var(--color-accent)]/15 text-[var(--color-accent)] dark:bg-[var(--color-accent)]/30 dark:text-[var(--color-accent)]',
    danger:   'bg-[var(--color-danger)]/15 text-[var(--color-danger)] dark:bg-[var(--color-danger)]/30 dark:text-[var(--color-danger)]',
    info:     'bg-[var(--color-secondary)]/15 text-[var(--color-secondary)] dark:bg-[var(--color-secondary)]/30 dark:text-[var(--color-secondary)]',
    purple:   'bg-[var(--color-secondary)]/15 text-[var(--color-secondary)] dark:bg-[var(--color-secondary)]/30 dark:text-[var(--color-secondary)]',
  }
  const dotColors = {
    default: 'bg-slate-400', success: 'bg-[var(--color-primary)]',
    warning: 'bg-[var(--color-accent)]', danger: 'bg-[var(--color-danger)]',
    info: 'bg-[var(--color-secondary)]', purple: 'bg-[var(--color-secondary)]',
  }
  const sizes = { sm: 'text-xs px-2.5 py-1', md: 'text-sm px-3 py-1.5' }

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full ${variants[variant]} ${sizes[size]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {label}
    </span>
  )
}
