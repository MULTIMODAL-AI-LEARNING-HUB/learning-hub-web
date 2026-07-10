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
    <div className="space-y-6 animate-fade-in font-body">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-500/10 bg-gradient-to-r from-violet-500/5 via-transparent to-transparent p-6 glow-lecturer">
        <div className="absolute right-0 top-0 h-32 w-32 bg-violet-500/5 rounded-full blur-2xl animate-pulse" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-fluid-2xl font-bold text-foreground">
              {getGreeting()}, <span className="gradient-text-animated font-extrabold">{user?.name?.split(' ')[0]}</span>! 👋
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Here is an overview of your teaching performance and analytics updates.</p>
          </div>
          <Button 
            onClick={() => navigate('/app/lecturer/courses')} 
            icon={<Plus className="h-4 w-4" />} 
            variant="gradient"
            className="shadow-soft shadow-violet-500/20 bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:opacity-95"
          >
            Create New Course
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
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
            <Card 
              key={stat.label} 
              padding="responsive"
              className={cn(
                "border-violet-500/5 hover:-translate-y-0.5 transition-all duration-200 shadow-soft",
                stat.variant === 'accent' ? 'glow-lecturer border-violet-500/10' : ''
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xs font-bold text-muted-foreground uppercase tracking-wider min-w-0 truncate">{stat.label}</span>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconColors[stat.variant] || 'bg-muted text-foreground'}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2 tabular-nums">{stat.value}</p>
            </Card>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Course performance table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-violet-500" />
              Active Courses Metrics
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/app/lecturer/courses')} 
              iconRight={<ArrowRight className="h-4 w-4" />}
              className="text-violet-500 hover:text-violet-600 hover:bg-violet-500/5"
            >
              Manage Courses
            </Button>
          </div>

          <Card className="overflow-hidden border-violet-500/10 shadow-soft bg-surface-elevated/40 backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-3 text-3xs font-semibold text-muted-foreground uppercase tracking-wider">Course Details</th>
                    <th className="text-left px-4 py-3 text-3xs font-semibold text-muted-foreground uppercase tracking-wider">Students</th>
                    <th className="text-left px-4 py-3 text-3xs font-semibold text-muted-foreground uppercase tracking-wider">Total Revenue</th>
                    <th className="text-left px-4 py-3 text-3xs font-semibold text-muted-foreground uppercase tracking-wider">Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {(stats?.course_stats ?? []).length > 0 ? (
                    (stats?.course_stats ?? []).map((c) => (
                      <tr 
                        key={c.course_id} 
                        className="hover:bg-violet-500/5 cursor-pointer transition-all duration-150" 
                        onClick={() => navigate(`/app/lecturer/courses/${c.course_id}`)}
                      >
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-foreground text-sm hover:text-violet-500 transition-colors">{c.title}</p>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground tabular-nums">{c.enrollment_count} enrolled</td>
                        <td className="px-4 py-3.5 text-xs font-semibold text-foreground tabular-nums">${c.revenue.toLocaleString()}</td>
                        <td className="px-4 py-3.5">
                          {c.rating_avg ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-warning fill-warning" />
                              <span className="text-xs font-semibold text-foreground tabular-nums">{c.rating_avg.toFixed(1)}</span>
                            </div>
                          ) : (
                            <span className="text-3xs text-muted-foreground">No rating yet</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">
                        {courses.length > 0
                          ? 'Stat metrics are being calculated...'
                          : 'You haven\'t created any courses yet. Launch your first course!'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Sidebar cards */}
        <div className="space-y-4">
          <h2 className="text-base font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-500" />
            Performance Summary
          </h2>

          <Card className="divide-y divide-border/60 border-violet-500/10 shadow-soft">
            <div className="p-3.5 flex items-start gap-3 hover:bg-muted/20 transition-all">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-500">
                <BookOpen className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">Total Courses Created</p>
                <p className="text-2xs text-muted-foreground mt-0.5 tabular-nums">{stats?.total_courses ?? 0} active publications</p>
              </div>
            </div>
            <div className="p-3.5 flex items-start gap-3 hover:bg-muted/20 transition-all">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                <Users className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">Subscribed Audience</p>
                <p className="text-2xs text-muted-foreground mt-0.5 tabular-nums">{stats?.total_students ?? 0} students reached</p>
              </div>
            </div>
            <div className="p-3.5 flex items-start gap-3 hover:bg-muted/20 transition-all">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                <Star className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">Average Rating</p>
                <p className="text-2xs text-muted-foreground mt-0.5 tabular-nums">{stats?.avg_rating ? `${stats.avg_rating.toFixed(1)} out of 5 stars` : 'Pending student reviews'}</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/app/lecturer/students')} 
              className="h-auto py-3.5 flex-col gap-2 border-violet-500/20 hover:bg-violet-500/5 text-foreground hover:text-violet-600 rounded-xl"
            >
              <Users className="h-5 w-5 text-violet-500" />
              <span className="text-xs font-semibold">Student list</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/app/lecturer/analytics')} 
              className="h-auto py-3.5 flex-col gap-2 border-purple-500/20 hover:bg-purple-500/5 text-foreground hover:text-purple-600 rounded-xl"
            >
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <span className="text-xs font-semibold">Analytics</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
