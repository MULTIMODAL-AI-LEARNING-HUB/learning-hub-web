import { type ReactNode, useEffect } from 'react'
import { useAppStore } from '../../stores/appStore'
import { Header } from './Header'
import { MobileDrawer } from './MobileDrawer'
import { MobileBottomNav } from './MobileBottomNav'
import { cn } from '../../utils/cn'

interface MainLayoutProps {
  sidebar: ReactNode | null
  children: ReactNode
}

export function MainLayout({ sidebar, children }: MainLayoutProps) {
  const sidebarOpen = useAppStore((s) => s.ui.sidebarOpen)
  const toggleSidebar = useAppStore((s) => s.ui.toggleSidebar)
  const isAuthenticated = useAppStore((s) => s.auth.isAuthenticated)
  const loadDocuments = useAppStore((s) => s.documents.loadDocuments)

  // Preload documents once per authenticated session so the chat "Tài liệu
  // tham chiếu" picker and study tools never render with an empty store when
  // the user navigates directly to /chat, /quiz, /flashcards or /essay
  // without visiting the Documents page first.
  useEffect(() => {
    if (isAuthenticated) {
      loadDocuments()
    }
  }, [isAuthenticated, loadDocuments])

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <div className="mx-auto flex flex-col flex-1 w-full max-w-[1520px] px-2.5 py-2 sm:px-4 sm:py-3 lg:px-5 overflow-hidden min-h-0">
        <Header />

        <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
          {/* Desktop sidebar */}
          {sidebar && (
            <aside
              className={cn(
                'hidden shrink-0 rounded-xl border border-border bg-surface-elevated p-3 shadow-soft lg:block',
                'w-[248px] xl:w-[264px] overflow-y-auto scrollbar-thin'
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

          <main className="flex-1 min-w-0 overflow-y-auto scrollbar-thin px-0.5 sm:px-1 pb-20 lg:pb-6">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation bar */}
      <MobileBottomNav />
    </div>
  )
}
