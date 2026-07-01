import { Outlet } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { LecturerSidebar } from '../components/layout/LecturerSidebar'

export function LecturerLayout() {
  return (
    <MainLayout sidebar={<LecturerSidebar />}>
      <Outlet />
    </MainLayout>
  )
}
