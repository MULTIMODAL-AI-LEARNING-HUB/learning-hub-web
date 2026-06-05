import { type ReactNode } from 'react'
import { Badge } from './Badge'
import { cn } from '../../utils/cn'

interface ServiceCardProps {
  name: string
  description: string
  icon: ReactNode
  status: 'healthy' | 'degraded' | 'offline' | string
  className?: string
}

const statusVariant: Record<string, 'success' | 'warning' | 'error'> = {
  healthy: 'success',
  online: 'success',
  ok: 'success',
  degraded: 'warning',
  slow: 'warning',
  offline: 'error',
  error: 'error',
  down: 'error'
}

export function ServiceCard({ name, description, icon, status, className }: ServiceCardProps) {
  const variant = statusVariant[status.toLowerCase()] ?? 'error'
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-4 transition hover:border-primary/30',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-elevated [&>svg]:h-5 [&>svg]:w-5 text-foreground">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{name}</p>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
      </div>
      <Badge variant={variant} label={status} dot />
    </div>
  )
}
