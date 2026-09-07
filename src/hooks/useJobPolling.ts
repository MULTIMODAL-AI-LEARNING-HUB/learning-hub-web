import { useEffect, useRef, useState, useCallback } from 'react'
import { useToast } from '../components/ui/useToast'

export type JobStatus = 'pending' | 'processing' | 'ready' | 'failed'

export interface UseJobPollingOptions<T> {
  interval?: number
  maxAttempts?: number
  poll: () => Promise<{ status: JobStatus; data?: T; error?: string }>
  onReady: (data: T) => void
  onError?: (error?: string) => void
  onTimeout?: () => void
  errorTitle?: string
  timeoutTitle?: string
}

export function useJobPolling<T>(options: UseJobPollingOptions<T>) {
  const {
    interval = 2500,
    maxAttempts = 60,
    errorTitle = 'Generation failed',
    timeoutTitle = 'Generation timed out'
  } = options

  const [status, setStatus] = useState<JobStatus>('pending')
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const pollCount = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toast = useToast()
  // Always call the latest closures (avoids stale jobId captured at start() time).
  // start() is typically called right after setJobId(); without refs it would
  // keep polling with jobId=null forever.
  const pollRef = useRef(options.poll)
  const onReadyRef = useRef(options.onReady)
  const onErrorRef = useRef(options.onError)
  const onTimeoutRef = useRef(options.onTimeout)
  const errorTitleRef = useRef(errorTitle)
  const timeoutTitleRef = useRef(timeoutTitle)
  useEffect(() => {
    pollRef.current = options.poll
    onReadyRef.current = options.onReady
    onErrorRef.current = options.onError
    onTimeoutRef.current = options.onTimeout
    errorTitleRef.current = errorTitle
    timeoutTitleRef.current = timeoutTitle
  })

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    pollCount.current = 0
  }, [])

  const stop = useCallback(() => {
    cleanup()
    setLoading(false)
  }, [cleanup])

  const start = useCallback(() => {
    cleanup()
    setLoading(false)
    setLoading(true)
    setStatus('processing')
    setProgress(10)
    pollCount.current = 0

    intervalRef.current = setInterval(async () => {
      pollCount.current += 1
      if (pollCount.current >= maxAttempts) {
        cleanup()
        setStatus('failed')
        setLoading(false)
        toast({ type: 'error', title: timeoutTitleRef.current })
        onTimeoutRef.current?.()
        return
      }

      setProgress((p) => Math.min(90, p + 5))

      try {
        const result = await pollRef.current()
        if (result.status === 'ready' && result.data !== undefined) {
          cleanup()
          setData(result.data)
          setStatus('ready')
          setProgress(100)
          setLoading(false)
          onReadyRef.current(result.data)
        } else if (result.status === 'failed') {
          cleanup()
          setStatus('failed')
          setLoading(false)
          toast({ type: 'error', title: errorTitleRef.current, message: result.error })
          onErrorRef.current?.(result.error)
        }
      } catch {
        // network glitch: keep trying
      }
    }, interval)
  }, [interval, maxAttempts, cleanup, toast])

  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  return { status, data, loading, progress, start, stop, setProgress }
}
