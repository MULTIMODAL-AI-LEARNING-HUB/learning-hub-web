import { forwardRef } from 'react'

interface InputProps {
  type?: 'text' | 'email' | 'password' | 'search' | 'number'
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  error?: string
  disabled?: boolean
  className?: string
  onKeyDown?: (e: React.KeyboardEvent) => void
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ type = 'text', placeholder, value, onChange, error, disabled, className = '', onKeyDown }, ref) => {
    return (
      <div className="grid gap-1.5">
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          className={`w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-inkMute/60 focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50 ${
            error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''
          } ${className}`}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
