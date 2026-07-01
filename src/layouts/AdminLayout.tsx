import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Home, Users, BookOpen, Layers, Settings, LogOut, ShieldCheck } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { Avatar } from '../components/ui/Avatar'
import { cn } from '../utils/cn'

const adminNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/app/admin' },
  { id: 'users', label: 'Users', icon: Users, path: '/app/admin/users' },
  { id: 'courses', label: 'Courses', icon: BookOpen, path: '/app/admin/courses' },
  { id: 'categories', label: 'Categories', icon: Layers, path: '/app/admin/categories' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/app/admin/settings' },
]

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAppStore((s) => s.auth.user)!
  const logout = useAppStore((s) => s.auth.logout)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-border bg-surface">
        {/* Profile Card */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Avatar fallback={user.initials} size="md" status="online" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
            <p className="text-xs text-primary capitalize">{user.role}</p>
          </div>
        </div>

        {/* Admin Badge */}
        <div className="flex items-center gap-2 mx-3 my-3 px-3 py-2 rounded-lg bg-primary/10 text-primary">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-xs font-medium">Admin Mode</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 px-3 py-2">
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
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all',
                  active
                    ? 'bg-primary text-primary-foreground shadow-soft'
                    : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {active && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
              </button>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-border">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}