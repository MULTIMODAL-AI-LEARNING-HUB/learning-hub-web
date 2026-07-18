import { cn } from '../../utils/cn'

interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'outline'
  label: string
  dot?: boolean
  className?: string
}

const variants = {
  default: 'bg-muted text-muted-foreground ring-1 ring-border',
  primary: 'bg-primary/10 text-primary ring-1 ring-primary/20',
  success: 'bg-success/10 text-success ring-1 ring-success/20',
  warning: 'bg-warning/15 text-warning ring-1 ring-warning/25',
  error: 'bg-destructive/10 text-destructive ring-1 ring-destructive/20',
  info: 'bg-info/10 text-info ring-1 ring-info/20',
  outline: 'border border-border text-foreground/80 bg-transparent'
}

const dotColors = {
  default: 'bg-foreground/40',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-destructive',
  info: 'bg-info',
  outline: 'bg-foreground/40'
}

export function Badge({ variant = 'default', label, dot = false, className = '' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        variants[variant],
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant])} />}
      {label}
    </span>
  )
}
