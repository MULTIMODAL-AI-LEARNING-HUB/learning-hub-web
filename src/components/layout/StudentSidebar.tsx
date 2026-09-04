import { useNavigate, useLocation } from 'react-router-dom'
import {
  Home,
  BookOpen,
  FileText,
  BookOpen as QuizIcon,
  Layers,
  User,
  LogOut,
  Compass,
  Heart,
  GraduationCap,
  Flame,
  MessagesSquare,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { Avatar } from '../ui/Avatar'
import { cn } from '../../utils/cn'

interface NavItem {
  id: string
  label: string
  icon: typeof Home
  path: string
  badge?: string
  badgeVariant?: 'primary' | 'success' | 'warning' | 'purple'
}

const mainNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Bảng điều khiển', icon: Home, path: '/app/student/dashboard' },
  { id: 'courses', label: 'Khóa học của tôi', icon: BookOpen, path: '/app/student/courses' },
  { id: 'browse', label: 'Khám phá khóa học', icon: Compass, path: '/app/student/browse' },
  { id: 'wishlist', label: 'Đã lưu yêu thích', icon: Heart, path: '/app/student/wishlist' },
  { id: 'friends-chat', label: 'Trò chuyện bạn bè', icon: MessagesSquare, path: '/app/student/friends-chat' },
]

const toolNavItems: NavItem[] = [
  { id: 'chat', label: 'Trợ lý AI Tutor', icon: Sparkles, path: '/app/student/chat', badge: 'AI', badgeVariant: 'purple' },
  { id: 'quiz', label: 'Tạo trắc nghiệm AI', icon: QuizIcon, path: '/app/student/quiz', badge: 'Mới', badgeVariant: 'primary' },
  { id: 'flashcards', label: 'Thẻ ghi nhớ Flashcards', icon: Layers, path: '/app/student/flashcards' },
  { id: 'documents', label: 'Tài liệu học tập', icon: FileText, path: '/app/student/documents' },
]

export function StudentSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAppStore((s) => s.auth.user)!
  const logout = useAppStore((s) => s.auth.logout)

  const renderNavButton = (item: NavItem) => {
    const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
    const Icon = item.icon
    return (
      <button
        key={item.id}
        onClick={() => navigate(item.path)}
        className={cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200',
          active
            ? 'bg-primary/10 text-primary font-semibold shadow-xs'
            : 'text-foreground/75 hover:bg-muted/70 hover:text-foreground'
        )}
      >
        {/* Left active glow bar */}
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary" />
        )}
        <div
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105',
            active
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'bg-muted/60 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
          )}
        >
          <Icon className="h-4 w-4" />
        </div>

        <span className="flex-1 truncate">{item.label}</span>

        {item.badge && (
          <span
            className={cn(
              'px-1.5 py-0.5 rounded-md text-3xs font-bold uppercase tracking-wider',
              item.badgeVariant === 'purple' && 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25',
              item.badgeVariant === 'primary' && 'bg-primary/15 text-primary border border-primary/25',
              item.badgeVariant === 'success' && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
            )}
          >
            {item.badge}
          </span>
        )}

        {active && !item.badge && (
          <ChevronRight className="h-3.5 w-3.5 text-primary opacity-60" />
        )}
      </button>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4 font-body">
      {/* Profile Card */}
      <div 
        onClick={() => navigate('/app/student/profile')}
        className="group flex items-center gap-3 rounded-2xl border border-border/80 bg-gradient-to-br from-surface-elevated to-muted/30 p-3 shadow-xs cursor-pointer hover:border-primary/40 hover:shadow-soft transition-all duration-200"
      >
        <div className="relative">
          <Avatar fallback={user.initials} size="md" status="online" />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
            {user.name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="inline-flex items-center gap-1 text-2xs font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
              <GraduationCap className="h-3 w-3" />
              Học viên
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 flex flex-col gap-5 overflow-y-auto scrollbar-thin pr-1">
        {/* Main section */}
        <div className="flex flex-col gap-1">
          <span className="px-3 text-3xs font-bold uppercase tracking-widest text-muted-foreground/80 mb-1">
            Học tập
          </span>
          {mainNavItems.map(renderNavButton)}
        </div>

        {/* AI Tools section */}
        <div className="flex flex-col gap-1">
          <span className="px-3 text-3xs font-bold uppercase tracking-widest text-muted-foreground/80 mb-1 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-purple-500" />
            Công cụ AI thông minh
          </span>
          {toolNavItems.map(renderNavButton)}
        </div>

        {/* Daily Streak Card */}
        <div className="mt-auto mx-1 rounded-2xl border border-border/70 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-surface-elevated p-3.5 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20">
                <Flame className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              </div>
              <span>Chuỗi 3 ngày</span>
            </div>
            <span className="text-2xs font-bold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">
              Mục tiêu ngày
            </span>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-2xs font-medium text-muted-foreground">
              <span>Tiến độ hoàn thành</span>
              <span className="font-bold text-foreground">75%</span>
            </div>
            <div className="h-2 w-full bg-muted/80 rounded-full overflow-hidden p-0.5 ring-1 ring-border/30">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-primary rounded-full transition-all duration-500"
                style={{ width: '75%' }} 
              />
            </div>
          </div>
          <p className="text-3xs text-muted-foreground text-center">
            Học thêm 1 bài giảng để hoàn thành mục tiêu hôm nay! ✨
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col gap-1 pt-3 border-t border-border/80">
        <button
          onClick={() => navigate('/app/student/profile')}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all duration-150"
        >
          <User className="h-4 w-4" />
          <span>Hồ sơ & Cài đặt</span>
        </button>
        <button
          onClick={() => {
            logout()
            navigate('/welcome')
          }}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-150"
        >
          <LogOut className="h-4 w-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  )
}
