/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react'
import { coursesApi, Review } from '../../services/api'
import { useAppStore } from '../../stores/appStore'

export function useReviews(courseId: string) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toasts = useAppStore((s) => s.toasts)

  const fetchReviews = useCallback(async (page = 1, pageSize = 20) => {
    if (!courseId) return
    setLoading(true)
    setError(null)
    try {
      const res = await coursesApi.getReviews(courseId, page, pageSize)
      setReviews(res.data.items)
      setTotal(res.data.total)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch reviews')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  const replyToReview = useCallback(async (reviewId: string, reply: string) => {
    try {
      const res = await coursesApi.replyReview(courseId, reviewId, reply)
      setReviews(prev => prev.map(r => r.id === reviewId ? res.data : r))
      toasts.add({ type: 'success', title: 'Reply posted' })
      return res.data
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to post reply' })
      throw err
    }
  }, [courseId, toasts])

  return {
    reviews,
    total,
    loading,
    error,
    fetchReviews,
    replyToReview,
  }
}