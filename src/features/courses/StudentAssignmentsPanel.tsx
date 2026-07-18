/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ClipboardCheck, Clock, FileText, RefreshCw } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { assignmentsApi, lessonsApi, sectionsApi, type Assignment, type Lesson, type Section } from '../../services/api'
import { AssignmentSubmissionView } from './AssignmentSubmission'

interface StudentAssignmentsPanelProps {
  courseId: string
}

interface StudentAssignmentItem {
  section: Section
  lesson: Lesson
  assignment: Assignment
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'No due date'
  return new Date(value).toLocaleString()
}

function isOverdue(assignment: Assignment) {
  return Boolean(assignment.deadline && new Date(assignment.deadline) < new Date())
}

export function StudentAssignmentsPanel({ courseId }: StudentAssignmentsPanelProps) {
  const [items, setItems] = useState<StudentAssignmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAssignments = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const sectionsRes = await sectionsApi.list(courseId)
      const sections = sectionsRes.data

      const lessonsBySection = await Promise.all(
        sections.map(async (section) => {
          const lessonsRes = await lessonsApi.list(section.id)
          return { section, lessons: lessonsRes.data }
        })
      )

      const assignmentResults = await Promise.all(
        lessonsBySection.flatMap(({ section, lessons }) =>
          lessons.map(async (lesson) => {
            try {
              const assignmentRes = await assignmentsApi.get(lesson.id)
              return { section, lesson, assignment: assignmentRes.data }
            } catch {
              return null
            }
          })
        )
      )

      setItems(
        assignmentResults.filter((item): item is StudentAssignmentItem => Boolean(item && item.assignment.is_active))
      )
    } catch {
      setError('Unable to load course assignments.')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    loadAssignments()
  }, [loadAssignments])

  const stats = useMemo(() => {
    const overdue = items.filter((item) => isOverdue(item.assignment)).length
    return {
      total: items.length,
      open: items.length - overdue,
      overdue,
    }
  }, [items])

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Assignments</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Submit lesson assignments and review lecturer feedback from this course.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAssignments} icon={<RefreshCw className="h-4 w-4" />}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card variant="outlined" className="p-3">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{stats.total}</p>
        </Card>
        <Card variant="outlined" className="p-3">
          <p className="text-xs text-muted-foreground">Open</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{stats.open}</p>
        </Card>
        <Card variant="outlined" className="p-3">
          <p className="text-xs text-muted-foreground">Past due</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{stats.overdue}</p>
        </Card>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {!error && items.length === 0 ? (
        <EmptyState
          compact
          icon={<ClipboardCheck />}
          title="No assignments yet"
          description="Assignments created by the lecturer will appear here."
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.assignment.id} padding="responsive" className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={isOverdue(item.assignment) ? 'warning' : 'primary'} label={isOverdue(item.assignment) ? 'Past due' : 'Open'} />
                    <span className="text-xs text-muted-foreground">{item.section.title}</span>
                  </div>
                  <h4 className="mt-2 text-base font-semibold text-foreground">{item.assignment.title}</h4>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Lesson: {item.lesson.title}
                  </p>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground sm:text-right">
                  <p className="flex items-center gap-1 sm:justify-end">
                    <Clock className="h-4 w-4" />
                    {formatDate(item.assignment.deadline)}
                  </p>
                  <p>Max score: {item.assignment.max_score}</p>
                </div>
              </div>

              <AssignmentSubmissionView lessonId={item.lesson.id} assignment={item.assignment} />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
