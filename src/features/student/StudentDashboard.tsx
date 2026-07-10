import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, FileText, MessageSquare, GraduationCap, Sparkles, ArrowRight, Clock, TrendingUp, Award } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useStudentDashboard } from '../../hooks/useStudentDashboard'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { cn } from '../../utils/cn'

export function StudentDashboard() {
  const navigate = useNavigate()
  const user = useAppStore((s) => s.auth.user)
  const { courses, stats, recentActivity, loading, fetchDashboard } = useStudentDashboard()

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const getGreeting = () => {
    const hr = new Date().getHours()
    if (hr < 12) return 'Good morning'
    if (hr < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    return date.toLocaleDateString('vi-VN')
  }

  return (
    <div className="space-y-6 animate-fade-in font-body">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/10 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent p-6 glow-student">
        <div className="absolute right-0 top-0 h-32 w-32 bg-blue-500/5 rounded-full blur-2xl animate-pulse" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-fluid-2xl font-bold text-foreground">
              {getGreeting()}, <span className="gradient-text-animated font-extrabold">{user?.name?.split(' ')[0]}</span>! 👋
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Welcome back to your personalized learning workspace. What are we studying today?</p>
          </div>
          <Button 
            onClick={() => navigate('/app/student/quiz')} 
            icon={<Sparkles className="h-4 w-4" />} 
            variant="gradient"
            className="shadow-soft shadow-blue-500/20 bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-95"
          >
            Generate AI Quiz
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="responsive" className="border-blue-500/10 hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-muted-foreground uppercase tracking-wider">Enrolled</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16 mt-2" />
          ) : (
            <p className="text-2xl font-bold text-foreground mt-2 tabular-nums">{stats?.total_enrolled ?? 0}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Active courses</p>
        </Card>

        <Card padding="responsive" className="border-cyan-500/10 hover:shadow-cyan-500/5 hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-muted-foreground uppercase tracking-wider">Materials</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16 mt-2" />
          ) : (
            <p className="text-2xl font-bold text-foreground mt-2 tabular-nums">{stats?.total_materials ?? 0}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Reference materials</p>
        </Card>

        <Card padding="responsive" className="border-emerald-500/10 hover:shadow-emerald-500/5 hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-muted-foreground uppercase tracking-wider">Completed</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16 mt-2" />
          ) : (
            <p className="text-2xl font-bold text-foreground mt-2 tabular-nums">{stats?.total_completed ?? 0}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Lessons done</p>
        </Card>

        <Card padding="responsive" className="border-amber-500/10 hover:shadow-amber-500/5 hover:-translate-y-0.5 transition-all glow-student">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-muted-foreground uppercase tracking-wider">Avg Progress</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16 mt-2" />
          ) : (
            <p className="text-2xl font-bold text-foreground mt-2 tabular-nums">{stats?.avg_progress ?? 0}%</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Overall completion rate</p>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Courses Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-blue-500" />
              Continue Learning
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/app/student/courses')} 
              iconRight={<ArrowRight className="h-4 w-4" />}
              className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/5"
            >
              View All
            </Button>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Card key={i} padding="responsive">
                  <div className="flex items-start justify-between mb-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-3" />
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </Card>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <Card padding="responsive" className="text-center py-10 border-dashed border-2 border-border/60 bg-transparent">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/60 mb-3" />
              <p className="text-muted-foreground mb-4 text-sm">You haven&apos;t enrolled in any courses yet.</p>
              <Button onClick={() => navigate('/app/student/browse')}>Browse Courses</Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {courses.slice(0, 4).map((course) => (
                <Card 
                  key={course.id} 
                  padding="responsive" 
                  className="cursor-pointer hover:shadow-lift hover:-translate-y-0.5 border-blue-500/5 transition-all duration-200" 
                  onClick={() => navigate(`/app/student/courses/${course.course_id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400 overflow-hidden ring-1 ring-blue-500/10">
                      {course.course_thumbnail ? (
                        <img src={course.course_thumbnail} alt={course.course_title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="h-6 w-6" />
                      )}
                    </div>
                    <Badge 
                      variant={course.completion_percent >= 70 ? 'success' : course.completion_percent >= 50 ? 'warning' : 'default'} 
                      label={`${Math.round(course.completion_percent)}%`} 
                      className={cn(
                        course.completion_percent >= 70 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                        course.completion_percent >= 50 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                        'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      )}
                    />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1 text-sm line-clamp-1 hover:text-blue-500 transition-colors">{course.course_title}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{course.completed_materials}/{course.total_materials} materials completed</p>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all" style={{ width: `${course.completion_percent}%` }} />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Activity Section */}
        <div className="space-y-4">
          <h2 className="text-base font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-cyan-500" />
            Recent Activity
          </h2>

          <Card className="divide-y divide-border/60 border-blue-500/10 shadow-soft">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-2 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="p-6 text-center">
                <Clock className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
                <p className="text-xs text-muted-foreground">No recent study sessions recorded</p>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="p-3.5 flex items-start gap-3 hover:bg-muted/30 transition-all">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ${
                    activity.activity_type === 'quiz' ? 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20' :
                    activity.activity_type === 'chat' ? 'bg-blue-500/10 text-blue-600 ring-blue-500/20' :
                    'bg-cyan-500/10 text-cyan-600 ring-cyan-500/20'
                  }`}>
                    {activity.activity_type === 'quiz' ? <Award className="h-4 w-4" /> :
                     activity.activity_type === 'chat' ? <MessageSquare className="h-4 w-4" /> :
                     <TrendingUp className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{activity.title}</p>
                    {activity.activity_type === 'quiz' && activity.score !== null && (
                      <p className="text-2xs text-emerald-600 font-bold mt-0.5">Score: {activity.score}%</p>
                    )}
                    <p className="text-3xs text-muted-foreground mt-0.5">{formatRelativeTime(activity.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/app/student/chat')} 
              className="h-auto py-3.5 flex-col gap-2 border-blue-500/20 hover:bg-blue-500/5 text-foreground hover:text-blue-600 rounded-xl"
            >
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <span className="text-xs font-semibold">AI Tutor Chat</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/app/student/flashcards')} 
              className="h-auto py-3.5 flex-col gap-2 border-cyan-500/20 hover:bg-cyan-500/5 text-foreground hover:text-cyan-600 rounded-xl"
            >
              <TrendingUp className="h-5 w-5 text-cyan-500" />
              <span className="text-xs font-semibold">Flashcards</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}