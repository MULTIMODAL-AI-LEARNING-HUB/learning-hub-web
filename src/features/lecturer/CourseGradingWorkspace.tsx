/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2, ClipboardCheck, Clock, FileText, RefreshCw, Search, UserRound } from 'lucide-react'
import { assignmentsApi, lessonsApi, sectionsApi, type Assignment, type AssignmentSubmission, type Lesson, type Section } from '../../services/api'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import { Textarea } from '../../components/ui/Textarea'
import { useAppStore } from '../../stores/appStore'
import { cn } from '../../utils/cn'

type Filter = 'all' | 'ungraded' | 'graded' | 'late'

interface GradingItem {
  assignment: Assignment
  submission: AssignmentSubmission
  lesson: Lesson
  section: Section
}

interface CourseGradingWorkspaceProps {
  courseId: string
}

const filters: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'ungraded', label: 'Ungraded' },
  { id: 'graded', label: 'Graded' },
  { id: 'late', label: 'Late' },
]

function formatDate(value: string | null) {
  if (!value) return 'No date'
  return new Date(value).toLocaleString()
}

function submissionStatus(submission: AssignmentSubmission) {
  if (submission.score === null) return 'Ungraded'
  return 'Graded'
}

export function CourseGradingWorkspace({ courseId }: CourseGradingWorkspaceProps) {
  const toasts = useAppStore((state) => state.toasts)
  const [items, setItems] = useState<GradingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('ungraded')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<GradingItem | null>(null)
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)

  const loadItems = useCallback(async () => {
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

      const validAssignments = assignmentResults.filter((item): item is { section: Section; lesson: Lesson; assignment: Assignment } => Boolean(item))
      const submissionResults = await Promise.all(
        validAssignments.map(async ({ section, lesson, assignment }) => {
          const submissionsRes = await assignmentsApi.getSubmissions(assignment.id, 1, 100)
          return submissionsRes.data.items.map((submission) => ({ section, lesson, assignment, submission }))
        })
      )

      setItems(submissionResults.flat())
    } catch {
      setError('Unable to load course submissions.')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const stats = useMemo(() => {
    const ungraded = items.filter((item) => item.submission.score === null).length
    const graded = items.filter((item) => item.submission.score !== null).length
    const late = items.filter((item) => item.submission.is_late).length
    return { total: items.length, ungraded, graded, late }
  }, [items])

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      if (filter === 'ungraded' && item.submission.score !== null) return false
      if (filter === 'graded' && item.submission.score === null) return false
      if (filter === 'late' && !item.submission.is_late) return false
      if (!q) return true
      return [
        item.submission.student_name,
        item.assignment.title,
        item.lesson.title,
        item.section.title,
      ].some((value) => value?.toLowerCase().includes(q))
    })
  }, [filter, items, query])

  const openSubmission = (item: GradingItem) => {
    setSelected(item)
    setScore(item.submission.score === null ? '' : String(item.submission.score))
    setFeedback(item.submission.feedback || '')
  }

  const saveGrade = async () => {
    if (!selected) return
    const parsedScore = Number(score)
    if (Number.isNaN(parsedScore) || parsedScore < 0 || parsedScore > selected.assignment.max_score) {
      toasts.add({ type: 'error', title: 'Invalid score', message: `Score must be between 0 and ${selected.assignment.max_score}.` })
      return
    }

    setSaving(true)
    try {
      const res = await assignmentsApi.gradeSubmission(selected.submission.id, {
        score: parsedScore,
        feedback: feedback.trim() || undefined,
      })
      setItems((current) =>
        current.map((item) =>
          item.submission.id === selected.submission.id ? { ...item, submission: res.data } : item
        )
      )
      setSelected(null)
      toasts.add({ type: 'success', title: 'Submission graded' })
    } catch {
      toasts.add({ type: 'error', title: 'Unable to save grade' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            To Grade
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Review assignment submissions for this course.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadItems} loading={loading} icon={<RefreshCw className="h-4 w-4" />}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total submissions" value={stats.total} icon={<FileText className="h-4 w-4" />} />
        <SummaryCard label="Ungraded" value={stats.ungraded} icon={<ClipboardCheck className="h-4 w-4" />} />
        <SummaryCard label="Graded" value={stats.graded} icon={<CheckCircle2 className="h-4 w-4" />} />
        <SummaryCard label="Late" value={stats.late} icon={<Clock className="h-4 w-4" />} />
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={cn(
                  'rounded-full px-3 py-1 text-sm font-medium transition',
                  filter === item.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <Input
            value={query}
            onChange={setQuery}
            placeholder="Search student or assignment..."
            prefixIcon={<Search className="h-4 w-4" />}
            className="lg:w-72"
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
            icon={<ClipboardCheck />}
            title="Could not load submissions"
            description={error}
            action={<Button variant="outline" onClick={loadItems}>Try again</Button>}
            className="m-4"
          />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={<ClipboardCheck />}
            title="No submissions found"
            description="There are no submissions matching the current filters."
            compact
            className="m-4"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Assignment</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map((item) => (
                  <tr key={item.submission.id} className="hover:bg-muted/35">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <UserRound className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-foreground">{item.submission.student_name || 'Unknown student'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{item.assignment.title}</p>
                      <p className="text-xs text-muted-foreground">{item.section.title} / {item.lesson.title}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(item.submission.submitted_at)}
                      {item.submission.is_late && <Badge variant="warning" label="Late" className="ml-2" />}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={item.submission.score === null ? 'warning' : 'success'}
                        label={submissionStatus(item.submission)}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => openSubmission(item)}>
                        {item.submission.score === null ? 'Grade' : 'Review'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? selected.assignment.title : 'Grade submission'}
        description={selected ? `${selected.section.title} / ${selected.lesson.title}` : undefined}
        size="3xl"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={saveGrade} loading={saving}>Save grade</Button>
          </>
        )}
      >
        {selected && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-4">
              <Card padding="responsive">
                <p className="text-xs font-medium text-muted-foreground">Submission</p>
                <div className="mt-3 rounded-lg bg-muted/35 p-3 text-sm text-foreground">
                  {selected.submission.submission_text || 'No written response.'}
                </div>
                {selected.submission.attachments?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selected.submission.attachments.map((attachment) => (
                      <a
                        key={attachment.file_url}
                        href={attachment.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-sm text-primary hover:bg-muted"
                      >
                        <FileText className="h-4 w-4" />
                        {attachment.file_name}
                      </a>
                    ))}
                  </div>
                ) : null}
              </Card>
              <div>
                <label className="text-sm font-medium text-foreground">Feedback</label>
                <Textarea
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  className="mt-2 min-h-32"
                  placeholder="Write clear feedback for the student..."
                />
              </div>
            </div>

            <Card padding="responsive" className="h-fit">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Student</p>
                  <p className="mt-1 font-semibold text-foreground">{selected.submission.student_name || 'Unknown student'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Submitted</p>
                  <p className="mt-1 text-sm text-foreground">{formatDate(selected.submission.submitted_at)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Max score</p>
                  <p className="mt-1 text-sm text-foreground">{selected.assignment.max_score}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Score</label>
                  <Input
                    type="number"
                    value={score}
                    onChange={setScore}
                    min={0}
                    max={selected.assignment.max_score}
                    className="mt-2"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  )
}

function SummaryCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <Card padding="responsive">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">{value}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
    </Card>
  )
}
