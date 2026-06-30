import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowLeft, Edit, Users, BarChart3 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Course, coursesApi } from '../../services/api'
import { CourseContentManager } from './CourseContentManager'
import { ReviewsManager } from './ReviewsManager'

type Tab = 'content' | 'reviews' | 'students' | 'analytics'

export function LecturerCourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('content')

  useEffect(() => {
    if (id) {
      coursesApi.get(id).then(res => {
        setCourse(res.data)
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
      case 'published': return <Badge variant="success">Published</Badge>
      case 'draft': return <Badge variant="warning">Draft</Badge>
      case 'archived': return <Badge variant="default">Archived</Badge>
      default: return <Badge variant="default">{status}</Badge>
    }
  }

  const tabs = [
    { id: 'content' as Tab, label: 'Content', icon: null },
    { id: 'reviews' as Tab, label: 'Reviews', icon: null },
    { id: 'students' as Tab, label: 'Students', icon: null },
    { id: 'analytics' as Tab, label: 'Analytics', icon: null },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/app/lecturer/courses')} className="text-sm text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Courses
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{course.title}</h1>
            {getStatusBadge(course.status)}
          </div>
          <p className="text-muted-foreground mt-1">{course.description}</p>
        </div>
        <Button variant="outline" icon={<Edit className="h-4 w-4" />}>
          Edit Details
        </Button>
      </div>

      <div className="border-b border-border">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-1 py-3 text-sm font-medium border-b-2 transition ${
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
        {activeTab === 'reviews' && <ReviewsManager courseId={course.id} />}
        {activeTab === 'students' && (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Student Management</h3>
            <p className="text-muted-foreground">View and manage enrolled students</p>
          </Card>
        )}
        {activeTab === 'analytics' && (
          <Card className="p-8 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Course Analytics</h3>
            <p className="text-muted-foreground">Track performance and engagement</p>
          </Card>
        )}
      </div>
    </div>
  )
}