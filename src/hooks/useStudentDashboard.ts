import { useState, useCallback } from 'react'
import { dashboardApi } from '../services/api'
import type { DashboardCourseProgress, DashboardStats, DashboardActivity } from '../services/api'


export function useStudentDashboard() {
  const [courses, setCourses] = useState<DashboardCourseProgress[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<DashboardActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await dashboardApi.getMyDashboard()
      setCourses(res.data.courses)
      setStats(res.data.stats)
      setRecentActivity(res.data.recent_activity)
    } catch (err) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      const message = axiosErr?.response?.data?.detail || 'Failed to fetch dashboard data'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    courses,
    stats,
    recentActivity,
    loading,
    error,
    fetchDashboard,
  }
}