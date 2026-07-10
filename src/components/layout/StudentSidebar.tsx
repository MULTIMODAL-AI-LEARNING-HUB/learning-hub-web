import { useNavigate, useLocation } from 'react-router-dom'
import { Home, BookOpen, FileText, MessageSquare, BookOpen as QuizIcon, Layers, User, LogOut, Compass, Heart, GraduationCap, Award } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { Avatar } from '../ui/Avatar'
import { cn } from '../../utils/cn'

const mainNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/app/student/dashboard' },
  { id: 'browse', label: 'Browse Courses', icon: Compass, path: '/app/student/browse' },
  { id: 'courses', label: 'My Courses', icon: BookOpen, path: '/app/student/courses' },
  { id: 'wishlist', label: 'Wishlist', icon: Heart, path: '/app/student/wishlist' },
]

const toolNavItems = [
  { id: 'documents', label: 'Documents', icon: FileText, path: '/app/student/documents' },
  { id: 'chat', label: 'AI Chat', icon: MessageSquare, path: '/app/student/chat' },
  { id: 'quiz', label: 'Quiz Generator', icon: QuizIcon, path: '/app/student/quiz' },
  { id: 'flashcards', label: 'Flashcards', icon: Layers, path: '/app/student/flashcards' },
]

export function StudentSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAppStore((s) => s.auth.user)!
  const logout = useAppStore((s) => s.auth.logout)

  const renderNavButton = (item: typeof mainNavItems[0]) => {
    const active = location.pathname === item.path
    const Icon = item.icon
    return (
      <button
        key={item.id}
        onClick={() => navigate(item.path)}
        className={cn(
          'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-all duration-200 group',
          active
            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-soft shadow-blue-500/10'
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
      <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-blue-500/10 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 glow-student">
        <Avatar fallback={user.initials} size="md" status="online" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
          <p className="text-xs text-blue-500 font-medium capitalize">{user.role}</p>
        </div>
      </div>

      {/* Student Badge */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          <span className="text-xs font-semibold">Student Workspace</span>
        </div>
        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto scrollbar-thin">
        {/* Main section */}
        <div className="flex flex-col gap-1">
          <span className="px-3.5 text-3xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Menu</span>
          {mainNavItems.map(renderNavButton)}
        </div>

        {/* AI Tools section */}
        <div className="flex flex-col gap-1">
          <span className="px-3.5 text-3xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">AI Study Tools</span>
          {toolNavItems.map(renderNavButton)}
        </div>

        {/* Progress Card */}
        <div className="mx-1 p-3 rounded-xl bg-muted/30 border border-border/50 space-y-2 mt-auto">
          <div className="flex items-center justify-between text-2xs font-semibold">
            <span className="text-muted-foreground flex items-center gap-1"><Award className="h-3 w-3 text-yellow-500" /> Daily Target</span>
            <span className="text-foreground">75%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-1 pt-2 border-t border-border">
        <button
          onClick={() => navigate('/app/student/profile')}
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
        >
          <User className="h-4 w-4 text-foreground/75" />
          <span>Profile</span>
        </button>
        <button
          onClick={() => { logout(); navigate('/welcome') }}
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
        >
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  )
}