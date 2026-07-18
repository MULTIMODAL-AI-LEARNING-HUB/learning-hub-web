import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Home, Users, BookOpen, Layers, Settings, LogOut, ShieldCheck, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { Avatar } from '../components/ui/Avatar'
import { cn } from '../utils/cn'
import { Tooltip } from '../components/ui/Tooltip'

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
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-background overflow-hidden font-body">
      {/* Sidebar */}
      <aside 
        className={cn(
          "flex flex-col border-r border-border bg-surface-elevated transition-all duration-200 relative",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface-elevated text-foreground hover:bg-muted shadow-soft transition"
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        {/* Brand/Logo Area */}
        <div className={cn(
          "flex items-center gap-3 p-4 border-b border-border transition-all",
          isCollapsed ? "justify-center px-2" : "px-4"
        )}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="h-5.5 w-5.5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 animate-fade-in">
              <h2 className="text-sm font-bold text-foreground leading-tight truncate">Learning Hub</h2>
              <span className="text-2xs text-muted-foreground">Admin Console</span>
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
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground font-medium capitalize">{user.role}</p>
            </div>
          )}
        </div>

        {/* Admin Badge */}
        {!isCollapsed ? (
          <div className="flex items-center gap-2 mx-3 my-3 px-3 py-2 rounded-lg bg-primary/10 text-primary animate-fade-in">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs font-semibold">Admin Mode</span>
          </div>
        ) : (
          <div className="flex justify-center my-3">
            <ShieldCheck className="h-4 w-4 text-primary" />
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
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all group duration-150',
                  active
                    ? 'bg-primary text-primary-foreground shadow-soft'
                    : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary-foreground" : "text-muted-foreground")} />
                {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
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
            <Tooltip content="Logout" side="right">
              <button
                onClick={logout}
                className="flex items-center justify-center w-full gap-3 rounded-lg py-2.5 text-sm font-medium text-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all"
              >
                <LogOut className="h-4 w-4 shrink-0" />
              </button>
            </Tooltip>
          ) : (
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  )
}
