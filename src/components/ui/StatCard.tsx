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
  default: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20',
  primary: 'bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20',
  success: 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20',
  warning: 'bg-gradient-to-br from-amber-500/10 to-yellow-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20'
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
    <Card className={cn('p-5 hover:shadow-lift transition-all duration-200 border-border/60 hover:-translate-y-0.5 bg-surface-elevated/80 backdrop-blur-sm', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
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
          <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
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
