/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react'
import { assignmentsApi, Assignment, AssignmentSubmission } from '../../services/api'
import { useAppStore } from '../../stores/appStore'

export function useAssignment(lessonId: string) {
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toasts = useAppStore((s) => s.toasts)

  const fetchAssignment = useCallback(async () => {
    if (!lessonId) return
    setLoading(true)
    setError(null)
    try {
      const res = await assignmentsApi.get(lessonId)
      setAssignment(res.data)
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.detail || 'Failed to fetch assignment')
      }
    } finally {
      setLoading(false)
    }
  }, [lessonId])

  const createAssignment = useCallback(async (data: {
    title: string
    description?: string
    instructions?: string
    deadline?: string
    max_score?: number
    allow_resubmit?: boolean
    max_resubmits?: number
  }) => {
    try {
      const res = await assignmentsApi.create(lessonId, data)
      setAssignment(res.data)
      toasts.add({ type: 'success', title: 'Assignment created' })
      return res.data
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to create assignment' })
      throw err
    }
  }, [lessonId, toasts])

  const updateAssignment = useCallback(async (data: {
    title?: string
    description?: string
    instructions?: string
    deadline?: string
    max_score?: number
    allow_resubmit?: boolean
    max_resubmits?: number
    is_active?: boolean
  }) => {
    try {
      const res = await assignmentsApi.update(lessonId, data)
      setAssignment(res.data)
      toasts.add({ type: 'success', title: 'Assignment updated' })
      return res.data
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to update assignment' })
      throw err
    }
  }, [lessonId, toasts])

  const deleteAssignment = useCallback(async () => {
    if (!assignment) return
    try {
      await assignmentsApi.delete(assignment.id)
      setAssignment(null)
      toasts.add({ type: 'success', title: 'Assignment deleted' })
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to delete assignment' })
      throw err
    }
  }, [assignment, toasts])

  return {
    assignment,
    loading,
    error,
    fetchAssignment,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  }
}

export function useAssignmentSubmissions(assignmentId: string) {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const toasts = useAppStore((s) => s.toasts)

  const fetchSubmissions = useCallback(async (page = 1, pageSize = 20) => {
    if (!assignmentId) return
    setLoading(true)
    try {
      const res = await assignmentsApi.getSubmissions(assignmentId, page, pageSize)
      setSubmissions(res.data.items)
      setTotal(res.data.total)
    } catch (err) {
      console.error('Failed to fetch submissions:', err)
    } finally {
      setLoading(false)
    }
  }, [assignmentId])

  const gradeSubmission = useCallback(async (submissionId: string, score: number, feedback?: string) => {
    try {
      const res = await assignmentsApi.gradeSubmission(submissionId, { score, feedback })
      setSubmissions(prev => prev.map(s => s.id === submissionId ? res.data : s))
      toasts.add({ type: 'success', title: 'Submission graded' })
      return res.data
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to grade submission' })
      throw err
    }
  }, [toasts])

  return {
    submissions,
    total,
    loading,
    fetchSubmissions,
    gradeSubmission,
  }
}