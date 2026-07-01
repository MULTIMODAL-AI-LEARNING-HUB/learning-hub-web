import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Users, BarChart3, TrendingUp, Star, Clock, ArrowRight, Plus } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useLecturerCourses } from '../../hooks/useLecturerCourses'

export function LecturerDashboard() {
  const navigate = useNavigate()
  const user = useAppStore((s) => s.auth.user)
  const { courses, stats, fetchCourses, fetchStats } = useLecturerCourses()

  useEffect(() => {
    fetchCourses()
    fetchStats()
  }, [fetchCourses, fetchStats])

  const getGreeting = () => {
    const hr = new Date().getHours()
    if (hr < 12) return 'Good morning'
    if (hr < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const statCards = [
    { label: 'Total Courses', value: stats?.total_courses ?? 0, icon: BookOpen, variant: 'primary' as const },
    { label: 'Total Students', value: stats?.total_students ?? 0, icon: Users, variant: 'accent' as const },
    { label: 'Avg Rating', value: stats?.avg_rating ? stats.avg_rating.toFixed(1) : '—', icon: Star, variant: 'warning' as const },
    { label: 'Revenue', value: stats?.total_revenue ? `$${stats.total_revenue.toLocaleString()}` : '$0', icon: TrendingUp, variant: 'success' as const },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-fluid-2xl font-bold text-foreground">
            {getGreeting()}, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">Here's an overview of your teaching activity.</p>
        </div>
        <Button onClick={() => navigate('/app/lecturer/courses')} icon={<Plus className="h-4 w-4" />} variant="gradient">
          Create Course
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          const iconColors: Record<string, string> = {
            primary: 'bg-primary/10 text-primary',
            accent: 'bg-accent/10 text-accent',
            success: 'bg-success/10 text-success',
            warning: 'bg-warning/10 text-warning',
          }
          return (
            <Card key={stat.label} padding="responsive">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-0 truncate">{stat.label}</span>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconColors[stat.variant] || 'bg-muted text-foreground'}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2 tabular-nums">{stat.value}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-accent" />
              Your Courses
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/app/lecturer/courses')} iconRight={<ArrowRight className="h-4 w-4" />}>
              View All
            </Button>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Course</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Students</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Revenue</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(stats?.course_stats ?? []).length > 0 ? (
                    (stats?.course_stats ?? []).map((c) => (
                      <tr key={c.course_id} className="hover:bg-muted/30 cursor-pointer transition" onClick={() => navigate(`/app/lecturer/courses/${c.course_id}`)}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground text-sm">{c.title}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums">{c.enrollment_count}</td>
                        <td className="px-4 py-3 text-sm tabular-nums">${c.revenue.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          {c.rating_avg ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-warning fill-warning" />
                              <span className="text-sm tabular-nums">{c.rating_avg.toFixed(1)}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No ratings</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        {courses.length > 0
                          ? 'Stat data not yet available'
                          : 'No courses yet. Create your first course to get started.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Quick Stats
          </h2>

          <Card className="divide-y divide-border">
            <div className="p-4 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Total Courses</p>
                <p className="text-xs text-muted-foreground tabular-nums">{stats?.total_courses ?? 0} courses</p>
              </div>
            </div>
            <div className="p-4 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                <Users className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Total Students</p>
                <p className="text-xs text-muted-foreground tabular-nums">{stats?.total_students ?? 0} enrolled</p>
              </div>
            </div>
            <div className="p-4 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning">
                <Star className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Avg Rating</p>
                <p className="text-xs text-muted-foreground tabular-nums">{stats?.avg_rating ? `${stats.avg_rating.toFixed(1)} / 5` : 'No ratings yet'}</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/app/lecturer/students')} className="h-auto py-3 flex-col gap-1.5">
              <Users className="h-5 w-5" />
              <span className="text-xs">Students</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/lecturer/analytics')} className="h-auto py-3 flex-col gap-1.5">
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs">Analytics</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
