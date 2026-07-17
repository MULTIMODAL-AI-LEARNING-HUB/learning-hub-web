import { useEffect, useState } from 'react'
import { BarChart3, BookOpen, Users, Star, TrendingUp, DollarSign } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { coursesApi } from '../../services/api'

interface StatsData {
  total_courses: number
  total_students: number
  total_revenue: number
  avg_rating: number
  recent_enrollments: { date: string; count: number }[]
  course_stats: { course_id: string; title: string; enrollment_count: number; revenue: number; rating_avg: number }[]
}

export function LecturerAnalytics() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    coursesApi.getStats().then(res => {
      setStats(res.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" description="Track performance and engagement" icon={<BarChart3 />} />
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading analytics...</div>
        </div>
      </div>
    )
  }

  const recentEnrollments = stats?.recent_enrollments ?? []
  const courseStats = stats?.course_stats ?? []

  const maxEnrollment = Math.max(...recentEnrollments.map(e => e.count), 1)
  const totalRevenue = stats?.total_revenue ?? 0
  const totalEnrollments = stats?.total_students ?? 0

  const sortedByRevenue = [...courseStats].sort((a, b) => b.revenue - a.revenue)
  const sortedByEnrollment = [...courseStats].sort((a, b) => b.enrollment_count - a.enrollment_count)
  const sortedByRating = [...courseStats].filter(c => c.rating_avg > 0).sort((a, b) => b.rating_avg - a.rating_avg)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Analytics"
        description="Track performance and engagement across your courses"
        icon={<BarChart3 />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="responsive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Revenue</span>
            <DollarSign className="h-4 w-4 text-success" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2 tabular-nums">${totalRevenue.toLocaleString()}</p>
        </Card>
        <Card padding="responsive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Students</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2 tabular-nums">{totalEnrollments}</p>
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
            <Star className="h-4 w-4 text-warning" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2 tabular-nums">
            {stats?.avg_rating ? `${stats.avg_rating.toFixed(1)} / 5` : '—'}
          </p>
        </Card>
      </div>

      {recentEnrollments.length > 0 && (
        <Card>
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground">Recent Enrollments Trend</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Daily new enrollments over time</p>
          </div>
          <div className="p-4">
            <div className="flex items-end gap-1 h-32">
              {recentEnrollments.map((e, i) => {
                const heightPct = maxEnrollment > 0 ? (e.count / maxEnrollment) * 100 : 0
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col items-center justify-end h-28">
                      <div
                        className="w-full rounded-t bg-primary/80 hover:bg-primary transition-all min-h-1"
                        style={{ height: `${Math.max(heightPct, 4)}%` }}
                        title={`${e.count} enrollments on ${e.date}`}
                      />
                    </div>
                  <span className="metadata-text text-muted-foreground truncate w-full text-center">
                      {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Oldest</span>
              <span>Most recent</span>
            </div>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground">Top by Revenue</h3>
          </div>
          <div className="divide-y divide-border">
            {sortedByRevenue.slice(0, 5).map((c, i) => (
              <div key={c.course_id} className="px-4 py-3 flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                </div>
                <span className="text-sm font-semibold text-success tabular-nums shrink-0">
                  ${c.revenue.toLocaleString()}
                </span>
              </div>
            ))}
            {sortedByRevenue.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">No data</div>
            )}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground">Top by Students</h3>
          </div>
          <div className="divide-y divide-border">
            {sortedByEnrollment.slice(0, 5).map((c, i) => (
              <div key={c.course_id} className="px-4 py-3 flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                </div>
                <span className="text-sm font-semibold text-primary tabular-nums shrink-0">
                  {c.enrollment_count}
                </span>
              </div>
            ))}
            {sortedByEnrollment.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">No data</div>
            )}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground">Top by Rating</h3>
          </div>
          <div className="divide-y divide-border">
            {sortedByRating.slice(0, 5).map((c, i) => (
              <div key={c.course_id} className="px-4 py-3 flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                </div>
                <span className="text-sm font-semibold text-warning tabular-nums shrink-0 flex items-center gap-1">
                  ★ {c.rating_avg.toFixed(1)}
                </span>
              </div>
            ))}
            {sortedByRating.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">No ratings yet</div>
            )}
          </div>
        </Card>
      </div>

      {courseStats.length === 0 && (
        <Card className="p-12 text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Analytics not available yet</h3>
          <p className="text-muted-foreground">Start publishing courses and getting enrollments to see analytics data.</p>
        </Card>
      )}
    </div>
  )
}
