import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { coursesApi, enrollmentsApi, type Course, type Enrollment } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { useAppStore } from '../../stores/appStore'

export function CourseManage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCourse, setNewCourse] = useState({ title: '', description: '', price: 0, category_id: '' })
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAppStore()

  const isLecturer = auth.user?.role === 'lecturer' || auth.user?.role === 'admin'

  const mountedRef = useRef(false)

  const loadData = useCallback(async () => {
    if (!isLecturer) return
    setLoading(true)
    try {
      const [coursesRes, enrollRes] = await Promise.all([
        coursesApi.list({ status: 'published', page_size: 100 }).catch(() => ({ data: { items: [] } })),
        enrollmentsApi.list({ page_size: 100 }).catch(() => ({ data: { items: [] } }))
      ])
      setCourses(coursesRes.data.items)
      setEnrollments(enrollRes.data.items)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }, [isLecturer])

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      loadData()
    }
  }, [loadData])

  const handleCreateCourse = async () => {
    if (!newCourse.title) return
    setCreating(true)
    try {
      const res = await coursesApi.create(newCourse)
      navigate(`/app/courses/${res.data.id}/edit`)
    } catch (err) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      alert(axiosErr?.response?.data?.detail || 'Failed to create course')
    } finally {
      setCreating(false)
    }
  }

  const getEnrollmentCount = (courseId: string) => {
    return enrollments.filter(e => e.course_id === courseId).length
  }

  const getTotalRevenue = (courseId: string) => {
    const course = courses.find(c => c.id === courseId)
    if (!course) return 0
    const count = getEnrollmentCount(courseId)
    return count * course.price
  }

  if (!isLecturer) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2 text-foreground">Không có quyền truy cập</h2>
        <p className="text-muted-foreground">Chỉ giảng viên mới có thể quản lý khóa học</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-fluid-2xl font-bold text-foreground">Quản lý khóa học</h1>
          <p className="text-muted-foreground">Tạo và quản lý các khóa học của bạn</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} icon={<Plus className="h-4 w-4" />} fullWidthMobile>
          Tạo khóa học mới
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} padding="responsive">
              <Skeleton className="h-32 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card padding="responsive" className="text-center py-12">
          <span className="text-4xl mb-4 block">📚</span>
          <h3 className="text-lg font-medium mb-2 text-foreground">Chưa có khóa học nào</h3>
          <p className="text-muted-foreground mb-4">Tạo khóa học đầu tiên của bạn</p>
          <Button onClick={() => setShowCreateModal(true)}>Tạo khóa học</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Card key={course.id} padding="responsive">
              <div className="aspect-video bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">📚</span>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold line-clamp-1 text-foreground">{course.title}</h3>
                  <Badge variant={course.status === 'published' ? 'success' : 'warning'} label={course.status === 'published' ? 'Đã xuất bản' : course.status} className="shrink-0" />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                  <span className="text-muted-foreground">
                    {getEnrollmentCount(course.id)} học viên
                  </span>
                  <span className="font-medium text-primary">
                    {new Intl.NumberFormat('vi-VN').format(getTotalRevenue(course.id))}đ
                  </span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Link to={`/app/courses/${course.id}`} className="flex-1">
                    <Button variant="outline" size="sm" fullWidth>Xem</Button>
                  </Link>
                  <Link to={`/app/courses/${course.id}/edit`} className="flex-1">
                    <Button variant="outline" size="sm" fullWidth>Sửa</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tạo khóa học mới"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tiêu đề khóa học</label>
            <Input
              value={newCourse.title}
              onChange={(value) => setNewCourse(prev => ({ ...prev, title: value }))}
              placeholder="Nhập tiêu đề khóa học"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <textarea
              value={newCourse.description}
              onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Mô tả khóa học"
              className="w-full p-2 border rounded-lg min-h-[100px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Giá (0 = miễn phí)</label>
            <Input
              type="number"
              value={newCourse.price}
              onChange={(value) => setNewCourse(prev => ({ ...prev, price: Number(value) }))}
              min={0}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateCourse} disabled={creating || !newCourse.title}>
              {creating ? 'Đang tạo...' : 'Tạo khóa học'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}