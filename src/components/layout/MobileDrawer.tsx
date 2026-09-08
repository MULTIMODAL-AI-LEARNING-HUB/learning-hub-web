import { type ReactNode, useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  side?: 'left' | 'right'
  title?: string
  showCloseButton?: boolean
}

export function MobileDrawer({
  open,
  onClose,
  children,
  side = 'left',
  title,
  showCloseButton = true,
}: MobileDrawerProps) {
  const location = useLocation()
  const prevPathRef = useRef(location.pathname)

  // Auto-close on route change
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname
      if (open) onClose()
    }
  }, [location.pathname, open, onClose])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-foreground/45 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          'absolute top-0 h-full w-[82vw] max-w-xs border-r border-border bg-surface-elevated shadow-lift safe-top safe-bottom',
          side === 'left' ? 'left-0 animate-slide-in-from-left' : 'right-0 animate-slide-in-from-right'
        )}
      >
        <div className="flex h-full flex-col">
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
              {title ? (
                <h2 className="text-sm font-bold text-foreground">{title}</h2>
              ) : (
                <span className="text-xs font-semibold text-muted-foreground">Menu điều hướng</span>
              )}
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
                aria-label="Đóng thanh điều hướng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
