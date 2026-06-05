import { Outlet, Navigate } from 'react-router-dom'
import { useAppStore } from '../stores/appStore'
import { Sidebar } from '../components/layout/Sidebar'
import { Header } from '../components/layout/Header'
import { UploadModal } from '../features/documents/UploadModal'
import { ToastContainer } from '../components/ui/Toast'
import { cn } from '../utils/cn'

export default function AppShell() {
  const isAuthenticated = useAppStore((s) => s.auth.isAuthenticated)
  const sidebarOpen = useAppStore((s) => s.ui.sidebarOpen)
  const toggleSidebar = useAppStore((s) => s.ui.toggleSidebar)
  const uploadModalOpen = useAppStore((s) => s.ui.uploadModalOpen)
  const closeUploadModal = useAppStore((s) => s.ui.closeUploadModal)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen gradient-mesh">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        <Header />

        <div className="flex flex-1 gap-4">
          {/* Sidebar (desktop) */}
          <aside
            className={cn(
              'hidden shrink-0 rounded-2xl border border-border bg-surface-elevated p-4 shadow-soft lg:block',
              'w-[280px] xl:w-[300px]'
            )}
          >
            <Sidebar />
          </aside>

          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div
                className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-fade-in"
                onClick={toggleSidebar}
              />
              <aside className="absolute left-0 top-0 h-full w-72 border-r border-border bg-surface-elevated p-4 shadow-lift animate-slide-in-from-left">
                <Sidebar />
              </aside>
            </div>
          )}

          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>

      <UploadModal open={uploadModalOpen} onClose={closeUploadModal} />
      <ToastContainer />
    </div>
  )
}
