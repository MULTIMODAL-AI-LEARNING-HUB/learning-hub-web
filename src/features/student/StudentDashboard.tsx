import { useNavigate } from 'react-router-dom'
import { BookOpen, FileText, MessageSquare, GraduationCap, Sparkles, ArrowRight, Clock, TrendingUp, Award } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

export function StudentDashboard() {
  const navigate = useNavigate()
  const user = useAppStore((s) => s.auth.user)

  const getGreeting = () => {
    const hr = new Date().getHours()
    if (hr < 12) return 'Good morning'
    if (hr < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const courses = [
    { id: 1, title: 'Introduction to Machine Learning', progress: 68, lessons: 12, completed: 8 },
    { id: 2, title: 'Data Structures & Algorithms', progress: 45, lessons: 20, completed: 9 },
    { id: 3, title: 'Web Development Fundamentals', progress: 82, lessons: 15, completed: 12 },
  ]

  const recentActivity = [
    { type: 'quiz', title: 'Completed ML Quiz', score: 85, time: '2 hours ago' },
    { type: 'chat', title: 'AI Chat about Neural Networks', time: '4 hours ago' },
    { type: 'flashcard', title: 'Reviewed 25 flashcards', time: 'Yesterday' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">Ready to continue learning today?</p>
        </div>
        <Button onClick={() => navigate('/app/student/quiz')} icon={<Sparkles className="h-4 w-4" />} variant="gradient">
          Generate Quiz
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enrolled</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{courses.length}</p>
          <p className="text-xs text-muted-foreground">Active courses</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Documents</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">12</p>
          <p className="text-xs text-muted-foreground">Uploaded files</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Sessions</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">8</p>
          <p className="text-xs text-muted-foreground">Chat sessions</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Score</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">78%</p>
          <p className="text-xs text-muted-foreground">Quiz average</p>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Courses Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Continue Learning
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/app/student/courses')} iconRight={<ArrowRight className="h-4 w-4" />}>
              View All
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <Card key={course.id} className="p-4 cursor-pointer hover:shadow-lift transition-all" onClick={() => navigate(`/app/student/courses/${course.id}`)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <Badge variant={course.progress >= 70 ? 'success' : course.progress >= 50 ? 'warning' : 'default'} label={`${course.progress}%`} />
                </div>
                <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{course.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{course.completed}/{course.lessons} lessons completed</p>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${course.progress}%` }} />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Activity Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            Recent Activity
          </h2>

          <Card className="divide-y divide-border">
            {recentActivity.map((activity, i) => (
              <div key={i} className="p-4 flex items-start gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  activity.type === 'quiz' ? 'bg-success/10 text-success' :
                  activity.type === 'chat' ? 'bg-primary/10 text-primary' :
                  'bg-accent/10 text-accent'
                }`}>
                  {activity.type === 'quiz' ? <Award className="h-4 w-4" /> :
                   activity.type === 'chat' ? <MessageSquare className="h-4 w-4" /> :
                   <TrendingUp className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{activity.title}</p>
                  {activity.type === 'quiz' && 'score' in activity && (
                    <p className="text-xs text-success font-medium">Score: {activity.score}%</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/app/student/chat')} className="h-auto py-3 flex-col gap-1.5">
              <MessageSquare className="h-5 w-5" />
              <span className="text-xs">AI Chat</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/student/flashcards')} className="h-auto py-3 flex-col gap-1.5">
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs">Flashcards</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}