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
  default: 'bg-muted text-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning'
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
    <Card className={cn('p-5', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg [&>svg]:h-5 [&>svg]:w-5',
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
          <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {value}
          </span>
        )}
        {trend && (
          <span
            className={cn(
              'text-xs font-semibold',
              trend.positive ? 'text-success' : 'text-destructive'
            )}
          >
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </Card>
  )
}
