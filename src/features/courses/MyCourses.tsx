import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { enrollmentsApi, type Enrollment } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { Progress } from '../../components/ui/Progress'
import { Tabs } from '../../components/ui/Tabs'

export function MyCourses() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')

  const mountedRef = useRef(false)

  const loadEnrollments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await enrollmentsApi.list({ page_size: 100 })
      setEnrollments(res.data.items)
    } catch (err) {
      console.error('Failed to load enrollments:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      loadEnrollments()
    }
  }, [loadEnrollments])

  const activeEnrollments = enrollments.filter(e => e.status === 'active')
  const completedEnrollments = enrollments.filter(e => e.status === 'completed')

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('vi-VN')
  }

  const EnrollmentCard = ({ enrollment }: { enrollment: Enrollment }) => (
    <Card padding="responsive">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-32 h-24 sm:h-20 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
          {enrollment.course?.thumbnail_url ? (
            <img src={enrollment.course.thumbnail_url} alt={enrollment.course?.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">📚</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <Link to={`/app/courses/${enrollment.course_id}`} className="font-semibold text-foreground hover:text-primary line-clamp-1">
              {enrollment.course?.title || 'Khóa học'}
            </Link>
            {enrollment.status === 'completed' && <Badge variant="success" label="Hoàn thành" className="shrink-0" />}
          </div>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
            {enrollment.course?.description}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Tiến độ</span>
                <span className="text-foreground font-medium">{enrollment.progress_percent || 0}%</span>
              </div>
              <Progress value={enrollment.progress_percent || 0} className="h-1.5" />
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatDate(enrollment.enrolled_at)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3 justify-end">
        <Link to={`/app/courses/${enrollment.course_id}`}>
          <Button variant="outline" size="sm">Xem khóa học</Button>
        </Link>
        {(enrollment.status === 'active' || enrollment.progress_percent === 0) && (
          <Link to={`/app/courses/${enrollment.course_id}/learn`}>
            <Button size="sm">
              {enrollment.progress_percent === 0 ? 'Bắt đầu học' : 'Tiếp tục'}
            </Button>
          </Link>
        )}
      </div>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-fluid-2xl font-bold text-foreground">Khóa học của tôi</h1>
        <p className="text-gray-600">Theo dõi tiến độ học tập của bạn</p>
      </div>

      <Tabs
        tabs={[
          { id: 'active', label: `Đang học (${activeEnrollments.length})` },
          { id: 'completed', label: `Hoàn thành (${completedEnrollments.length})` }
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as 'active' | 'completed')}
      />

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex gap-4">
                <Skeleton className="w-32 h-20" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'active' && (
            activeEnrollments.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <span className="text-4xl mb-4 block">📚</span>
                <h3 className="text-lg font-medium mb-2">Chưa có khóa học nào</h3>
                <p className="text-gray-600 mb-4">Đăng ký khóa học để bắt đầu học tập</p>
                <Link to="/app/courses">
                  <Button>Khám phá khóa học</Button>
                </Link>
              </div>
            ) : (
              activeEnrollments.map((enrollment) => (
                <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
              ))
            )
          )}
          {activeTab === 'completed' && (
            completedEnrollments.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <span className="text-4xl mb-4 block">🎓</span>
                <h3 className="text-lg font-medium mb-2">Chưa có khóa học hoàn thành</h3>
                <p className="text-gray-600">Hoàn thành khóa học để nhận chứng chỉ</p>
              </div>
            ) : (
              completedEnrollments.map((enrollment) => (
                <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
              ))
            )
          )}
        </div>
      )}
    </div>
  )
}