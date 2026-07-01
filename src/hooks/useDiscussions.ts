/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react'
import { discussionsApi } from '../services/api'
import type { Discussion } from '../services/api'
import { useAppStore } from '../stores/appStore'

export function useDiscussions(lessonId: string) {
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toasts = useAppStore((s) => s.toasts)

  const fetchDiscussions = useCallback(async (page = 1, pageSize = 20) => {
    if (!lessonId) return
    setLoading(true)
    setError(null)
    try {
      const res = await discussionsApi.list(lessonId, page, pageSize)
      setDiscussions(res.data.items)
      setTotal(res.data.total)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch discussions')
    } finally {
      setLoading(false)
    }
  }, [lessonId])

  const createDiscussion = useCallback(async (content: string, parentId?: string) => {
    try {
      const res = await discussionsApi.create(lessonId, { content, parent_id: parentId })
      if (parentId) {
        setDiscussions(prev => prev.map(d => {
          if (d.id === parentId) {
            return { ...d, replies: [...(d.replies || []), res.data] }
          }
          return d
        }))
      } else {
        setDiscussions(prev => [res.data, ...prev])
      }
      toasts.add({ type: 'success', title: 'Discussion posted' })
      return res.data
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to post discussion' })
      throw err
    }
  }, [lessonId, toasts])

  const updateDiscussion = useCallback(async (discussionId: string, content: string) => {
    try {
      const res = await discussionsApi.update(discussionId, { content })
      setDiscussions(prev => prev.map(d => d.id === discussionId ? res.data : d))
      toasts.add({ type: 'success', title: 'Discussion updated' })
      return res.data
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to update discussion' })
      throw err
    }
  }, [toasts])

  const deleteDiscussion = useCallback(async (discussionId: string) => {
    try {
      await discussionsApi.delete(discussionId)
      setDiscussions(prev => prev.filter(d => d.id !== discussionId))
      toasts.add({ type: 'success', title: 'Discussion deleted' })
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to delete discussion' })
      throw err
    }
  }, [toasts])

  const upvote = useCallback(async (discussionId: string) => {
    try {
      const res = await discussionsApi.upvote(discussionId)
      setDiscussions(prev => prev.map(d => d.id === discussionId ? { ...d, upvotes: res.data.upvotes } : d))
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to upvote' })
      throw err
    }
  }, [toasts])

  const pinDiscussion = useCallback(async (discussionId: string) => {
    try {
      const res = await discussionsApi.pin(discussionId)
      setDiscussions(prev => prev.map(d => d.id === discussionId ? res.data : d))
      toasts.add({ type: 'success', title: 'Discussion pinned' })
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to pin discussion' })
      throw err
    }
  }, [toasts])

  const markAsAnswer = useCallback(async (discussionId: string) => {
    try {
      const res = await discussionsApi.markAsAnswer(discussionId)
      setDiscussions(prev => prev.map(d => d.id === discussionId ? res.data : d))
      toasts.add({ type: 'success', title: 'Marked as answer' })
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to mark as answer' })
      throw err
    }
  }, [toasts])

  return {
    discussions,
    total,
    loading,
    error,
    fetchDiscussions,
    createDiscussion,
    updateDiscussion,
    deleteDiscussion,
    upvote,
    pinDiscussion,
    markAsAnswer,
  }
}