import { useNavigate } from 'react-router-dom'
import { BookOpen, Users, BarChart3, TrendingUp, Award, Clock, ArrowRight, Plus } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../utils/cn'

export function LecturerDashboard() {
  const navigate = useNavigate()
  const user = useAppStore((s) => s.auth.user)

  const getGreeting = () => {
    const hr = new Date().getHours()
    if (hr < 12) return 'Good morning'
    if (hr < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const stats = [
    { label: 'Total Courses', value: 5, icon: BookOpen, variant: 'primary' as const },
    { label: 'Total Students', value: 128, icon: Users, variant: 'accent' as const },
    { label: 'Avg Completion', value: '72%', icon: TrendingUp, variant: 'success' as const },
    { label: 'Pending Reviews', value: 12, icon: Award, variant: 'warning' as const },
  ]

  const courses = [
    { id: 1, title: 'Introduction to Machine Learning', students: 45, completion: 68, pending: 3 },
    { id: 2, title: 'Data Structures & Algorithms', students: 38, completion: 45, pending: 5 },
    { id: 3, title: 'Web Development Fundamentals', students: 52, completion: 82, pending: 1 },
    { id: 4, title: 'Database Systems', students: 33, completion: 55, pending: 4 },
  ]

  const recentSubmissions = [
    { student: 'Alice Johnson', course: 'ML Basics', type: 'Essay', score: 85, time: '2 hours ago' },
    { student: 'Bob Smith', course: 'DSA', type: 'Quiz', score: 92, time: '4 hours ago' },
    { student: 'Carol White', course: 'Web Dev', type: 'Assignment', score: 78, time: 'Yesterday' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-fluid-2xl font-bold text-foreground">
            {getGreeting()}, {user?.name?.split(' ')[0]}! 👨‍🏫
          </h1>
          <p className="text-muted-foreground mt-1">Here's an overview of your teaching activity.</p>
        </div>
        <Button onClick={() => navigate('/app/lecturer/courses/create')} icon={<Plus className="h-4 w-4" />} variant="gradient">
          Create Course
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
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
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', iconColors[stat.variant] || 'bg-muted text-foreground')}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
            </Card>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Courses Table */}
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
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completion</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {courses.map((course) => (
                    <tr key={course.id} className="hover:bg-muted/30 cursor-pointer transition" onClick={() => navigate(`/app/lecturer/courses/${course.id}`)}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground text-sm">{course.title}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{course.students}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-muted">
                            <div className="h-full rounded-full bg-success" style={{ width: `${course.completion}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{course.completion}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {course.pending > 0 ? (
                          <Badge variant="warning" label={`${course.pending}`} />
                        ) : (
                          <Badge variant="success" label="0" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Recent Submissions */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Pending Reviews
          </h2>

          <Card className="divide-y divide-border">
            {recentSubmissions.map((submission, i) => (
              <div key={i} className="p-4 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent text-sm font-semibold">
                  {submission.student.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{submission.student}</p>
                  <p className="text-xs text-muted-foreground">{submission.course} • {submission.type}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={submission.score >= 80 ? 'success' : submission.score >= 60 ? 'warning' : 'default'} label={`${submission.score}%`} />
                    <span className="text-2xs text-muted-foreground">{submission.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </Card>

          {/* Quick Actions */}
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