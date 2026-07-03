import { type ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

interface ModalProps {
  open: boolean
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  onClose?: () => void
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  hideClose?: boolean
  fullScreenOnMobile?: boolean
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-full'
}

export function Modal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  size = 'md',
  hideClose = false,
  fullScreenOnMobile = true
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      const onEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && onClose) onClose()
      }
      window.addEventListener('keydown', onEsc)
      return () => {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', onEsc)
      }
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative w-full border border-border bg-surface-elevated shadow-lift flex flex-col',
          fullScreenOnMobile
            ? 'h-full max-h-screen rounded-none sm:rounded-2xl sm:h-auto sm:max-h-[85vh]'
            : 'rounded-2xl sm:max-h-[85vh]',
          'animate-slide-in-from-bottom',
          sizes[size]
        )}
      >
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 px-6 pt-5 shrink-0">
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            {!hideClose && onClose && (
              <button
                onClick={onClose}
                className="shrink-0 -m-1 p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        <div className={cn('overflow-y-auto flex-1 min-h-0', title ? 'p-6 pt-4' : 'p-6')}>{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2 bg-muted/30 rounded-b-2xl shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
