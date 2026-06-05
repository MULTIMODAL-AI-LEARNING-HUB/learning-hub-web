import { cn } from '../../utils/cn'

interface ProgressProps {
  value: number
  showLabel?: boolean
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  indeterminate?: boolean
  className?: string
}

const barColors = {
  default: 'bg-primary',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive'
}

const heights = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2.5'
}

export function Progress({
  value,
  showLabel = false,
  variant = 'default',
  size = 'md',
  indeterminate = false,
  className = ''
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={cn('flex items-center gap-3 w-full', className)}>
      <div
        className={cn(
          'flex-1 overflow-hidden rounded-full bg-muted relative',
          heights[size]
        )}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {indeterminate ? (
          <div
            className={cn(
              'absolute inset-y-0 left-0 w-1/3 rounded-full animate-shimmer',
              barColors[variant]
            )}
            style={{ backgroundSize: '200% 100%' }}
          />
        ) : (
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              barColors[variant]
            )}
            style={{ width: `${clamped}%` }}
          />
        )}
      </div>
      {showLabel && !indeterminate && (
        <span className="text-xs font-medium text-muted-foreground tabular-nums w-9 text-right">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  )
}
