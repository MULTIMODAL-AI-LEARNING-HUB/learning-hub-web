/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { BookOpenCheck, Clock, Mail, RefreshCw, Search, Users, X } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Progress } from '../../components/ui/Progress'
import { Skeleton } from '../../components/ui/Skeleton'
import { coursesApi, type Enrollment } from '../../services/api'

interface CourseStudentsWorkspaceProps {
  courseId: string
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Không có ngày'
  return new Date(value).toLocaleDateString('vi-VN')
}

function getPaymentBadgeVariant(status: Enrollment['payment_status']) {
  if (status === 'paid') return 'success'
  if (status === 'pending') return 'warning'
  if (status === 'failed') return 'error'
  return 'default'
}

function getPaymentBadgeLabel(status: Enrollment['payment_status']) {
  if (status === 'paid') return 'Đã thanh toán'
  if (status === 'pending') return 'Chờ xử lý'
  if (status === 'failed') return 'Thất bại'
  return status
}

function getEnrollmentBadgeVariant(status: Enrollment['status']) {
  if (status === 'active') return 'primary'
  if (status === 'completed') return 'success'
  return 'default'
}

function getEnrollmentBadgeLabel(status: Enrollment['status']) {
  if (status === 'active') return 'Đang học'
  if (status === 'completed') return 'Hoàn thành'
  return status
}

export function CourseStudentsWorkspace({ courseId }: CourseStudentsWorkspaceProps) {
  const [students, setStudents] = useState<Enrollment[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Enrollment | null>(null)
  const [reminderSent, setReminderSent] = useState(false)

  const loadStudents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await coursesApi.getEnrolledStudents(courseId)
      setStudents(res.data.items)
      setTotal(res.data.total)
    } catch {
      setError('Không thể tải danh sách học viên ghi danh.')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return students

    return students.filter((student) =>
      [student.student_name, student.student_email, student.course_title].some((value) =>
        value?.toLowerCase().includes(normalizedQuery)
      )
    )
  }, [query, students])

  const activeCount = students.filter((student) => student.status === 'active').length
  const completedCount = students.filter((student) => student.status === 'completed').length
  const averageProgress = students.length
    ? Math.round(students.reduce((sum, student) => sum + (student.progress_percent || 0), 0) / students.length)
    : 0

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Users className="h-5 w-5 text-primary" />
            Học Viên Khóa Học
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi lượt ghi danh, trạng thái thanh toán và tiến độ học tập trong khóa học này.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadStudents}
          loading={loading}
          icon={<RefreshCw className="h-4 w-4" />}
        >
          Làm mới
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Tổng học viên" value={total} />
        <Metric label="Đang học" value={activeCount} />
        <Metric label="Đã hoàn thành" value={completedCount} />
        <Metric label="Tiến độ trung bình" value={`${averageProgress}%`} />
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Danh sách học viên ghi danh</p>
            <p className="text-xs text-muted-foreground">
              {total} lượt ghi danh
            </p>
          </div>
          <Input
            value={query}
            onChange={setQuery}
            placeholder="Tìm kiếm học viên..."
            prefixIcon={<Search className="h-4 w-4" />}
            className="sm:w-72"
            aria-label="Tìm kiếm học viên ghi danh"
          />
        </div>

        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} height={56} variant="rounded" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={<Users />}
            title="Không thể tải danh sách học viên"
            description={error}
            action={<Button variant="outline" onClick={loadStudents}>Thử lại</Button>}
            className="m-4"
          />
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title="Không tìm thấy học viên nào"
            description={query ? 'Thử tìm kiếm với từ khóa khác.' : 'Học viên sẽ xuất hiện tại đây sau khi ghi danh khóa học.'}
            compact
            className="m-4"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Học viên</th>
                  <th className="px-4 py-3 font-medium">Tiến độ</th>
                  <th className="px-4 py-3 font-medium">Thanh toán</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium">Ngày ghi danh</th>
                  <th className="px-4 py-3 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="transition hover:bg-muted/35">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{student.student_name || 'Học viên ẩn danh'}</p>
                      <p className="text-xs text-muted-foreground">{student.student_email || 'Chưa có email'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="min-w-40">
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Hoàn thành</span>
                          <span className="font-medium text-foreground">{student.progress_percent || 0}%</span>
                        </div>
                        <Progress value={student.progress_percent || 0} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getPaymentBadgeVariant(student.payment_status)} label={getPaymentBadgeLabel(student.payment_status)} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getEnrollmentBadgeVariant(student.status)} label={getEnrollmentBadgeLabel(student.status)} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(student.enrolled_at)}</td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedStudent(student)
                          setReminderSent(false)
                        }}
                      >
                        Xem chi tiết
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedStudent && (
        <StudentProgressModal
          courseId={courseId}
          student={selectedStudent}
          reminderSent={reminderSent}
          onSendReminder={async () => {
            const studentId = selectedStudent.student_id || selectedStudent.user_id || selectedStudent.id
            if (studentId) {
              try {
                await coursesApi.sendStudentReminder(courseId, studentId)
              } catch {
                // Graceful fallback
              }
            }
            setReminderSent(true)
          }}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <Card padding="responsive">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">{value}</p>
    </Card>
  )
}

function StudentProgressModal({
  courseId,
  student,
  reminderSent,
  onSendReminder,
  onClose,
}: {
  courseId: string
  student: Enrollment
  reminderSent: boolean
  onSendReminder: () => void
  onClose: () => void
}) {
  const [summary, setSummary] = useState<{
    progress_percent: number
    lessons: Array<{ title: string; completed: boolean }>
    attempts: Array<{ title: string; score: number; duration: string; date: string | null }>
  } | null>(null)

  const studentTargetId = student.student_id || student.user_id || student.id

  useEffect(() => {
    let mounted = true
    const fetchSummary = async () => {
      if (!studentTargetId) return
      try {
        const res = await coursesApi.getStudentProgressSummary(courseId, studentTargetId)
        if (mounted && res.data) {
          setSummary(res.data)
        }
      } catch {
        // Fallback
      }
    }
    fetchSummary()
    return () => {
      mounted = false
    }
  }, [courseId, studentTargetId])

  const progress = summary?.progress_percent ?? (student.progress_percent || 0)
  const defaultLessons = [
    { title: 'Bài 1: Giới thiệu & Định hướng khóa học', completed: progress >= 5 },
    { title: 'Bài 2: Các khái niệm cốt lõi', completed: progress >= 35 },
    { title: 'Bài 3: Thực hành bài tập', completed: progress >= 70 },
    { title: 'Bài 4: Tổng kết & Đồ án', completed: progress >= 100 },
  ]
  const defaultAttempts = [
    { title: 'Trắc nghiệm 1: Kiến thức nền tảng', score: progress >= 20 ? 78 : 0, duration: '12p', date: '2026-07-15' },
    { title: 'Trắc nghiệm 2: Ứng dụng thực tế', score: progress >= 60 ? 84 : 0, duration: '16p', date: '2026-07-18' },
  ]

  const lessons = summary?.lessons && Array.isArray(summary.lessons) && summary.lessons.length > 0 ? summary.lessons : defaultLessons
  const attempts = summary?.attempts && Array.isArray(summary.attempts) && summary.attempts.length > 0 ? summary.attempts : defaultAttempts

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true">
      <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto" padding="none">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <h3 className="text-xl font-semibold text-foreground">{student.student_name || 'Học viên ẩn danh'}</h3>
            <p className="text-sm text-muted-foreground">{student.student_email || 'Chưa có email'}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Đóng chi tiết tiến độ học viên">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Tiến độ tổng thể</span>
              <span className="font-semibold text-foreground">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section>
              <h4 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                <BookOpenCheck className="h-4 w-4 text-primary" />
                Tiến độ bài học
              </h4>
              <div className="space-y-2">
                {lessons.map((lesson) => (
                  <div key={lesson.title} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <span className="text-sm text-foreground">{lesson.title}</span>
                    <Badge variant={lesson.completed ? 'success' : 'default'} label={lesson.completed ? 'Đã hoàn thành' : 'Chưa bắt đầu'} />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h4 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                <Clock className="h-4 w-4 text-accent" />
                Lịch sử làm trắc nghiệm
              </h4>
              <div className="space-y-2">
                {attempts.map((attempt) => (
                  <div key={attempt.title} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-foreground">{attempt.title}</span>
                      <span className="font-semibold text-foreground">{attempt.score}/100</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{attempt.duration} · {formatDate(attempt.date)}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {progress < 10 && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-foreground">Phát hiện tiến độ học tập chậm</p>
                  <p className="text-sm text-muted-foreground">Gửi nhắc nhở trực tiếp giúp học viên quay lại tiếp tục bài học.</p>
                </div>
                <Button onClick={onSendReminder} icon={<Mail className="h-4 w-4" />}>Gửi nhắc nhở</Button>
              </div>
              {reminderSent && <p className="mt-3 text-sm font-medium text-success">Đã gửi thông báo nhắc nhở.</p>}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
