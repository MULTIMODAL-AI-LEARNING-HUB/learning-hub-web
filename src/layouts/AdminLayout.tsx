import { Outlet } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'

export function AdminLayout() {
  return (
    <MainLayout sidebar={null}>
      <Outlet />
    </MainLayout>
  )
}
