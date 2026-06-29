import { Outlet } from 'react-router-dom'
import { Header } from '../components/layout/Header'

export function AdminLayout() {
  return (
    <div className="min-h-screen gradient-mesh">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        <Header />
        <div className="flex flex-1 gap-4">
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
