import { useAppStore } from '../../stores/appStore'

const icons = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ'
}

const colors = {
  success: 'border-success/30 bg-success/5',
  error: 'border-danger/30 bg-danger/5',
  warning: 'border-warning/30 bg-warning/5',
  info: 'border-info/30 bg-info/5'
}

const iconColors = {
  success: 'text-success',
  error: 'text-danger',
  warning: 'text-warning',
  info: 'text-info'
}

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts.items)
  const remove = useAppStore((s) => s.toasts.remove)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lift animate-in slide-in-from-right ${colors[toast.type]}`}
        >
          <span className={`mt-0.5 text-lg ${iconColors[toast.type]}`}>{icons[toast.type]}</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">{toast.title}</p>
            {toast.message && <p className="mt-0.5 text-xs text-inkMute">{toast.message}</p>}
          </div>
          <button
            onClick={() => remove(toast.id)}
            className="text-inkMute transition hover:text-ink"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
