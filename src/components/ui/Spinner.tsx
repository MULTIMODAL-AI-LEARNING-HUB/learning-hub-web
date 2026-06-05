import { cn } from '../../utils/cn'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  label?: string
  className?: string
  fullscreen?: boolean
}

const sizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
  xl: 'h-12 w-12 border-4'
}

export function Spinner({ size = 'md', label, className = '', fullscreen = false }: SpinnerProps) {
  const spinner = (
    <span
      className={cn(
        'inline-block animate-spin rounded-full border-primary border-t-transparent',
        sizes[size],
        className
      )}
      role="status"
      aria-label={label || 'Loading'}
    />
  )

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          {spinner}
          {label && <p className="text-sm text-muted-foreground">{label}</p>}
        </div>
      </div>
    )
  }

  if (label) {
    return (
      <span className="inline-flex items-center gap-2.5 text-sm text-muted-foreground">
        {spinner}
        {label}
      </span>
    )
  }

  return spinner
}
