import { type HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost'
  interactive?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'responsive'
}

const variants = {
  default:
    'border border-border bg-surface-elevated shadow-soft',
  elevated:
    'border border-border bg-surface-elevated shadow-lift',
  outlined:
    'border border-border bg-transparent',
  ghost:
    'bg-surface border border-transparent'
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
  responsive: 'p-3 sm:p-4 lg:p-5'
}

export function Card({
  variant = 'default',
  interactive = false,
  padding,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-150',
        variants[variant],
        padding && paddings[padding],
        interactive && 'cursor-pointer hover:shadow-lift hover:border-primary/30',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

function CardHeader({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-4 sm:px-5 py-3 sm:py-4 border-b border-border', className)}
      {...rest}
    >
      {children}
    </div>
  )
}

function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-4 sm:p-5', className)} {...rest}>
      {children}
    </div>
  )
}

function CardFooter({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-4 sm:px-5 py-3 border-t border-border bg-muted/30 rounded-b-xl', className)}
      {...rest}
    >
      {children}
    </div>
  )
}

function CardTitle({ className, children, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('font-display text-base font-semibold text-foreground', className)}
      {...rest}
    >
      {children}
    </h3>
  )
}

function CardDescription({ className, children, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-muted-foreground mt-1', className)} {...rest}>
      {children}
    </p>
  )
}

export { CardHeader, CardBody, CardFooter, CardTitle, CardDescription }
