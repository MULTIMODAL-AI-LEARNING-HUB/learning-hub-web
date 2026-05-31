interface ProgressProps {
  value: number
  showLabel?: boolean
  variant?: 'default' | 'accent'
  className?: string
}

const barColors = {
  default: 'bg-info',
  accent: 'bg-accent'
}

export function Progress({ value, showLabel = false, variant = 'accent', className = '' }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surfaceDeep">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColors[variant]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && <span className="text-xs text-inkMute">{Math.round(clamped)}%</span>}
    </div>
  )
}
