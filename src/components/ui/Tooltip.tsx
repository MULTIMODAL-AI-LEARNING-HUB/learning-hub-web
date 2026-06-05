import { type ReactNode, useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
}

export function Tooltip({ content, children, side = 'top', delay = 200, className }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null)
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect()
        setCoords({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        })
      }
      setOpen(true)
    }, delay)
  }, [delay])

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setOpen(false)
  }, [])

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return (
    <span
      ref={wrapperRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      className="inline-flex"
    >
      {children}
      {open && coords && typeof document !== 'undefined' &&
        createPortal(
          <div
            role="tooltip"
            className={cn(
              'pointer-events-none fixed z-[200] px-2 py-1 text-xs font-medium rounded-md',
              'bg-foreground text-background shadow-lift animate-fade-in',
              'whitespace-nowrap',
              className
            )}
            style={{
              left: `${coords.x}px`,
              top: side === 'top' ? `${coords.y - 28}px` : side === 'bottom' ? `${coords.y + 22}px` : `${coords.y}px`,
              transform: side === 'left' || side === 'right' ? 'translateY(-50%)' : 'translateX(-50%)'
            }}
          >
            {content}
          </div>,
          document.body
        )}
    </span>
  )
}
