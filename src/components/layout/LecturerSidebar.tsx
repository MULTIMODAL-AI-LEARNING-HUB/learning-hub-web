import { useNavigate, useLocation } from 'react-router-dom'
import { Home, BookOpen, Users, BarChart3, FileText, Settings, User, LogOut, GraduationCap, Users2 } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { Avatar } from '../ui/Avatar'
import { cn } from '../../utils/cn'

const mainNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/app/lecturer/dashboard' },
  { id: 'courses', label: 'My Courses', icon: BookOpen, path: '/app/lecturer/courses' },
  { id: 'students', label: 'Students', icon: Users, path: '/app/lecturer/students' },
]

const adminNavItems = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/app/lecturer/analytics' },
  { id: 'documents', label: 'Content Library', icon: FileText, path: '/app/lecturer/documents' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/app/lecturer/settings' },
]

export function LecturerSidebar() {
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

      {/* Lecturer Badge */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          <span className="text-xs font-semibold">Lecturer Space</span>
        </div>
        <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto scrollbar-thin">
        {/* Teaching section */}
        <div className="flex flex-col gap-1">
          <span className="px-3.5 text-3xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Teaching Console</span>
          {mainNavItems.map(renderNavButton)}
        </div>

        {/* Management & Setup section */}
        <div className="flex flex-col gap-1">
          <span className="px-3.5 text-3xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Resources & Setup</span>
          {adminNavItems.map(renderNavButton)}
        </div>

        {/* Quick Stats Card */}
        <div className="mx-1 p-3 rounded-xl bg-muted/30 border border-border/50 space-y-2 mt-auto">
          <div className="flex items-center justify-between text-2xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1"><Users2 className="h-3.5 w-3.5 text-violet-500" /> Active Students</span>
            <span className="text-foreground">Connected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1.5 overflow-hidden">
              <span className="inline-block h-5 w-5 rounded-full ring-2 ring-surface bg-violet-400 text-3xs text-white font-bold flex items-center justify-center">A</span>
              <span className="inline-block h-5 w-5 rounded-full ring-2 ring-surface bg-blue-400 text-3xs text-white font-bold flex items-center justify-center">B</span>
              <span className="inline-block h-5 w-5 rounded-full ring-2 ring-surface bg-emerald-400 text-3xs text-white font-bold flex items-center justify-center">C</span>
            </div>
            <span className="text-3xs text-muted-foreground font-medium">+15 active now</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-1 pt-2 border-t border-border">
        <button
          onClick={() => navigate('/app/lecturer/profile')}
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