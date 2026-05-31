interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  label: string
  className?: string
}

const variants = {
  default: 'bg-surfaceDeep text-inkMute',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info'
}

export function Badge({ variant = 'default', label, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${variants[variant]} ${className}`}
    >
      {label}
    </span>
  )
}
