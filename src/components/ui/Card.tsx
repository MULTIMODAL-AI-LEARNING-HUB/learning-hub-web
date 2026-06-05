import { type HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost'
  interactive?: boolean
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

export function Card({
  variant = 'default',
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl transition-all duration-200',
        variants[variant],
        interactive && 'cursor-pointer hover:shadow-lift hover:-translate-y-0.5 hover:border-primary/30',
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
      className={cn('px-5 py-4 border-b border-border', className)}
      {...rest}
    >
      {children}
    </div>
  )
}

function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5', className)} {...rest}>
      {children}
    </div>
  )
}

function CardFooter({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-5 py-3 border-t border-border bg-muted/30 rounded-b-2xl', className)}
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
