import { useMemo } from 'react'
import { cn } from '../../utils/cn'

interface PasswordStrengthProps {
  password: string
}

interface StrengthLevel {
  score: number
  label: string
  colorClass: string
  barClass: string
}

function evaluate(password: string): StrengthLevel {
  if (!password) {
    return { score: 0, label: '', colorClass: '', barClass: 'bg-border' }
  }

  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1

  if (score <= 1) {
    return {
      score,
      label: 'Yếu — nên dài hơn và thêm ký tự đặc biệt',
      colorClass: 'text-destructive',
      barClass: 'bg-destructive'
    }
  }
  if (score <= 3) {
    return {
      score,
      label: 'Trung bình — thêm chữ hoa, số hoặc ký tự đặc biệt',
      colorClass: 'text-warning',
      barClass: 'bg-warning'
    }
  }
  return {
    score,
    label: 'Mạnh — mật khẩu tốt, khó đoán',
    colorClass: 'text-success',
    barClass: 'bg-success'
  }
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const level = useMemo(() => evaluate(password), [password])

  if (!password) return null

  const filledBars = Math.min(Math.max(level.score, 1), 4)

  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              bar <= filledBars ? level.barClass : 'bg-border'
            )}
          />
        ))}
      </div>
      <p className={cn('text-[13px] font-medium leading-snug', level.colorClass)}>
        Mức độ bảo mật: {level.label}
      </p>
    </div>
  )
}
