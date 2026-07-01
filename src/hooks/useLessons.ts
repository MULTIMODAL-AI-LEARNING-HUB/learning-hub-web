/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react'
import { lessonsApi } from '../services/api'
import type { Lesson, Attachment } from '../services/api'
import { useAppStore } from '../stores/appStore'

export function useLessons(sectionId: string) {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toasts = useAppStore((s) => s.toasts)

  const fetchLessons = useCallback(async () => {
    if (!sectionId) return
    setLoading(true)
    setError(null)
    try {
      const res = await lessonsApi.list(sectionId)
      setLessons(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch lessons')
    } finally {
      setLoading(false)
    }
  }, [sectionId])

  const createLesson = useCallback(async (data: {
    title: string
    description?: string
    type: 'VIDEO' | 'ARTICLE' | 'QUIZ' | 'ASSIGNMENT'
    video_url?: string
    video_duration?: number
    content?: string
    order_index?: number
    is_preview?: boolean
  }) => {
    try {
      const res = await lessonsApi.create(sectionId, data)
      setLessons(prev => [...prev, res.data])
      toasts.add({ type: 'success', title: 'Lesson created' })
      return res.data
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to create lesson' })
      throw err
    }
  }, [sectionId, toasts])

  const updateLesson = useCallback(async (lessonId: string, data: {
    title?: string
    description?: string
    video_url?: string
    video_duration?: number
    content?: string
    is_preview?: boolean
    is_active?: boolean
  }) => {
    try {
      const res = await lessonsApi.update(sectionId, lessonId, data)
      setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, ...res.data } : l))
      toasts.add({ type: 'success', title: 'Lesson updated' })
      return res.data
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to update lesson' })
      throw err
    }
  }, [sectionId, toasts])

  const deleteLesson = useCallback(async (lessonId: string) => {
    try {
      await lessonsApi.delete(sectionId, lessonId)
      setLessons(prev => prev.filter(l => l.id !== lessonId))
      toasts.add({ type: 'success', title: 'Lesson deleted' })
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to delete lesson' })
      throw err
    }
  }, [sectionId, toasts])

  const reorderLessons = useCallback(async (lessonIds: string[]) => {
    try {
      await lessonsApi.reorder(sectionId, lessonIds)
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to reorder lessons' })
      throw err
    }
  }, [sectionId, toasts])

  return {
    lessons,
    loading,
    error,
    fetchLessons,
    createLesson,
    updateLesson,
    deleteLesson,
    reorderLessons,
  }
}

export function useLessonAttachments(sectionId: string, lessonId: string) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAttachments = useCallback(async () => {
    if (!sectionId || !lessonId) return
    setLoading(true)
    try {
      const res = await lessonsApi.getAttachments(sectionId, lessonId)
      setAttachments(res.data)
    } catch (err) {
      console.error('Failed to fetch attachments:', err)
    } finally {
      setLoading(false)
    }
  }, [sectionId, lessonId])

  const addAttachment = useCallback(async (file: File) => {
    if (!sectionId || !lessonId) return
    const formData = new FormData()
    formData.append('file', file)
    formData.append('file_name', file.name)
    formData.append('file_type', file.type)
    try {
      const res = await lessonsApi.addAttachment(sectionId, lessonId, formData)
      setAttachments(prev => [res.data, ...prev])
      return res.data
    } catch (err) {
      console.error('Failed to add attachment:', err)
      throw err
    }
  }, [sectionId, lessonId])

  const deleteAttachment = useCallback(async (attachmentId: string) => {
    if (!sectionId || !lessonId) return
    try {
      await lessonsApi.deleteAttachment(sectionId, lessonId, attachmentId)
      setAttachments(prev => prev.filter(a => a.id !== attachmentId))
    } catch (err) {
      console.error('Failed to delete attachment:', err)
      throw err
    }
  }, [sectionId, lessonId])

  return {
    attachments,
    loading,
    fetchAttachments,
    addAttachment,
    deleteAttachment,
  }
}