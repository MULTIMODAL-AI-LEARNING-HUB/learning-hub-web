import { useEffect, useState, useCallback } from 'react'
import {
  Search,
  ChevronRight,
  LogOut,
  User as UserIcon,
  Settings as SettingsIcon,
  HardDrive,
  Zap
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
import { NotificationsDropdown } from './NotificationsDropdown'

export function Header() {
  const navigate = useNavigate()
  const user = useAppStore((s) => s.auth.user)!
  const toggleSidebar = useAppStore((s) => s.ui.toggleSidebar)
  const notifications = useAppStore((s) => s.notifications.items)
  const unreadCount = useAppStore((s) => s.notifications.unreadCount)
  const fetchNotifs = useAppStore((s) => s.notifications.fetch)
  const markRead = useAppStore((s) => s.notifications.markRead)
  const markAllRead = useAppStore((s) => s.notifications.markAllRead)
  const dismissNotif = useAppStore((s) => s.notifications.dismiss)
  const clearNotifs = useAppStore((s) => s.notifications.clear)
  const logout = useAppStore((s) => s.auth.logout)
  const commandItems = useDefaultCommandItems()

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifs])

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

  const role = user?.role || 'student'
  const roleThemes = {
    admin: {
      bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-500/20',
      label: 'Admin'
    },
    lecturer: {
      bg: 'bg-violet-500/10 dark:bg-violet-500/20',
      text: 'text-violet-600 dark:text-violet-400',
      border: 'border-violet-500/20',
      label: 'Lecturer'
    },
    student: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-500/20',
      label: 'Student'
    }
  }[role as 'admin' | 'lecturer' | 'student'] || {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    border: 'border-blue-500/20',
    label: 'Student'
  }

  return (
    <>
      <header className="sticky top-0 z-30 mb-5 flex flex-col gap-3 rounded-xl border border-border bg-surface-elevated/90 px-3 py-3 shadow-soft backdrop-blur-md lg:flex-row lg:items-center lg:justify-between font-body">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden shrink-0"
            aria-label="Toggle sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </Button>

          {/* Logo & Role Brand */}
          <div className="hidden sm:flex items-center gap-2 mr-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Zap className="h-4.5 w-4.5 fill-current" />
            </div>
            <span className="text-sm font-bold text-foreground">Learning Hub</span>
            <span className={cn(
              "text-2xs font-medium px-2 py-0.5 rounded-full border",
              roleThemes.bg,
              roleThemes.text,
              roleThemes.border
            )}>
              {roleThemes.label}
            </span>
          </div>

          <button
            onClick={() => setPaletteOpen(true)}
            className={cn(
              'group flex h-9 w-full items-center gap-2.5 rounded-lg border border-input bg-surface px-3 text-sm text-muted-foreground transition',
              'hover:border-primary/30 hover:bg-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
              'lg:w-64'
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
            unreadCount={unreadCount}
            onDismiss={dismissNotif}
            onClear={clearNotifs}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}
          />

          <Dropdown
            align="right"
            menuClassName="w-56 p-1.5"
            trigger={
              <button
                className="flex items-center gap-2 rounded-md p-1 pr-2 hover:bg-muted transition"
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
              ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin Panel', icon: <SettingsIcon /> }] : []),
              { id: 'logout', label: 'Log out', icon: <LogOut />, danger: true }
            ]}
            onSelect={(id) => {
              if (id === 'profile') navigate(`/app/${role}/profile`)
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
