import { useEffect, useRef } from 'react'
import { useAppStore } from '../stores/appStore'
import { documentsApi } from '../services/api'

export function useDocumentStatus() {
  const items = useAppStore((s) => s.documents.items)
  const updateProgress = useAppStore((s) => s.documents.updateProgress)
  const addToast = useAppStore((s) => s.toasts.add)

  const activePolls = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Find all processing documents that we are not yet polling
    const processingDocs = items.filter((d) => d.status === 'processing')

    processingDocs.forEach((doc) => {
      if (activePolls.current.has(doc.id)) return

      activePolls.current.add(doc.id)
      
      let pollCount = 0
      const maxPolls = 100 // Prevent infinite loops (e.g. 5 minutes timeout)

      const intervalId = setInterval(async () => {
        pollCount++
        if (pollCount >= maxPolls) {
          clearInterval(intervalId)
          activePolls.current.delete(doc.id)
          updateProgress(doc.id, 0, 'failed')
          addToast({
            type: 'error',
            title: 'Processing Timeout',
            message: `Document ${doc.name} failed to process in time.`
          })
          return
        }

        try {
          const res = await documentsApi.get(doc.id)
          const latest = res.data

          if (latest.status === 'ready') {
            clearInterval(intervalId)
            activePolls.current.delete(doc.id)
            updateProgress(doc.id, 100, 'ready')
            // Load documents list to get actual page counts and meta
            useAppStore.getState().documents.loadDocuments()
            addToast({
              type: 'success',
              title: 'Processing Complete',
              message: `${doc.name} is ready for study!`
            })
          } else if (latest.status === 'failed') {
            clearInterval(intervalId)
            activePolls.current.delete(doc.id)
            updateProgress(doc.id, 0, 'failed')
            addToast({
              type: 'error',
              title: 'Processing Failed',
              message: `Could not process ${doc.name}.`
            })
          } else {
            // Document is still processing, simulate intermediate progress in UI
            const simulatedProgress = Math.min(95, 20 + pollCount * 8)
            updateProgress(doc.id, simulatedProgress, 'processing')
          }
        } catch {
          // If fetch fails, keep trying unless it fails consistently
        }
      }, 3000)

      // Store interval on window or ref to cleanup on unmount if needed
      return () => {
        clearInterval(intervalId)
        activePolls.current.delete(doc.id)
      }
    })
  }, [items, updateProgress, addToast])
}
