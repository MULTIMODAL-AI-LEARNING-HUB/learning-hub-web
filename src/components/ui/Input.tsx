import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  prefixIcon?: ReactNode
  suffixIcon?: ReactNode
  error?: string
  hint?: string
  onChange?: (value: string) => void
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = 'text',
      placeholder,
      value,
      onChange,
      prefixIcon,
      suffixIcon,
      error,
      hint,
      disabled,
      className = '',
      onKeyDown,
      ...rest
    },
    ref
  ) => {
    return (
      <div className="grid gap-1.5 w-full">
        <div className="relative">
          {prefixIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">
              {prefixIcon}
            </span>
          )}
          <input
            ref={ref}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={disabled}
            className={cn(
              'h-10 w-full rounded-md border border-input bg-surface-elevated px-3 text-sm text-foreground shadow-sm',
              'placeholder:text-muted-foreground/70 transition',
              'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              prefixIcon && 'pl-9',
              suffixIcon && 'pr-9',
              error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
              className
            )}
            {...rest}
          />
          {suffixIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">
              {suffixIcon}
            </span>
          )}
        </div>
        {(error || hint) && (
          <p
            className={cn(
              'text-xs',
              error ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {error || hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, {
  placeholder?: string
  value?: string
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>
  error?: string
  disabled?: boolean
  rows?: number
  className?: string
  onKeyDown?: (e: React.KeyboardEvent) => void
}>(function Textarea({
  placeholder,
  value,
  onChange,
  error,
  disabled,
  rows = 4,
  className = '',
  onKeyDown,
}: {
  placeholder?: string
  value?: string
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>
  error?: string
  disabled?: boolean
  rows?: number
  className?: string
  onKeyDown?: (e: React.KeyboardEvent) => void
}) {
  return (
    <div className="grid gap-1.5 w-full">
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        disabled={disabled}
        rows={rows}
        className={cn(
          'w-full rounded-md border border-input bg-surface-elevated px-3 py-2.5 text-sm text-foreground shadow-sm',
          'placeholder:text-muted-foreground/70 transition resize-none',
          'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
          className
        )}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
})

Textarea.displayName = 'Textarea'
