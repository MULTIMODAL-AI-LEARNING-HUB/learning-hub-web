import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useAppStore } from '../../stores/appStore'
import type { ToastItem } from '../../types'

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
}

const containerColors = {
  success: 'border-success/30 bg-surface-elevated',
  error: 'border-destructive/30 bg-surface-elevated',
  warning: 'border-warning/30 bg-surface-elevated',
  info: 'border-info/30 bg-surface-elevated'
}

const iconColors = {
  success: 'text-success',
  error: 'text-destructive',
  warning: 'text-warning',
  info: 'text-info'
}

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts.items)
  const remove = useAppStore((s) => s.toasts.remove)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast: ToastItem) => {
        const Icon = icons[toast.type]
        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lift animate-slide-in-from-right',
              containerColors[toast.type]
            )}
            role="status"
          >
            <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', iconColors[toast.type])} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{toast.title}</p>
              {toast.message && (
                <p className="mt-0.5 text-xs text-muted-foreground">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => remove(toast.id)}
              className="shrink-0 -m-1 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
