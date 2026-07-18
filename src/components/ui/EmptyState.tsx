import { type ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  illustration?: ReactNode
  className?: string
  compact?: boolean
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  illustration,
  className,
  compact = false
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        'rounded-xl border border-dashed border-border bg-muted/25',
        className
      )}
    >
      {illustration ? (
        <div className={cn('mb-4', !compact && 'scale-110')}>{illustration}</div>
      ) : icon ? (
        <div
          className={cn(
            'mb-4 flex items-center justify-center rounded-xl bg-primary/10 text-primary',
            compact ? 'h-12 w-12 [&>svg]:h-6 [&>svg]:w-6' : 'h-16 w-16 [&>svg]:h-8 [&>svg]:w-8'
          )}
        >
          {icon}
        </div>
      ) : null}
      <h3
        className={cn(
          'font-display font-semibold text-foreground',
          compact ? 'text-sm' : 'text-base'
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            'mt-1 max-w-sm text-muted-foreground',
            compact ? 'text-xs' : 'text-sm'
          )}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
