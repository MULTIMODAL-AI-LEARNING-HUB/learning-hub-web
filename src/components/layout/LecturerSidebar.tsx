import { useNavigate, useLocation } from 'react-router-dom'
import { Home, BookOpen, Users, BarChart3, FileText, Settings, User, LogOut, ClipboardCheck } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { Avatar } from '../ui/Avatar'
import { cn } from '../../utils/cn'

const mainNavItems = [
  { id: 'dashboard', label: 'Tổng quan', icon: Home, path: '/app/lecturer/dashboard' },
  { id: 'courses', label: 'Khóa học', icon: BookOpen, path: '/app/lecturer/courses' },
  { id: 'grading', label: 'Bài cần chấm', icon: ClipboardCheck, path: '/app/lecturer/courses' },
  { id: 'students', label: 'Sinh viên', icon: Users, path: '/app/lecturer/students' },
]

const adminNavItems = [
  { id: 'documents', label: 'Thư viện nội dung', icon: FileText, path: '/app/lecturer/documents' },
  { id: 'analytics', label: 'Phân tích', icon: BarChart3, path: '/app/lecturer/analytics' },
]

export function LecturerSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAppStore((s) => s.auth.user)!
  const logout = useAppStore((s) => s.auth.logout)

  const renderNavButton = (item: typeof mainNavItems[0]) => {
    const active = item.id !== 'grading' && location.pathname.startsWith(item.path)
    const Icon = item.icon
    return (
      <button
        key={item.id}
        onClick={() => navigate(item.path)}
        className={cn(
          'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-all duration-200 group',
          active
            ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-soft shadow-violet-500/10'
            : 'text-foreground/80 hover:bg-muted hover:text-foreground'
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110", active ? "text-white" : "text-foreground/75")} />
        <span className="flex-1">{item.label}</span>
        {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </button>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4 font-body">
      {/* Profile Card */}
      <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-violet-500/10 bg-gradient-to-br from-violet-500/5 to-purple-500/5 glow-lecturer">
        <Avatar fallback={user.initials} size="md" status="online" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
          <p className="text-xs text-violet-500 font-medium capitalize">{user.role}</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto scrollbar-thin">
        {/* Teaching section */}
        <div className="flex flex-col gap-1">
          <span className="px-3.5 metadata-text font-semibold uppercase tracking-wider text-muted-foreground mb-1">Giảng dạy</span>
          {mainNavItems.map(renderNavButton)}
        </div>

        {/* Management & Setup section */}
        <div className="flex flex-col gap-1">
          <span className="px-3.5 metadata-text font-semibold uppercase tracking-wider text-muted-foreground mb-1">Quản lý</span>
          {adminNavItems.map(renderNavButton)}
        </div>

      </div>

      {/* Footer */}
      <div className="flex flex-col gap-1 pt-2 border-t border-border">
        <button
          onClick={() => navigate('/app/lecturer/profile')}
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
        >
          <User className="h-4 w-4 text-foreground/75" />
          <span>Hồ sơ</span>
        </button>
        <button
          onClick={() => navigate('/app/lecturer/settings')}
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
        >
          <Settings className="h-4 w-4 text-foreground/75" />
          <span>Cài đặt</span>
        </button>
        <button
          onClick={() => { logout(); navigate('/welcome') }}
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
        >
          <LogOut className="h-4 w-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  )
}
