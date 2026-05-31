interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8'
}

export function Spinner({ size = 'md', label, className = '' }: SpinnerProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`animate-spin rounded-full border-2 border-accent border-t-transparent ${sizes[size]}`}
      />
      {label && <span className="text-sm text-inkMute">{label}</span>}
    </span>
  )
}
