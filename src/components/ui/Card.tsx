import { type ReactNode } from 'react'

interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined'
  padding?: string
  children: ReactNode
  onClick?: () => void
  className?: string
}

const variants = {
  default: 'border border-border bg-panel shadow-soft',
  elevated: 'border border-border bg-panel shadow-lift',
  outlined: 'border border-border bg-transparent'
}

export function Card({
  variant = 'default',
  padding = 'p-4',
  children,
  onClick,
  className = ''
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl ${padding} ${variants[variant]} transition-all duration-150 ${
        onClick ? 'cursor-pointer hover:shadow-lift hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
