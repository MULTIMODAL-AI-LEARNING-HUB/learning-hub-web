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

  // Quota comes from the login/me payload via mapApiUser. When quota is missing
  // (older sessions, failed /me refresh) keep pills hidden instead of showing "0%".
  const hasQuota = Boolean(user?.quota)
  const storageUsed = user?.quota?.storageUsed ?? 0
  const storageTotal = user?.quota?.storageTotal ?? 0
  const storageSafeTotal = storageTotal > 0 ? storageTotal : 1
  const storagePct = Math.min(100, Math.round((storageUsed / storageSafeTotal) * 100))
  const storageUsedLabel = storageUsed >= 1024 ? `${(storageUsed / 1024).toFixed(1)}GB` : `${storageUsed.toFixed(0)}MB`
  const storageTotalLabel = storageTotal >= 1024 ? `${(storageTotal / 1024).toFixed(0)}GB` : `${storageTotal}MB`

  const tokensUsed = user?.quota?.tokensUsed ?? 0
  const tokensTotal = user?.quota?.tokensTotal ?? 0
  const tokenSafeTotal = tokensTotal > 0 ? tokensTotal : 1
  const tokenPct = Math.min(100, Math.round((tokensUsed / tokenSafeTotal) * 100))
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
      label: 'Quản trị viên'
    },
    lecturer: {
      bg: 'bg-violet-500/10 dark:bg-violet-500/20',
      text: 'text-violet-600 dark:text-violet-400',
      border: 'border-violet-500/20',
      label: 'Giảng viên'
    },
    student: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-500/20',
      label: 'Học viên'
    }
  }[role as 'admin' | 'lecturer' | 'student'] || {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    border: 'border-blue-500/20',
    label: 'Học viên'
  }

  return (
    <>
      <header className="sticky top-0 z-30 mb-3 sm:mb-5 flex items-center gap-2 sm:gap-3 rounded-xl border border-border bg-surface-elevated/90 px-2.5 sm:px-3 py-2 sm:py-3 shadow-soft backdrop-blur-md font-body min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden shrink-0 h-9 w-9"
            aria-label="Mở đóng thanh bên"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </Button>

          {/* Logo & Role Brand — sidebar already shows branding on desktop,
              so keep this compact: icon + role only, never duplicate full logo */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Zap className="h-4.5 w-4.5 fill-current" />
            </div>
            <span className={cn(
              "text-2xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap",
              roleThemes.bg,
              roleThemes.text,
              roleThemes.border
            )}>
              {roleThemes.label}
            </span>
          </div>

          {/* Search: full bar on sm+, icon button on xs */}
          <button
            onClick={() => setPaletteOpen(true)}
            className={cn(
              'hidden xs:flex group h-9 w-full min-w-0 max-w-md flex-1 items-center gap-2.5 rounded-lg border border-input bg-surface px-3 text-sm text-muted-foreground transition',
              'hover:border-primary/30 hover:bg-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
            )}
            aria-label="Mở tìm kiếm nhanh"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left truncate">Tìm kiếm nhanh...</span>
            <kbd className="hidden items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-2xs font-mono lg:inline-flex">
              <span>⌘</span>K
            </kbd>
          </button>
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex xs:hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-input bg-surface text-muted-foreground transition hover:border-primary/30"
            aria-label="Mở tìm kiếm nhanh"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2 justify-end shrink-0">
          {hasQuota && (
            <div className="hidden lg:flex items-center gap-2">
              <Tooltip
                content={
                  <div className="space-y-1 text-left text-xs p-0.5">
                    <p className="font-semibold text-foreground">Dung lượng lưu trữ</p>
                    <p className="text-2xs text-muted-foreground">
                      Đã dùng: <span className="font-medium text-foreground">{storageUsedLabel}</span> / {storageTotalLabel} ({storagePct}%)
                    </p>
                    <p className="text-2xs text-emerald-500 font-medium">
                      Còn trống: {storageTotal > storageUsed ? (storageTotal - storageUsed >= 1024 ? `${((storageTotal - storageUsed)/1024).toFixed(1)}GB` : `${Math.round(storageTotal - storageUsed)}MB`) : '0MB'}
                    </p>
                  </div>
                }
              >
                <div className="flex items-center gap-1.5 rounded-lg border border-input bg-surface/80 px-2.5 py-1.5 hover:bg-muted/40 transition">
                  <HardDrive className="h-3.5 w-3.5 text-primary" />
                  <span className="text-2xs font-medium text-foreground tabular-nums">
                    {storageUsed === 0 ? `${storageTotalLabel} trống` : `${storageUsedLabel} / ${storageTotalLabel}`}
                  </span>
                </div>
              </Tooltip>
              <Tooltip
                content={
                  <div className="space-y-1 text-left text-xs p-0.5">
                    <p className="font-semibold text-foreground">Hạn mức Token AI</p>
                    <p className="text-2xs text-muted-foreground">
                      Đã dùng: <span className="font-medium text-foreground">{tokensUsedLabel}</span> / {tokensTotalLabel} ({tokenPct}%)
                    </p>
                    <p className="text-2xs text-purple-500 font-medium">
                      Khả dụng: {tokensTotal > tokensUsed ? (tokensTotal - tokensUsed >= 1000 ? `${Math.round((tokensTotal - tokensUsed)/1000)}k` : `${tokensTotal - tokensUsed}`) : '0'} tokens
                    </p>
                  </div>
                }
              >
                <div className="flex items-center gap-1.5 rounded-lg border border-input bg-surface/80 px-2.5 py-1.5 hover:bg-muted/40 transition">
                  <Zap className="h-3.5 w-3.5 text-purple-500 fill-purple-500/20" />
                  <span className="text-2xs font-medium text-foreground tabular-nums">
                    {tokensUsed === 0 ? `${tokensTotalLabel} AI` : `${tokensUsedLabel} / ${tokensTotalLabel}`}
                  </span>
                </div>
              </Tooltip>
            </div>
          )}

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
                aria-label="Menu tài khoản"
              >
                <Avatar fallback={user.initials} size="sm" />
                <span className="hidden md:block text-sm font-medium text-foreground">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronRight className="hidden md:block h-3.5 w-3.5 text-muted-foreground -rotate-90" />
              </button>
            }
            items={[
              { id: 'profile', label: 'Hồ sơ cá nhân', icon: <UserIcon /> },
              ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Bảng quản trị', icon: <SettingsIcon /> }] : []),
              { id: 'logout', label: 'Đăng xuất', icon: <LogOut />, danger: true }
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
