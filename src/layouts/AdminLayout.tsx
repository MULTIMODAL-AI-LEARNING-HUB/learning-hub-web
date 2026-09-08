import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Home,
  Users,
  BookOpen,
  Layers,
  Settings,
  LogOut,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Bot,
  Menu,
  User as UserIcon
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { Avatar } from '../components/ui/Avatar'
import { cn } from '../utils/cn'
import { Tooltip } from '../components/ui/Tooltip'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { NotificationsDropdown } from '../components/layout/NotificationsDropdown'
import { MobileDrawer } from '../components/layout/MobileDrawer'
import { MobileBottomNav } from '../components/layout/MobileBottomNav'
import { Dropdown } from '../components/ui/Dropdown'

const adminNavItems = [
  { id: 'dashboard', label: 'Bảng điều khiển', icon: Home, path: '/app/admin' },
  { id: 'users', label: 'Người dùng', icon: Users, path: '/app/admin/users' },
  { id: 'courses', label: 'Khóa học', icon: BookOpen, path: '/app/admin/courses' },
  { id: 'categories', label: 'Danh mục', icon: Layers, path: '/app/admin/categories' },
  { id: 'ai-keys', label: 'Khóa API & AI', icon: Bot, path: '/app/admin/ai-keys' },
  { id: 'settings', label: 'Cài đặt hệ thống', icon: Settings, path: '/app/admin/settings' },
]

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAppStore((s) => s.auth.user)!
  const logout = useAppStore((s) => s.auth.logout)
  const sidebarOpen = useAppStore((s) => s.ui.sidebarOpen)
  const toggleSidebar = useAppStore((s) => s.ui.toggleSidebar)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Notification state
  const notifications = useAppStore((s) => s.notifications.items)
  const unreadCount = useAppStore((s) => s.notifications.unreadCount)
  const fetchNotifs = useAppStore((s) => s.notifications.fetch)
  const markRead = useAppStore((s) => s.notifications.markRead)
  const markAllRead = useAppStore((s) => s.notifications.markAllRead)
  const dismissNotif = useAppStore((s) => s.notifications.dismiss)
  const clearNotifs = useAppStore((s) => s.notifications.clear)

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifs])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Get active menu label for breadcrumb
  const currentPath = location.pathname
  const activeNavItem = adminNavItems.find(item =>
    item.path === '/app/admin'
      ? currentPath === '/app/admin'
      : currentPath.startsWith(item.path)
  )
  const pageTitle = activeNavItem ? activeNavItem.label : 'Bảng điều khiển'

  const renderNavLinks = () => (
    <div className="flex h-full flex-col gap-4 font-body">
      {/* Profile Card */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
        <Avatar fallback={user.initials} size="md" status="online" />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground font-medium capitalize">{user.role}</p>
        </div>
      </div>

      {/* Admin Mode Badge */}
      <div className="flex items-center gap-2 mx-1 px-3 py-2 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
        <ShieldCheck className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        <span className="text-xs font-semibold">Chế độ quản trị</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        {adminNavItems.map((item) => {
          const isIndex = item.path === '/app/admin' && location.pathname === '/app/admin'
          const active = item.path === '/app/admin'
            ? isIndex
            : location.pathname.startsWith(item.path)
          const Icon = item.icon

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all group duration-150 w-full',
                active
                  ? 'bg-primary text-primary-foreground shadow-soft font-semibold'
                  : 'text-foreground/75 hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary-foreground" : "text-muted-foreground")} />
              <span className="flex-1 truncate text-left">{item.label}</span>
              {active && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="pt-2 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-foreground/75 hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background overflow-hidden font-body text-foreground animate-fade-in">
      {/* Mobile Drawer */}
      <MobileDrawer open={sidebarOpen} onClose={toggleSidebar} title="Quản trị hệ thống">
        {renderNavLinks()}
      </MobileDrawer>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-border bg-surface-elevated transition-all duration-200 relative shrink-0",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Brand/Logo Area */}
        <div className={cn(
          "flex items-center gap-3 p-4 border-b border-border transition-all",
          isCollapsed ? "justify-center px-2" : "px-4"
        )}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="h-5.5 w-5.5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 animate-fade-in text-left">
              <h2 className="text-sm font-bold text-foreground leading-tight truncate">Learning Hub</h2>
              <span className="text-2xs text-muted-foreground">Bảng quản trị</span>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className={cn(
          "flex items-center gap-3 p-4 border-b border-border bg-muted/20",
          isCollapsed ? "justify-center px-2" : "px-4"
        )}>
          <Avatar fallback={user.initials} size={isCollapsed ? "sm" : "md"} status="online" />
          {!isCollapsed && (
            <div className="flex-1 min-w-0 animate-fade-in text-left">
              <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground font-medium capitalize">{user.role}</p>
            </div>
          )}
        </div>

        {/* Admin Badge */}
        {!isCollapsed ? (
          <div className="flex items-center gap-2 mx-3 my-3 px-3 py-2 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 animate-fade-in">
            <ShieldCheck className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            <span className="text-xs font-semibold">Chế độ quản trị</span>
          </div>
        ) : (
          <div className="flex justify-center my-3">
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 px-3 py-2">
          {adminNavItems.map((item) => {
            const isIndex = item.path === '/app/admin' && location.pathname === '/app/admin'
            const active = item.path === '/app/admin'
              ? isIndex
              : location.pathname.startsWith(item.path)
            const Icon = item.icon

            const btnContent = (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all group duration-150 w-full',
                  active
                    ? 'bg-primary text-primary-foreground shadow-soft font-semibold'
                    : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary-foreground" : "text-muted-foreground")} />
                {!isCollapsed && <span className="flex-1 truncate text-left">{item.label}</span>}
                {!isCollapsed && active && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
              </button>
            )

            if (isCollapsed) {
              return (
                <Tooltip key={item.id} content={item.label} side="right">
                  {btnContent}
                </Tooltip>
              )
            }

            return btnContent
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-border">
          {isCollapsed ? (
            <Tooltip content="Đăng xuất" side="right">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-full gap-3 rounded-lg py-2.5 text-sm font-medium text-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all"
              >
                <LogOut className="h-4 w-4 shrink-0" />
              </button>
            </Tooltip>
          ) : (
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Đăng xuất</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Top Header */}
        <header className="h-14 sm:h-16 shrink-0 border-b border-border bg-surface-elevated/90 px-3 sm:px-6 flex items-center justify-between backdrop-blur-md z-30">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile drawer toggle */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-muted transition shadow-soft focus:outline-none shrink-0"
              aria-label="Mở menu quản trị"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>

            {/* Desktop collapse toggle button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-muted transition shadow-soft focus:outline-none shrink-0"
              title={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
            >
              {isCollapsed ? <ChevronRight className="h-4.5 w-4.5" /> : <ChevronLeft className="h-4.5 w-4.5" />}
            </button>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 sm:gap-2 truncate">
              <span className="text-3xs sm:text-2xs font-semibold px-2 py-0.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                Admin
              </span>
              <span className="text-muted-foreground/30 text-xs">/</span>
              <span className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-[140px] sm:max-w-none">
                {pageTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <NotificationsDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              onDismiss={dismissNotif}
              onClear={clearNotifs}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
            />

            {/* Divider */}
            <span className="hidden sm:block h-4 w-px bg-border" />

            {/* User Dropdown */}
            <Dropdown
              align="right"
              menuClassName="w-56 p-1.5"
              trigger={
                <button
                  className="flex items-center gap-2 rounded-md p-1 pr-1.5 sm:pr-2 hover:bg-muted transition"
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
                { id: 'profile', label: 'Hồ sơ cá nhân', icon: <UserIcon className="h-4 w-4" /> },
                { id: 'logout', label: 'Đăng xuất', icon: <LogOut className="h-4 w-4" />, danger: true }
              ]}
              onSelect={(id) => {
                if (id === 'profile') navigate(`/app/admin/profile`)
                if (id === 'logout') handleLogout()
              }}
            />
          </div>
        </header>

        {/* Scrollable content body */}
        <main className="flex-1 overflow-y-auto bg-background p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </div>
  )
}
