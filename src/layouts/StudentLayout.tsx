import { Outlet } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { StudentSidebar } from '../components/layout/StudentSidebar'

export function StudentLayout() {
  return (
    <MainLayout sidebar={<StudentSidebar />}>
      <Outlet />
    </MainLayout>
  )
}
