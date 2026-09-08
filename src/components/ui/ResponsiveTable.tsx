import { type ReactNode, type HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface ResponsiveTableProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  containerClassName?: string
}

export function ResponsiveTable({
  children,
  className,
  containerClassName,
  ...rest
}: ResponsiveTableProps) {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-soft',
        containerClassName
      )}
      {...rest}
    >
      <div className={cn('w-full overflow-x-auto scrollbar-thin', className)}>
        {children}
      </div>
    </div>
  )
}
