import { useState, useEffect, useCallback } from 'react'
/* eslint-disable react-hooks/set-state-in-effect */
import { useParams, useNavigate, Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { coursesApi, enrollmentsApi, type Course, type Enrollment } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'

export function CourseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)

  const loadCourse = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [courseRes, enrollRes] = await Promise.all([
        coursesApi.get(id),
        enrollmentsApi.list({ status: 'active' }).catch(() => ({ data: { items: [] } }))
      ])
      setCourse(courseRes.data)
      const userEnrollment = enrollRes.data.items.find((e: Enrollment) => e.course_id === id)
      setEnrollment(userEnrollment || null)
    } catch (err) {
      console.error('Failed to load course:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadCourse()
  }, [loadCourse])

  const handleEnroll = async (paymentMethod?: 'vnpay' | 'momo') => {
    if (!id) return
    if (course?.price === 0) {
      paymentMethod = undefined
    }
    setEnrolling(true)
    try {
      const res = await enrollmentsApi.enroll(id, paymentMethod)
      if (res.data.payment_url) {
        window.location.href = res.data.payment_url
      } else {
        setEnrollment(res.data.enrollment)
        navigate(`/app/courses/${id}/learn`)
      }
    } catch (err) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      const msg = axiosErr?.response?.data?.detail || 'Failed to enroll'
      alert(msg)
    } finally {
      setEnrolling(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    return `${mins} phút`
  }

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'pdf': return '📄'
      case 'docx': return '📝'
      case 'video': return '🎬'
      case 'image': return '🖼️'
      case 'url': return '🔗'
      default: return '📎'
    }
  }

  const getMaterialDuration = (material: Course['materials'][0]) => {
    if (material.duration_seconds) return formatDuration(material.duration_seconds)
    if (material.page_count) return `${material.page_count} trang`
    if (material.file_size) return `${Math.round(material.file_size / 1024)} KB`
    return null
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-foreground">Không tìm thấy khóa học</h2>
        <Link to="/app/courses" className="text-primary hover:underline mt-2 block">
          Quay lại danh sách khóa học
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl flex items-center justify-center overflow-hidden">
            {course.thumbnail_url ? (
              <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-6xl">📚</span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {course.category && (
                <Badge variant="primary" label={course.category.name} />
              )}
              <Badge variant={course.status === 'published' ? 'success' : 'warning'} label={course.status === 'published' ? 'Đang mở' : course.status} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">{course.title}</h1>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-medium text-primary">
                  {course.lecturer?.full_name?.[0] || 'L'}
                </div>
                <div>
                  <p className="font-medium text-foreground">{course.lecturer?.full_name || 'Giảng viên'}</p>
                  <p className="text-sm text-muted-foreground">{course.enrollment_count} học viên</p>
                </div>
              </div>
            </div>

            <div className="max-w-none">
              <h2 className="text-xl font-semibold mb-3 text-foreground">Mô tả khóa học</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{course.description}</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-foreground">Nội dung khóa học ({course.materials?.length || 0} bài)</h2>
            <div className="space-y-2">
              {course.materials?.map((material, index) => (
                <Card key={material.id} padding="responsive" className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg">{getMaterialIcon(material.material_type)}</span>
                      <span className="font-medium text-foreground truncate">{material.title}</span>
                      {material.is_preview && <Badge variant="warning" label="Xem trước" />}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getMaterialDuration(material) || material.material_type.toUpperCase()}
                    </p>
                  </div>
                  {enrollment && (
                    <Link to={`/app/courses/${course.id}/learn?material=${material.id}`}>
                      <Button variant="ghost" size="sm">Học ngay</Button>
                    </Link>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Card padding="responsive" className="lg:sticky lg:top-4">
            <div className="text-center mb-6">
              {course.price === 0 ? (
                <span className="text-3xl font-bold text-success">Miễn phí</span>
              ) : (
                <span className="text-3xl font-bold text-primary">
                  {new Intl.NumberFormat('vi-VN').format(course.price)}đ
                </span>
              )}
            </div>

            {enrollment ? (
              <div className="space-y-3">
                <div className="text-center text-success font-medium mb-2">
                  ✓ Bạn đã đăng ký khóa học này
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Tiến độ</span>
                    <span className="text-foreground font-medium">{enrollment.progress_percent || 0}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${enrollment.progress_percent || 0}%` }}
                    />
                  </div>
                </div>
                <Link to={`/app/courses/${course.id}/learn`} className="block">
                  <Button className="w-full">Tiếp tục học</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {course.price === 0 ? (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => handleEnroll()}
                    disabled={enrolling}
                  >
                    {enrolling ? 'Đang đăng ký...' : 'Đăng ký miễn phí'}
                  </Button>
                ) : (
                  <>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => handleEnroll('vnpay')}
                      disabled={enrolling}
                    >
                      Thanh toán qua VNPay
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      size="lg"
                      onClick={() => handleEnroll('momo')}
                      disabled={enrolling}
                    >
                      Thanh toán qua MoMo
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Đăng ký = Thanh toán → Học ngay. Không hoàn tiền.
                    </p>
                  </>
                )}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-border space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-4 w-4 shrink-0" />
                <span>{course.materials?.length || 0} bài học</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span role="img" aria-label="students">👥</span>
                <span>{course.enrollment_count} học viên</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span role="img" aria-label="time">⏱️</span>
                <span>Học mọi lúc, mọi nơi</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span role="img" aria-label="unlimited">🔄</span>
                <span>Học lại không giới hạn</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}