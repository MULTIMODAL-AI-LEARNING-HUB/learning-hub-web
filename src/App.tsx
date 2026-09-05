import { RouterProvider } from 'react-router-dom'
import { useEffect } from 'react'
import { router } from './routes'
import { useAppStore } from './stores/appStore'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { ToastContainer } from './components/ui/Toast'

import { setRateLimitListener } from './services/api'

function App() {
  const restoreSession = useAppStore((s) => s.auth.restoreSession)

  useEffect(() => {
    setRateLimitListener((msg) => {
      useAppStore.getState().toasts.add({ type: 'error', title: 'Rate Limited', message: msg })
    })
    restoreSession()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <ToastContainer />
    </ErrorBoundary>
  )
}

export default App

