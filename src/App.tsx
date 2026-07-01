import { RouterProvider } from 'react-router-dom'
import { useEffect } from 'react'
import { router } from './routes'
import { useAppStore } from './stores/appStore'

function App() {
  const loadUser = useAppStore((s) => s.auth.loadUser)
  const token = useAppStore((s) => s.auth.token)

  useEffect(() => {
    if (token) {
      loadUser()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <RouterProvider router={router} />
}

export default App
