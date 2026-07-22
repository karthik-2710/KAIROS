import { Loader2 } from 'lucide-react'

export default function Button({
  children, onClick, type = 'button', variant = 'primary',
  size = 'md', loading = false, disabled = false,
  icon: Icon, iconRight = false, className = '', fullWidth = false
}) {
  const variants = {
    primary:   'bg-[var(--color-primary)] hover:bg-[var(--color-primary)] text-white shadow-none ',
    secondary: 'bg-[var(--color-secondary)] hover:bg-[var(--color-secondary)] text-white shadow-none ',
    outline:   'border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-bg)] text-[var(--color-text-primary)]',
    ghost:     'bg-transparent hover:bg-[var(--color-bg)] text-[var(--color-text-secondary)]',
    danger:    'bg-[var(--color-danger)] hover:bg-[var(--color-danger)] text-white',
  }
  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150
        ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-60 cursor-not-allowed' : 'active:scale-[0.97]'}
        ${className}`}
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : Icon && !iconRight && <Icon className="w-4 h-4" />
      }
      {children}
      {Icon && iconRight && !loading && <Icon className="w-4 h-4" />}
    </button>
  )
}
