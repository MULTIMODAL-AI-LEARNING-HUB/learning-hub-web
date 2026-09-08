import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeOff, CircleAlert } from 'lucide-react'
import { cn } from '../../utils/cn'

interface AuthInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  prefixIcon?: ReactNode
  error?: string
  hint?: string
  onChange?: (value: string) => void
  label?: string
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  (
    {
      type = 'text',
      placeholder,
      value,
      onChange,
      prefixIcon,
      error,
      hint,
      label,
      disabled,
      required,
      className = '',
      ...rest
    },
    ref
  ) => {
    const generatedId = useId()
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type
    const inputId = rest.id ?? generatedId
    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

    return (
      <div className="grid w-full gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-foreground"
          >
            {label}
            {required && (
              <span aria-hidden="true" className="ml-1 text-destructive">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          {prefixIcon && (
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">
              {prefixIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              'h-12 w-full rounded-xl border border-input bg-surface-elevated pl-3.5 pr-3.5 text-[15px] text-foreground',
              'placeholder:text-muted-foreground/60 transition-all duration-200',
              'hover:border-foreground/25',
              'focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              prefixIcon && 'pl-10',
              isPassword && 'pr-11',
              error &&
                'border-destructive/60 focus:border-destructive focus:ring-destructive/15',
              className
            )}
            {...rest}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              aria-pressed={showPassword}
              tabIndex={-1}
              className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {error ? (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="flex items-start gap-1.5 text-[13px] font-medium leading-snug text-destructive"
          >
            <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="text-[13px] leading-snug text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
    )
  }
)

AuthInput.displayName = 'AuthInput'
