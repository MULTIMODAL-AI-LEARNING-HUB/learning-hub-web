import { Outlet, Navigate } from 'react-router-dom'
import { useAppStore } from '../stores/appStore'
import { MainLayout } from '../components/layout/MainLayout'
import { Sidebar } from '../components/layout/Sidebar'
import { UploadModal } from '../features/documents/UploadModal'
import { ToastContainer } from '../components/ui/Toast'

export default function AppShell() {
  const isAuthenticated = useAppStore((s) => s.auth.isAuthenticated)
  const uploadModalOpen = useAppStore((s) => s.ui.uploadModalOpen)
  const closeUploadModal = useAppStore((s) => s.ui.closeUploadModal)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <>
      <MainLayout sidebar={<Sidebar />}>
        <Outlet />
      </MainLayout>
      <UploadModal open={uploadModalOpen} onClose={closeUploadModal} />
      <ToastContainer />
    </>
  )
}
