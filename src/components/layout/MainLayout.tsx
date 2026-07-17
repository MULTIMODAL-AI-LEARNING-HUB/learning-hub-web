import { type ReactNode } from 'react'
import { useAppStore } from '../../stores/appStore'
import { Header } from './Header'
import { MobileDrawer } from './MobileDrawer'
import { cn } from '../../utils/cn'

interface MainLayoutProps {
  sidebar: ReactNode | null
  children: ReactNode
}

export function MainLayout({ sidebar, children }: MainLayoutProps) {
  const sidebarOpen = useAppStore((s) => s.ui.sidebarOpen)
  const toggleSidebar = useAppStore((s) => s.ui.toggleSidebar)

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <div className="mx-auto flex flex-col flex-1 w-full max-w-[1440px] px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6 overflow-hidden">
        <Header />

        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Desktop sidebar */}
          {sidebar && (
            <aside
              className={cn(
                'hidden shrink-0 rounded-2xl border border-border bg-surface-elevated p-4 shadow-soft lg:block',
                'w-[260px] xl:w-[272px] overflow-y-auto scrollbar-thin'
              )}
            >
              {sidebar}
            </aside>
          )}

          {/* Mobile drawer */}
          {sidebar && (
            <MobileDrawer open={sidebarOpen} onClose={toggleSidebar}>
              {sidebar}
            </MobileDrawer>
          )}

          <main className="flex-1 min-w-0 overflow-y-auto scrollbar-thin pr-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
