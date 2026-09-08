import { useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  BookOpen,
  Compass,
  Sparkles,
  Menu,
  Users,
  BarChart3,
  Bot,
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { cn } from '../../utils/cn'

interface NavTab {
  id: string
  label: string
  icon: typeof Home
  path?: string
  isAction?: boolean
  highlight?: boolean
}

export function MobileBottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAppStore((s) => s.auth.user)
  const sidebarOpen = useAppStore((s) => s.ui.sidebarOpen)
  const toggleSidebar = useAppStore((s) => s.ui.toggleSidebar)

  if (!user) return null

  const role = user.role || 'student'

  const studentTabs: NavTab[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: Home, path: '/app/student/dashboard' },
    { id: 'courses', label: 'Khóa học', icon: BookOpen, path: '/app/student/courses' },
    { id: 'browse', label: 'Khám phá', icon: Compass, path: '/app/student/browse' },
    { id: 'chat', label: 'AI Tutor', icon: Sparkles, path: '/app/student/chat', highlight: true },
    { id: 'menu', label: 'Thêm', icon: Menu, isAction: true },
  ]

  const lecturerTabs: NavTab[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: Home, path: '/app/lecturer/dashboard' },
    { id: 'courses', label: 'Khóa học', icon: BookOpen, path: '/app/lecturer/courses' },
    { id: 'students', label: 'Học viên', icon: Users, path: '/app/lecturer/students' },
    { id: 'analytics', label: 'Thống kê', icon: BarChart3, path: '/app/lecturer/analytics' },
    { id: 'menu', label: 'Thêm', icon: Menu, isAction: true },
  ]

  const adminTabs: NavTab[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: Home, path: '/app/admin' },
    { id: 'users', label: 'Người dùng', icon: Users, path: '/app/admin/users' },
    { id: 'courses', label: 'Khóa học', icon: BookOpen, path: '/app/admin/courses' },
    { id: 'ai-keys', label: 'AI Keys', icon: Bot, path: '/app/admin/ai-keys' },
    { id: 'menu', label: 'Thêm', icon: Menu, isAction: true },
  ]

  const tabs = role === 'admin' ? adminTabs : role === 'lecturer' ? lecturerTabs : studentTabs

  const currentPath = location.pathname

  return (
    <nav
      aria-label="Thanh điều hướng di động"
      className={cn(
        'fixed bottom-0 inset-x-0 z-40 lg:hidden',
        'border-t border-border/80 bg-surface-elevated/92 backdrop-blur-xl',
        'safe-bottom shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.35)]',
        'transition-all duration-200'
      )}
    >
      <div className="flex h-16 items-center justify-around px-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.path
            ? tab.path === '/app/admin'
              ? currentPath === '/app/admin'
              : currentPath === tab.path || currentPath.startsWith(`${tab.path}/`)
            : false
          const isMenuOpen = tab.isAction && sidebarOpen

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.isAction) {
                  toggleSidebar()
                } else if (tab.path) {
                  navigate(tab.path)
                }
              }}
              className={cn(
                'group relative flex flex-1 flex-col items-center justify-center py-1.5 px-1 min-h-[48px] rounded-xl transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                isActive || isMenuOpen
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {/* Active pill background effect */}
              {(isActive || isMenuOpen) && (
                <span className="absolute inset-x-2 inset-y-1 rounded-xl bg-primary/10 -z-10 transition-all duration-200" />
              )}

              {/* Icon with special badge/highlight for AI Tutor */}
              <div className="relative">
                <Icon
                  className={cn(
                    'h-5 w-5 transition-transform duration-200 group-hover:scale-110',
                    tab.highlight && !isActive && 'text-purple-500 animate-pulse-soft',
                    isActive && 'scale-105'
                  )}
                />
                {tab.highlight && !isActive && (
                  <span className="absolute -top-1 -right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
                  </span>
                )}
              </div>

              {/* Text label */}
              <span
                className={cn(
                  'mt-1 text-3xs sm:text-2xs truncate max-w-[64px] transition-colors',
                  isActive || isMenuOpen ? 'font-bold text-primary' : 'font-medium'
                )}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
