import { useEffect, useState, useRef } from 'react'
import { Bell, X } from 'lucide-react'
import { Button } from '../ui/Button'

export interface NotificationItem {
  id: string
  title: string
  detail: string
  time: string
  isRead: boolean
}

export interface NotificationsDropdownProps {
  notifications: NotificationItem[]
  unreadCount: number
  onDismiss: (id: string) => void
  onClear: () => void
  onMarkRead: (id: string) => Promise<void>
  onMarkAllRead: () => Promise<void>
}

export function NotificationsDropdown({
  notifications,
  unreadCount,
  onDismiss,
  onClear,
  onMarkRead,
  onMarkAllRead,
}: NotificationsDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="relative text-muted-foreground hover:text-foreground"
        aria-label="Notifications"
        onClick={() => setOpen((p) => !p)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-2xs font-bold text-destructive-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-surface-elevated p-1.5 shadow-lift animate-slide-in-from-top"
        >
          <div className="flex items-center justify-between px-2.5 py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notifications
            </p>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={onMarkAllRead} className="text-xs font-medium text-primary hover:underline">
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={onClear} className="text-xs font-medium text-muted-foreground hover:text-foreground">
                  Clear all
                </button>
              )}
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-sm text-muted-foreground">No notifications</p>
                <p className="text-xs text-muted-foreground/70 mt-1">You're all caught up</p>
              </div>
            ) : (
              <div className="grid gap-0.5 p-0.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => { if (!n.isRead) onMarkRead(n.id) }}
                    className={`group flex items-start gap-2.5 rounded-lg px-2.5 py-2 hover:bg-muted transition cursor-pointer ${n.isRead ? '' : 'bg-muted/50'}`}
                  >
                    {!n.isRead && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                    {n.isRead && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-transparent" />}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${n.isRead ? 'text-muted-foreground' : 'font-medium text-foreground'}`}>{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.detail}</p>
                      <p className="mt-0.5 text-2xs text-muted-foreground/70">{n.time}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDismiss(n.id) }}
                      className="shrink-0 -m-1 p-1 rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition"
                      aria-label="Dismiss"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
