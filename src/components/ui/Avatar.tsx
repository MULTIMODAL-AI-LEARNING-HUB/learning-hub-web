import { cn } from '../../utils/cn'

interface AvatarProps {
  src?: string
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fallback?: string
  status?: 'online' | 'offline' | 'busy' | null
  className?: string
}

const sizes = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl'
}

const statusColors = {
  online: 'bg-success',
  offline: 'bg-muted-foreground',
  busy: 'bg-destructive'
}

export function Avatar({ src, alt, size = 'md', fallback = '?', status = null, className = '' }: AvatarProps) {
  const baseClasses = cn(
    'relative inline-flex items-center justify-center rounded-full overflow-hidden font-semibold text-primary-foreground bg-gradient-to-br from-primary to-accent shrink-0',
    sizes[size],
    className
  )

  return (
    <span className={baseClasses}>
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span className="select-none">{fallback}</span>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-surface-elevated',
            statusColors[status]
          )}
        />
      )}
    </span>
  )
}
