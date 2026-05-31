import { Outlet, Navigate } from 'react-router-dom'
import { useAppStore } from '../stores/appStore'
import { Sidebar } from '../components/layout/Sidebar'
import { Header } from '../components/layout/Header'
import { UploadModal } from '../features/documents/UploadModal'
import { ToastContainer } from '../components/ui/Toast'

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
    <div className="min-h-screen text-ink">
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col px-4 py-4 lg:px-6 lg:py-6">
        <Header />

        <div className="flex flex-1 gap-4">
          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div className="absolute inset-0 bg-ink/40" onClick={toggleSidebar} />
              <div className="absolute left-0 top-0 h-full w-72 border-r border-border bg-panel p-4 shadow-lift">
                <Sidebar />
              </div>
            </div>
          )}

          {/* Desktop sidebar */}
          <aside className="hidden w-[260px] shrink-0 rounded-2xl border border-border bg-panel p-4 shadow-soft lg:block">
            <Sidebar />
          </aside>

          {/* Main content */}
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
