import { forwardRef, type ButtonHTMLAttributes, type ReactNode, type ElementType } from 'react'
import { cn } from '../../utils/cn'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: Variant
  size?: Size
  responsiveSize?: boolean
  loading?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
  type?: 'button' | 'submit' | 'reset'
  fullWidth?: boolean
  fullWidthMobile?: boolean
  as?: ElementType
}

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-foreground hover:bg-primary/95 border border-primary/10 shadow-soft hover:shadow-[0_6px_16px_-4px_rgba(99,102,241,0.3)] dark:hover:shadow-[0_6px_20px_-2px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200',
  secondary:
    'bg-secondary/60 backdrop-blur-sm text-secondary-foreground hover:bg-secondary/90 border border-border/80 shadow-sm hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_4px_16px_-2px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200',
  outline:
    'border border-border/85 bg-transparent text-foreground hover:bg-muted/80 hover:border-foreground/15 shadow-sm hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200',
  ghost:
    'bg-transparent text-foreground hover:bg-muted/50 dark:hover:bg-muted/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200',
  danger:
    'bg-destructive text-destructive-foreground hover:bg-destructive/95 border border-destructive/10 shadow-soft hover:shadow-[0_6px_16px_-4px_rgba(239,68,68,0.3)] dark:hover:shadow-[0_6px_20px_-2px_rgba(239,68,68,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200',
  gradient:
    'bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] text-primary-foreground shadow-glow hover:bg-[position:right_center] hover:shadow-[0_8px_24px_-4px_rgba(139,92,246,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300'
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
      responsiveSize = false,
      disabled = false,
      loading = false,
      icon,
      iconRight,
      children,
      type = 'button',
      fullWidth = false,
      fullWidthMobile = false,
      className = '',
      as: Component = 'button',
      ...rest
    },
    ref
  ) => {
    const sizeClasses = responsiveSize
      ? 'h-8 px-3 text-xs rounded-lg gap-1.5 sm:h-9 sm:px-4 sm:text-sm sm:rounded-lg sm:gap-2'
      : sizes[size]

    return (
      <Component
        ref={ref}
        type={Component === 'button' ? type : undefined}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200 ease-out',
          'active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:translate-y-0 disabled:hover:shadow-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
          variants[variant],
          sizeClasses,
          fullWidth && 'w-full',
          fullWidthMobile && 'w-full sm:w-auto',
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