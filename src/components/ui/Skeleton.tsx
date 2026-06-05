import { type ReactNode, type HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  className?: string
}

const variants = {
  text: 'h-3 w-full rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-none',
  rounded: 'rounded-lg'
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  style,
  ...rest
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-muted relative overflow-hidden',
        variants[variant],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style
      }}
      aria-busy
      aria-live="polite"
      {...rest}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent animate-shimmer" />
    </div>
  )
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '60%' : '100%'}
          height={12}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ children }: { children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-5 space-y-3">
      <Skeleton variant="rounded" height={120} />
      {children ?? (
        <>
          <Skeleton variant="text" width="70%" height={16} />
          <SkeletonText lines={2} />
        </>
      )}
    </div>
  )
}
