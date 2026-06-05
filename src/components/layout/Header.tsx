import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Search,
  Bell,
  ChevronRight,
  LogOut,
  User as UserIcon,
  Settings as SettingsIcon,
  HardDrive,
  Zap,
  X
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Tooltip } from '../ui/Tooltip'
import { Dropdown } from '../ui/Dropdown'
import { ThemeToggle } from '../ui/ThemeToggle'
import { CommandPalette } from '../ui/Command'
import { useDefaultCommandItems } from '../ui/command-items'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../utils/cn'

export function Header() {
  const navigate = useNavigate()
  const user = useAppStore((s) => s.auth.user)
  const toggleSidebar = useAppStore((s) => s.ui.toggleSidebar)
  const notifications = useAppStore((s) => s.notifications.items)
  const dismissNotif = useAppStore((s) => s.notifications.dismiss)
  const clearNotifs = useAppStore((s) => s.notifications.clear)
  const logout = useAppStore((s) => s.auth.logout)
  const commandItems = useDefaultCommandItems()

  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen((p) => !p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const storageUsed = user?.quota?.storageUsed ?? 0
  const storageTotal = user?.quota?.storageTotal ?? 1024
  const storagePct = Math.min(100, Math.round((storageUsed / storageTotal) * 100))
  const storageUsedLabel = storageUsed >= 1024 ? `${(storageUsed / 1024).toFixed(1)}GB` : `${storageUsed.toFixed(0)}MB`
  const storageTotalLabel = storageTotal >= 1024 ? `${(storageTotal / 1024).toFixed(0)}GB` : `${storageTotal}MB`

  const tokensUsed = user?.quota?.tokensUsed ?? 0
  const tokensTotal = user?.quota?.tokensTotal ?? 50000
  const tokenPct = Math.min(100, Math.round((tokensUsed / tokensTotal) * 100))
  const tokensUsedLabel = tokensUsed >= 1000 ? `${(tokensUsed / 1000).toFixed(1)}k` : `${tokensUsed}`
  const tokensTotalLabel = tokensTotal >= 1000 ? `${(tokensTotal / 1000).toFixed(0)}k` : `${tokensTotal}`

  const handleLogout = useCallback(() => {
    logout()
    navigate('/login')
  }, [logout, navigate])

  return (
    <>
      <header className="sticky top-0 z-30 mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-surface-elevated/80 px-4 py-3 shadow-soft backdrop-blur-md lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden"
            aria-label="Toggle sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </Button>
          <button
            onClick={() => setPaletteOpen(true)}
            className={cn(
              'group flex h-9 w-full items-center gap-2.5 rounded-lg border border-input bg-surface px-3 text-sm text-muted-foreground transition',
              'hover:border-primary/30 hover:bg-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
              'lg:w-72 lg:max-w-sm'
            )}
            aria-label="Open search"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left truncate">Search or jump to...</span>
            <kbd className="hidden items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-2xs font-mono sm:inline-flex">
              <span>⌘</span>K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2">
            <Tooltip
              content={
                <div className="space-y-1 text-left">
                  <p className="font-semibold">Storage</p>
                  <p className="text-2xs opacity-80">{storageUsedLabel} / {storageTotalLabel}</p>
                </div>
              }
            >
              <div className="flex items-center gap-1.5 rounded-lg border border-input bg-surface px-2.5 py-1.5">
                <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-2xs font-medium text-foreground tabular-nums">
                  {storagePct}%
                </span>
              </div>
            </Tooltip>
            <Tooltip
              content={
                <div className="text-left">
                  <p className="font-semibold">AI Tokens</p>
                  <p className="text-2xs opacity-80">{tokensUsedLabel} / {tokensTotalLabel} used</p>
                </div>
              }
            >
              <div className="flex items-center gap-1.5 rounded-lg border border-input bg-surface px-2.5 py-1.5">
                <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-2xs font-medium text-foreground tabular-nums">
                  {tokenPct}%
                </span>
              </div>
            </Tooltip>
          </div>

          <ThemeToggle />
          <NotificationsDropdown
            notifications={notifications}
            onDismiss={dismissNotif}
            onClear={clearNotifs}
          />

          <Dropdown
            align="right"
            menuClassName="w-56 p-1.5"
            trigger={
              <button
                className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-muted transition"
                aria-label="User menu"
              >
                <Avatar fallback={user.initials} size="sm" />
                <span className="hidden md:block text-sm font-medium text-foreground">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronRight className="hidden md:block h-3.5 w-3.5 text-muted-foreground -rotate-90" />
              </button>
            }
            items={[
              { id: 'profile', label: 'Profile', icon: <UserIcon /> },
              { id: 'admin', label: 'Admin Panel', icon: <SettingsIcon /> },
              { id: 'logout', label: 'Log out', icon: <LogOut />, danger: true }
            ]}
            onSelect={(id) => {
              if (id === 'profile') navigate('/app/documents')
              if (id === 'admin') navigate('/app/admin')
              if (id === 'logout') handleLogout()
            }}
          />
        </div>
      </header>

      <CommandPalette
        items={commandItems}
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
    </>
  )
}

function NotificationsDropdown({
  notifications,
  onDismiss,
  onClear
}: {
  notifications: Array<{ id: string; title: string; detail: string; time: string }>
  onDismiss: (id: string) => void
  onClear: () => void
}) {
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
        className="relative"
        aria-label="Notifications"
        onClick={() => setOpen((p) => !p)}
      >
        <Bell className="h-4 w-4" />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-destructive">
            <span className="absolute inset-0 rounded-full bg-destructive animate-ping opacity-75" />
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
            {notifications.length > 0 && (
              <button
                onClick={onClear}
                className="text-xs font-medium text-primary hover:underline"
              >
                Clear all
              </button>
            )}
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
                    className="group flex items-start gap-2.5 rounded-lg px-2.5 py-2 hover:bg-muted transition"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.detail}</p>
                      <p className="mt-0.5 text-2xs text-muted-foreground/70">{n.time}</p>
                    </div>
                    <button
                      onClick={() => onDismiss(n.id)}
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
