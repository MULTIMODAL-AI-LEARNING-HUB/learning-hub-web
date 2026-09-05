import { Navigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../../stores/appStore'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: string[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const isAuthenticated = useAppStore((s) => s.auth.isAuthenticated)
  const isLoadingUser = useAppStore((s) => s.auth.isLoadingUser)
  const user = useAppStore((s) => s.auth.user)
  const location = useLocation()

  // Not authenticated - redirect to welcome page
  if (!isAuthenticated) {
    return <Navigate to="/welcome" state={{ from: location }} replace />
  }

  if (isLoadingUser || (allowedRoles && !user)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    )
  }

  // Check role-based access
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const rolePath = user.role === 'lecturer' ? '/app/lecturer' : '/app/student'
    return <Navigate to={rolePath} replace />
  }

  return <>{children}</>
}

export function RoleRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const isAuthenticated = useAppStore((s) => s.auth.isAuthenticated)
  const isLoadingUser = useAppStore((s) => s.auth.isLoadingUser)
  const user = useAppStore((s) => s.auth.user)

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />
  }

  if (isLoadingUser || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground animate-pulse">Loading workspace...</p>
        </div>
      </div>
    )
  }

  const userRole = user.role?.toLowerCase()
  if (!userRole || (allowedRoles && !allowedRoles.map(r => r.toLowerCase()).includes(userRole))) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
