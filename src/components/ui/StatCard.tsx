import { type ReactNode } from 'react'
import { Card } from '../ui/Card'
import { cn } from '../../utils/cn'

interface StatCardProps {
  label: string
  value: number | string
  icon: ReactNode
  trend?: { value: number; positive: boolean }
  loading?: boolean
  variant?: 'default' | 'primary' | 'success' | 'warning'
  className?: string
}

const iconVariants = {
  default: 'bg-muted text-muted-foreground ring-1 ring-border',
  primary: 'bg-primary/10 text-primary ring-1 ring-primary/20',
  success: 'bg-success/10 text-success ring-1 ring-success/20',
  warning: 'bg-warning/15 text-warning ring-1 ring-warning/25'
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  loading = false,
  variant = 'default',
  className
}: StatCardProps) {
  return (
    <Card className={cn('p-5 hover:shadow-lift transition-all duration-150 border-border bg-surface-elevated', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl [&>svg]:h-4.5 [&>svg]:w-4.5',
            iconVariants[variant]
          )}
        >
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        {loading ? (
          <div className="h-8 w-16 rounded bg-muted animate-pulse" />
        ) : (
          <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {value}
          </span>
        )}
        {trend && (
          <span
            className={cn(
              'text-2xs font-bold px-1.5 py-0.5 rounded-full',
              trend.positive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            )}
          >
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </Card>
  )
}
