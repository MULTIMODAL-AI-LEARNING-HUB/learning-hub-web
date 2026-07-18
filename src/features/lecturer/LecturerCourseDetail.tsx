import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowLeft, Edit, Users, BarChart3, BookOpen, Star, DollarSign, TrendingUp, ClipboardCheck } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { coursesApi } from '../../services/api'
import type { Course } from '../../services/api'
import { CourseContentManager } from './CourseContentManager'
import { ReviewsManager } from './ReviewsManager'
import { CourseChatPanel } from '../courses/CourseChatPanel'

type Tab = 'content' | 'chat' | 'grading' | 'reviews' | 'students' | 'analytics'

interface CourseAnalytics {
  total_students: number
  enrollment_count: number
  revenue: number
  rating_avg: number
  rating_count: number
}

export function LecturerCourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState<Tab>('content')

  useEffect(() => {
    if (id) {
      Promise.all([
        coursesApi.get(id),
        coursesApi.getStats().catch(() => null),
      ]).then(([courseRes, statsRes]) => {
        setCourse(courseRes.data)
        const stats = statsRes?.data?.course_stats?.find((c: { course_id: string }) => c.course_id === id)
        if (stats) {
          setAnalytics({
            total_students: stats.enrollment_count,
            enrollment_count: stats.enrollment_count,
            revenue: stats.revenue,
            rating_avg: stats.rating_avg,
            rating_count: 0,
          })
        }
        setLoading(false)
      }).catch(() => {
        navigate('/app/lecturer/courses')
      })
    }
  }, [id, navigate])

  if (loading || !course) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <Badge variant="success" label="Published" />
      case 'draft': return <Badge variant="warning" label="Draft" />
      case 'archived': return <Badge variant="default" label="Archived" />
      default: return <Badge variant="default" label={status} />
    }
  }

  const tabs = [
    { id: 'content' as Tab, label: 'Content' },
    { id: 'chat' as Tab, label: 'Chat' },
    { id: 'grading' as Tab, label: 'To Grade' },
    { id: 'reviews' as Tab, label: 'Reviews' },
    { id: 'students' as Tab, label: 'Students' },
    { id: 'analytics' as Tab, label: 'Analytics' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button onClick={() => navigate('/app/lecturer/courses')} className="text-sm text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Courses
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-fluid-2xl font-bold text-foreground">{course.title}</h1>
            {getStatusBadge(course.status)}
          </div>
          <p className="text-muted-foreground mt-1">{course.description}</p>
        </div>
        <Button variant="outline" icon={<Edit className="h-4 w-4" />} onClick={() => navigate('/app/lecturer/courses')} fullWidthMobile>
          Edit Details
        </Button>
      </div>

      <div className="border-b border-border overflow-x-auto">
        <nav className="flex gap-4 min-w-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-1 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {activeTab === 'content' && <CourseContentManager course={course} />}
        {activeTab === 'chat' && <CourseChatPanel courseId={course.id} />}
        {activeTab === 'grading' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-accent" />
              To Grade
            </h2>
            <Card className="p-8 text-center">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Course submissions</h3>
              <p className="text-muted-foreground">Assignment submissions for this course will appear here.</p>
            </Card>
          </div>
        )}
        {activeTab === 'reviews' && <ReviewsManager courseId={course.id} />}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Enrolled Students
            </h2>
            {analytics ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card padding="responsive">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Students</span>
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-foreground mt-2 tabular-nums">{analytics.total_students}</p>
                </Card>
                <Card padding="responsive">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rating</span>
                    <Star className="h-4 w-4 text-warning" />
                  </div>
                  <p className="text-2xl font-bold text-foreground mt-2 tabular-nums">
                    {analytics.rating_avg > 0 ? `${analytics.rating_avg.toFixed(1)} / 5` : '—'}
                  </p>
                </Card>
                <Card padding="responsive">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Revenue</span>
                    <DollarSign className="h-4 w-4 text-success" />
                  </div>
                  <p className="text-2xl font-bold text-foreground mt-2 tabular-nums">${analytics.revenue.toLocaleString()}</p>
                </Card>
                <Card padding="responsive">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Course Status</span>
                    <TrendingUp className="h-4 w-4 text-accent" />
                  </div>
                  <p className="text-2xl font-bold text-foreground mt-2 capitalize">{course.status}</p>
                </Card>
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No student data yet</h3>
                <p className="text-muted-foreground">Student enrollments will appear here once your course is published and students enroll.</p>
              </Card>
            )}
          </div>
        )}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-accent" />
              Course Analytics
            </h2>
            {analytics ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card padding="responsive" className="text-center">
                  <BookOpen className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="text-3xl font-bold text-foreground tabular-nums">{analytics.enrollment_count}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Enrollments</p>
                </Card>
                <Card padding="responsive" className="text-center">
                  <Star className="h-8 w-8 text-warning mx-auto mb-3" />
                  <p className="text-3xl font-bold text-foreground tabular-nums">
                    {analytics.rating_avg > 0 ? analytics.rating_avg.toFixed(1) : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Average Rating</p>
                </Card>
                <Card padding="responsive" className="text-center">
                  <DollarSign className="h-8 w-8 text-success mx-auto mb-3" />
                  <p className="text-3xl font-bold text-foreground tabular-nums">${analytics.revenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Revenue</p>
                </Card>
                <Card padding="responsive">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Course Info</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-medium text-foreground">${course.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-medium text-foreground">{course.category_id || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Level</span>
                      <span className="font-medium text-foreground capitalize">{course.level || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Language</span>
                      <span className="font-medium text-foreground">{course.language || '—'}</span>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="p-8 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Analytics not available</h3>
                <p className="text-muted-foreground">Course analytics will be available once your course has enrollments.</p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
