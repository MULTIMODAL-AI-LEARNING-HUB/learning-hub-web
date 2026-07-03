import { useEffect, useState } from 'react'
import { Users, BookOpen, TrendingUp } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal } from '../../components/ui/Modal'
import { useLecturerCourses } from '../../hooks/useLecturerCourses'
import { coursesApi, type Enrollment } from '../../services/api'

export function LecturerStudents() {
  const { stats, fetchStats } = useLecturerCourses()
  const [selectedCourseTitle, setSelectedCourseTitle] = useState<string | null>(null)
  const [enrolledStudents, setEnrolledStudents] = useState<Enrollment[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchStats()
    coursesApi.getStats().catch(() => {})
  }, [fetchStats])

  const totalStudents = stats?.total_students ?? 0
  const courseStats = stats?.course_stats ?? []

  const topCourses = [...courseStats]
    .sort((a, b) => b.enrollment_count - a.enrollment_count)
    .slice(0, 5)

  const handleCourseClick = async (courseId: string, courseTitle: string) => {
    setSelectedCourseTitle(courseTitle)
    setIsModalOpen(true)
    setLoadingStudents(true)
    try {
      const res = await coursesApi.getEnrolledStudents(courseId)
      setEnrolledStudents(res.data.items)
    } catch (err) {
      console.error('Failed to fetch enrolled students:', err)
    } finally {
      setLoadingStudents(false)
    }
  }

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
              <div
                key={c.course_id}
                onClick={() => handleCourseClick(c.course_id, c.title)}
                className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition"
              >
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
              <div
                key={c.course_id}
                onClick={() => handleCourseClick(c.course_id, c.title)}
                className="px-4 py-3 cursor-pointer hover:bg-muted/40 transition"
              >
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
                <tr
                  key={c.course_id}
                  onClick={() => handleCourseClick(c.course_id, c.title)}
                  className="hover:bg-muted/30 transition cursor-pointer"
                >
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

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Enrolled Students - ${selectedCourseTitle}`}
        size="lg"
      >
        <div className="space-y-4 py-2">
          {loadingStudents ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-muted/20 rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : enrolledStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
              <p>No students enrolled in this course yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[50vh] overflow-y-auto pr-1">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/30 sticky top-0 bg-background z-10">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Student</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Joined Date</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Payment</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {enrolledStudents.map((enrollment) => {
                    const studentInitials = enrollment.student_name
                      ? enrollment.student_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                      : 'U'
                    return (
                      <tr key={enrollment.id} className="hover:bg-muted/10 transition">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                              {enrollment.student_avatar_url ? (
                                <img src={enrollment.student_avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                              ) : (
                                studentInitials
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{enrollment.student_name || 'Anonymous'}</p>
                              <p className="text-xs text-muted-foreground truncate">{enrollment.student_email || 'No email'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {new Date(enrollment.enrolled_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-xs">
                            <p className="font-semibold text-foreground">${enrollment.payment_amount_vnd?.toLocaleString() || 0}</p>
                            <span className="text-[10px] text-muted-foreground capitalize">{enrollment.payment_method || 'Free'}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Badge
                            variant={enrollment.status === 'completed' ? 'success' : 'primary'}
                            label={enrollment.status}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}