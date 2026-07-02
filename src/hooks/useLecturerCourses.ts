/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react'
import { coursesApi, sectionsApi } from '../services/api'
import type { Section, Course } from '../services/api'
import { useAppStore } from '../stores/appStore'

export function useLecturerCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<{
    total_courses: number
    total_students: number
    total_revenue: number
    avg_rating: number
    recent_enrollments: { date: string; count: number }[]
    course_stats: { course_id: string; title: string; enrollment_count: number; revenue: number; rating_avg: number }[]
  } | null>(null)
  const toasts = useAppStore((s) => s.toasts)

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await coursesApi.listMyCourses({ page_size: 100 })
      setCourses(res.data.items)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch courses')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const res = await coursesApi.getStats()
      setStats(res.data)
    } catch (err: any) {
      console.error('Failed to fetch stats:', err)
    }
  }, [])

  const createCourse = useCallback(async (data: { title: string; description: string; price: number; category_id: string }) => {
    try {
      const res = await coursesApi.create(data)
      toasts.add({ type: 'success', title: 'Course created', message: 'Your course has been created successfully' })
      return res.data
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to create course' })
      throw err
    }
  }, [toasts])

  const updateCourse = useCallback(async (id: string, data: Partial<Course>) => {
    try {
      const res = await coursesApi.update(id, data)
      toasts.add({ type: 'success', title: 'Course updated', message: 'Changes saved successfully' })
      return res.data
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to update course' })
      throw err
    }
  }, [toasts])

  const publishCourse = useCallback(async (id: string) => {
    try {
      const res = await coursesApi.publish(id)
      toasts.add({ type: 'success', title: 'Course published', message: 'Your course is now live' })
      return res.data
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to publish course' })
      throw err
    }
  }, [toasts])

  const archiveCourse = useCallback(async (id: string) => {
    try {
      const res = await coursesApi.archive(id)
      toasts.add({ type: 'success', title: 'Course archived', message: 'Course has been archived' })
      return res.data
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to archive course' })
      throw err
    }
  }, [toasts])

  return {
    courses,
    loading,
    error,
    stats,
    fetchCourses,
    fetchStats,
    createCourse,
    updateCourse,
    publishCourse,
    archiveCourse,
  }
}

export function useSections(courseId: string) {
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toasts = useAppStore((s) => s.toasts)

  const fetchSections = useCallback(async () => {
    if (!courseId) return
    setLoading(true)
    setError(null)
    try {
      const res = await sectionsApi.list(courseId)
      setSections(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch sections')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  const createSection = useCallback(async (data: { title: string; description?: string }) => {
    try {
      const res = await sectionsApi.create(courseId, data)
      setSections(prev => [...prev, res.data])
      toasts.add({ type: 'success', title: 'Section created' })
      return res.data
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to create section' })
      throw err
    }
  }, [courseId, toasts])

  const updateSection = useCallback(async (sectionId: string, data: { title?: string; description?: string }) => {
    try {
      const res = await sectionsApi.update(courseId, sectionId, data)
      setSections(prev => prev.map(s => s.id === sectionId ? { ...s, ...res.data } : s))
      toasts.add({ type: 'success', title: 'Section updated' })
      return res.data
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to update section' })
      throw err
    }
  }, [courseId, toasts])

  const deleteSection = useCallback(async (sectionId: string) => {
    try {
      await sectionsApi.delete(courseId, sectionId)
      setSections(prev => prev.filter(s => s.id !== sectionId))
      toasts.add({ type: 'success', title: 'Section deleted' })
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to delete section' })
      throw err
    }
  }, [courseId, toasts])

  const reorderSections = useCallback(async (sectionIds: string[]) => {
    try {
      await sectionsApi.reorder(courseId, sectionIds)
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to reorder sections' })
      throw err
    }
  }, [courseId, toasts])

  return {
    sections,
    loading,
    error,
    fetchSections,
    createSection,
    updateSection,
    deleteSection,
    reorderSections,
  }
}