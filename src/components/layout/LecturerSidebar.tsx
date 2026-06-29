import { useNavigate, useLocation } from 'react-router-dom'
import { Home, BookOpen, Users, BarChart3, FileText, Settings, User, LogOut, GraduationCap } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { Avatar } from '../ui/Avatar'
import { cn } from '../../utils/cn'

const lecturerNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/app/lecturer/dashboard' },
  { id: 'courses', label: 'My Courses', icon: BookOpen, path: '/app/lecturer/courses' },
  { id: 'students', label: 'Students', icon: Users, path: '/app/lecturer/students' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/app/lecturer/analytics' },
  { id: 'documents', label: 'Content Library', icon: FileText, path: '/app/lecturer/documents' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/app/lecturer/settings' },
]

export function LecturerSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAppStore((s) => s.auth.user)
  const logout = useAppStore((s) => s.auth.logout)

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Profile Card */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-accent/30 bg-accent/5">
        <Avatar fallback={user.initials} size="md" status="online" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
          <p className="text-xs text-accent capitalize">{user.role}</p>
        </div>
      </div>

      {/* Lecturer Badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 text-accent">
        <GraduationCap className="h-4 w-4" />
        <span className="text-xs font-medium">Lecturer Mode</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        {lecturerNavItems.map((item) => {
          const active = location.pathname === item.path
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all',
                active
                  ? 'bg-accent text-accent-foreground shadow-soft'
                  : 'text-foreground/80 hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <span className="h-1.5 w-1.5 rounded-full bg-accent-foreground" />}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="flex flex-col gap-1 pt-2 border-t border-border">
        <button
          onClick={() => navigate('/app/lecturer/profile')}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
        >
          <User className="h-4 w-4" />
          <span>Profile</span>
        </button>
        <button
          onClick={() => { logout(); navigate('/welcome') }}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
        >
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  )
}