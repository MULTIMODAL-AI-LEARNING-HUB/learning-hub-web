import { type ReactNode, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  side?: 'left' | 'right'
  title?: string
}

export function MobileDrawer({
  open,
  onClose,
  children,
  side = 'left',
  title,
}: MobileDrawerProps) {
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
    <div className="fixed inset-0 z-40 lg:hidden">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          'absolute top-0 h-full w-72 border-r border-border bg-surface-elevated shadow-lift safe-top safe-bottom',
          side === 'left' ? 'left-0 animate-slide-in-from-left' : 'right-0 animate-slide-in-from-right'
        )}
      >
        <div className="flex h-full flex-col">
          {title && (
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">{title}</h2>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
                aria-label="Close drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
