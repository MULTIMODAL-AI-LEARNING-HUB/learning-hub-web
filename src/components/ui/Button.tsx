import { forwardRef, type ButtonHTMLAttributes, type ReactNode, type ElementType } from 'react'
import { cn } from '../../utils/cn'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
  type?: 'button' | 'submit' | 'reset'
  fullWidth?: boolean
  as?: ElementType
}

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95 shadow-soft',
  secondary:
    'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
  outline:
    'border border-border bg-transparent text-foreground hover:bg-muted',
  ghost:
    'bg-transparent text-foreground hover:bg-muted',
  danger:
    'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-soft',
  gradient:
    'bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-95 shadow-glow'
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-9 px-4 text-sm rounded-lg gap-2',
  lg: 'h-11 px-6 text-sm rounded-xl gap-2',
  icon: 'h-9 w-9 rounded-lg gap-0'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      icon,
      iconRight,
      children,
      type = 'button',
      fullWidth = false,
      className = '',
      as: Component = 'button',
      ...rest
    },
    ref
  ) => {
    return (
      <Component
        ref={ref}
        type={Component === 'button' ? type : undefined}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-150',
          'active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...rest}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : icon ? (
          <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        ) : null}
        {children && <span className="truncate">{children}</span>}
        {iconRight && !loading && (
          <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{iconRight}</span>
        )}
      </Component>
    )
  }
)

Button.displayName = 'Button'