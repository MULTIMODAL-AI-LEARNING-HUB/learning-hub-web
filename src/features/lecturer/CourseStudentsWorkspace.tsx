/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Search, Users } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Progress } from '../../components/ui/Progress'
import { Skeleton } from '../../components/ui/Skeleton'
import { coursesApi, type Enrollment } from '../../services/api'

interface CourseStudentsWorkspaceProps {
  courseId: string
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'No date'
  return new Date(value).toLocaleDateString()
}

function getPaymentBadgeVariant(status: Enrollment['payment_status']) {
  if (status === 'paid') return 'success'
  if (status === 'pending') return 'warning'
  if (status === 'failed') return 'error'
  return 'default'
}

function getEnrollmentBadgeVariant(status: Enrollment['status']) {
  if (status === 'active') return 'primary'
  if (status === 'completed') return 'success'
  return 'default'
}

export function CourseStudentsWorkspace({ courseId }: CourseStudentsWorkspaceProps) {
  const [students, setStudents] = useState<Enrollment[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const loadStudents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await coursesApi.getEnrolledStudents(courseId)
      setStudents(res.data.items)
      setTotal(res.data.total)
    } catch {
      setError('Unable to load enrolled students.')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return students

    return students.filter((student) =>
      [student.student_name, student.student_email, student.course_title].some((value) =>
        value?.toLowerCase().includes(normalizedQuery)
      )
    )
  }, [query, students])

  const activeCount = students.filter((student) => student.status === 'active').length
  const completedCount = students.filter((student) => student.status === 'completed').length
  const averageProgress = students.length
    ? Math.round(students.reduce((sum, student) => sum + (student.progress_percent || 0), 0) / students.length)
    : 0

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Users className="h-5 w-5 text-primary" />
            Students
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track enrollment, payment status, and learning progress for this course.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadStudents}
          loading={loading}
          icon={<RefreshCw className="h-4 w-4" />}
        >
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total students" value={total} />
        <Metric label="Active" value={activeCount} />
        <Metric label="Completed" value={completedCount} />
        <Metric label="Avg progress" value={`${averageProgress}%`} />
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Enrolled students</p>
            <p className="text-xs text-muted-foreground">
              {total} total enrollment{total === 1 ? '' : 's'}
            </p>
          </div>
          <Input
            value={query}
            onChange={setQuery}
            placeholder="Search students..."
            prefixIcon={<Search className="h-4 w-4" />}
            className="sm:w-72"
            aria-label="Search enrolled students"
          />
        </div>

        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} height={56} variant="rounded" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={<Users />}
            title="Could not load students"
            description={error}
            action={<Button variant="outline" onClick={loadStudents}>Try again</Button>}
            className="m-4"
          />
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title="No students found"
            description={query ? 'Try a different search term.' : 'Students will appear here after they enroll in this course.'}
            compact
            className="m-4"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Progress</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="transition hover:bg-muted/35">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{student.student_name || 'Unknown student'}</p>
                      <p className="text-xs text-muted-foreground">{student.student_email || 'No email'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="min-w-40">
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Completion</span>
                          <span className="font-medium text-foreground">{student.progress_percent || 0}%</span>
                        </div>
                        <Progress value={student.progress_percent || 0} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getPaymentBadgeVariant(student.payment_status)} label={student.payment_status} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getEnrollmentBadgeVariant(student.status)} label={student.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(student.enrolled_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <Card padding="responsive">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">{value}</p>
    </Card>
  )
}
