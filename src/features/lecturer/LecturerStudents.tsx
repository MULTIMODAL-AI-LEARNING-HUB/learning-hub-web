import { useEffect } from 'react'
import { Users, BookOpen, TrendingUp } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'
import { useLecturerCourses } from '../../hooks/useLecturerCourses'
import { coursesApi } from '../../services/api'

export function LecturerStudents() {
  const { stats, fetchStats } = useLecturerCourses()

  useEffect(() => {
    fetchStats()
    coursesApi.getStats().catch(() => {})
  }, [fetchStats])

  const totalStudents = stats?.total_students ?? 0
  const courseStats = stats?.course_stats ?? []

  const topCourses = [...courseStats]
    .sort((a, b) => b.enrollment_count - a.enrollment_count)
    .slice(0, 5)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Students"
        description={`${totalStudents} total students enrolled across your courses`}
        icon={<Users />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="responsive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Students</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2 tabular-nums">{totalStudents}</p>
        </Card>
        <Card padding="responsive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Courses</span>
            <BookOpen className="h-4 w-4 text-accent" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2 tabular-nums">{stats?.total_courses ?? 0}</p>
        </Card>
        <Card padding="responsive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Rating</span>
            <TrendingUp className="h-4 w-4 text-warning" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2 tabular-nums">
            {stats?.avg_rating ? stats.avg_rating.toFixed(1) : '—'}
          </p>
        </Card>
        <Card padding="responsive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Revenue</span>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2 tabular-nums">
            ${stats?.total_revenue?.toLocaleString() ?? 0}
          </p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground">Top Courses by Enrollment</h3>
          </div>
          <div className="divide-y divide-border">
            {topCourses.length > 0 ? topCourses.map((c, i) => (
              <div key={c.course_id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                    {i + 1}
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="primary" label={`${c.enrollment_count} students`} />
                  {c.rating_avg > 0 && (
                    <span className="text-xs text-muted-foreground tabular-nums">★ {c.rating_avg.toFixed(1)}</span>
                  )}
                </div>
              </div>
            )) : (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No enrollment data yet
              </div>
            )}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground">Course Performance</h3>
          </div>
          <div className="divide-y divide-border">
            {courseStats.length > 0 ? courseStats.map((c) => (
              <div key={c.course_id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">${c.revenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${totalStudents > 0 ? Math.round((c.enrollment_count / totalStudents) * 100) : 0}%`
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0 w-10 text-right">
                    {totalStudents > 0 ? Math.round((c.enrollment_count / totalStudents) * 100) : 0}%
                  </span>
                </div>
              </div>
            )) : (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No course data available
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-foreground">All Courses</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Course</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Students</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Revenue</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {courseStats.length > 0 ? courseStats.map((c) => (
                <tr key={c.course_id} className="hover:bg-muted/30 transition">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{c.title}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums">{c.enrollment_count}</td>
                  <td className="px-4 py-3 text-sm tabular-nums">${c.revenue.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {c.rating_avg > 0 ? (
                      <span className="text-sm text-foreground tabular-nums">★ {c.rating_avg.toFixed(1)}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No courses yet. Create your first course to see student data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}