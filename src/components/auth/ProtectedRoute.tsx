import { Navigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../../stores/appStore'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: string[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const isAuthenticated = useAppStore((s) => s.auth.isAuthenticated)
  const user = useAppStore((s) => s.auth.user)
  const location = useLocation()

  // Not authenticated - redirect to welcome page
  if (!isAuthenticated) {
    return <Navigate to="/welcome" state={{ from: location }} replace />
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
  const user = useAppStore((s) => s.auth.user)

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />
  }

  if (!user?.role || (allowedRoles && !allowedRoles.includes(user.role))) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
