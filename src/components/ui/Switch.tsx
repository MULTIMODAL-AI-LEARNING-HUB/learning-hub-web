import * as React from 'react'
import { cn } from '../../utils/cn'

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, onChange, ...props }, ref) => {
    return (
      <label className="relative inline-flex h-6 w-11 items-center cursor-pointer">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={(e) => {
            onChange?.(e)
            onCheckedChange?.(e.target.checked)
          }}
          className="sr-only"
          {...props}
        />
        <div
          className={cn(
            'h-6 w-11 rounded-full transition-colors',
            checked ? 'bg-primary' : 'bg-muted',
            className
          )}
        >
          <div
            className={cn(
              'h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform',
              checked ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </div>
      </label>
    )
  }
)

Switch.displayName = 'Switch'