/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, CheckCircle2, Clock, GraduationCap, PlayCircle, Search } from 'lucide-react'
import { enrollmentsApi, type Enrollment } from '../../services/api'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Progress } from '../../components/ui/Progress'
import { Skeleton } from '../../components/ui/Skeleton'
import { Tabs } from '../../components/ui/Tabs'

type CourseFilter = 'all' | 'not-started' | 'in-progress' | 'completed'

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'No date'
  return new Date(dateStr).toLocaleDateString()
}

function getCourseTitle(enrollment: Enrollment) {
  return enrollment.course?.title || enrollment.course_title || 'Untitled course'
}

function getCourseDescription(enrollment: Enrollment) {
  return enrollment.course?.description || 'Continue learning with structured course materials and guided activities.'
}

function getCourseProgress(enrollment: Enrollment) {
  return Math.round(enrollment.progress_percent || 0)
}

function getEnrollmentState(enrollment: Enrollment): CourseFilter {
  if (enrollment.status === 'completed' || getCourseProgress(enrollment) >= 100) return 'completed'
  if (getCourseProgress(enrollment) === 0) return 'not-started'
  return 'in-progress'
}

export function MyCourses() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<CourseFilter>('all')

  const loadEnrollments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await enrollmentsApi.list({ page_size: 100 })
      setEnrollments(res.data.items)
    } catch (err) {
      console.error('Failed to load enrollments:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEnrollments()
  }, [loadEnrollments])

  const counts = useMemo(() => {
    const notStarted = enrollments.filter((item) => getEnrollmentState(item) === 'not-started').length
    const inProgress = enrollments.filter((item) => getEnrollmentState(item) === 'in-progress').length
    const completed = enrollments.filter((item) => getEnrollmentState(item) === 'completed').length
    const avgProgress = enrollments.length
      ? Math.round(enrollments.reduce((sum, item) => sum + getCourseProgress(item), 0) / enrollments.length)
      : 0

    return {
      all: enrollments.length,
      notStarted,
      inProgress,
      completed,
      avgProgress,
    }
  }, [enrollments])

  const filteredEnrollments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return enrollments.filter((enrollment) => {
      const matchesTab = activeTab === 'all' || getEnrollmentState(enrollment) === activeTab
      const matchesQuery = !normalizedQuery || [
        getCourseTitle(enrollment),
        getCourseDescription(enrollment),
        enrollment.lecturer_name,
      ].some((value) => value?.toLowerCase().includes(normalizedQuery))

      return matchesTab && matchesQuery
    })
  }, [activeTab, enrollments, query])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Learning workspace</p>
          <h1 className="mt-1 text-fluid-2xl font-bold text-foreground">My Courses</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Track your enrolled courses, continue where you left off, and review completed learning.
          </p>
        </div>
        <Link to="/app/student/browse">
          <Button iconRight={<ArrowRight className="h-4 w-4" />} fullWidthMobile>
            Browse Courses
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<BookOpen />} label="Enrolled" value={counts.all} />
        <Metric icon={<PlayCircle />} label="In progress" value={counts.inProgress} />
        <Metric icon={<CheckCircle2 />} label="Completed" value={counts.completed} />
        <Metric icon={<GraduationCap />} label="Average progress" value={`${counts.avgProgress}%`} />
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as CourseFilter)}
            tabs={[
              { id: 'all', label: `All (${counts.all})` },
              { id: 'not-started', label: `Not started (${counts.notStarted})` },
              { id: 'in-progress', label: `In progress (${counts.inProgress})` },
              { id: 'completed', label: `Completed (${counts.completed})` },
            ]}
          />
          <Input
            value={query}
            onChange={setQuery}
            placeholder="Search your courses..."
            prefixIcon={<Search className="h-4 w-4" />}
            aria-label="Search enrolled courses"
            className="lg:w-80"
          />
        </div>

        {loading ? (
          <div className="grid gap-4 p-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} padding="responsive" variant="outlined">
                <div className="flex gap-4">
                  <Skeleton className="h-24 w-32 rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <EmptyState
            icon={<BookOpen />}
            title={query ? 'No matching courses' : 'No courses found'}
            description={
              query
                ? 'Try a different search term or switch filters.'
                : activeTab === 'all'
                  ? 'Browse the catalog and enroll in a course to start learning.'
                  : 'Courses matching this status will appear here.'
            }
            action={(
              <Link to="/app/student/browse">
                <Button>Browse Courses</Button>
              </Link>
            )}
            className="m-4"
          />
        ) : (
          <div className="grid gap-4 p-4 lg:grid-cols-2">
            {filteredEnrollments.map((enrollment) => (
              <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number | string }) {
  return (
    <Card padding="responsive">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </div>
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground tabular-nums">{value}</p>
    </Card>
  )
}

function EnrollmentCard({ enrollment }: { enrollment: Enrollment }) {
  const progress = getCourseProgress(enrollment)
  const state = getEnrollmentState(enrollment)
  const title = getCourseTitle(enrollment)
  const thumbnail = enrollment.course?.thumbnail_url || enrollment.course_thumbnail

  return (
    <Card padding="responsive" interactive className="group">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          to={`/app/student/courses/${enrollment.course_id}`}
          className="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 sm:h-28 sm:w-40"
        >
          {thumbnail ? (
            <img src={thumbnail} alt={title} className="h-full w-full object-cover transition duration-200 group-hover:scale-105" />
          ) : (
            <BookOpen className="h-9 w-9 text-primary" />
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                to={`/app/student/courses/${enrollment.course_id}`}
                className="line-clamp-1 font-semibold text-foreground transition hover:text-primary"
              >
                {title}
              </Link>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{getCourseDescription(enrollment)}</p>
            </div>
            <Badge
              variant={state === 'completed' ? 'success' : state === 'in-progress' ? 'primary' : 'default'}
              label={state === 'not-started' ? 'Not started' : state === 'in-progress' ? 'In progress' : 'Completed'}
              className="shrink-0"
            />
          </div>

          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium text-foreground">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Enrolled {formatDate(enrollment.enrolled_at)}
            </div>
            <div className="flex gap-2">
              <Link to={`/app/student/courses/${enrollment.course_id}`}>
                <Button variant="outline" size="sm">Details</Button>
              </Link>
              {state !== 'completed' && (
                <Link to={`/app/student/courses/${enrollment.course_id}/learn`}>
                  <Button size="sm">{progress === 0 ? 'Start' : 'Continue'}</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
