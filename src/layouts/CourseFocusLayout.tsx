import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAppStore } from '../stores/appStore'

/**
 * Focus mode layout for distraction-free course learning.
 * Removes the global StudentSidebar and AppHeader to maximize screen estate for video & lecture content,
 * similar to modern LMS platforms (Udemy, Coursera).
 */
export function CourseFocusLayout() {
  const isAuthenticated = useAppStore((s) => s.auth.isAuthenticated)
  const loadDocuments = useAppStore((s) => s.documents.loadDocuments)

  // Keep documents preloaded so AI chat/tools inside the learning space have context
  useEffect(() => {
    if (isAuthenticated) {
      loadDocuments()
    }
  }, [isAuthenticated, loadDocuments])

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      <Outlet />
    </div>
  )
}
