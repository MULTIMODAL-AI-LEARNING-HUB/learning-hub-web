import { useEffect, useState, useCallback } from 'react'
import { Search, RefreshCw, ChevronLeft, ChevronRight, Trash2, BookOpen, Edit2, Eye, Users, Calendar, Globe, Award } from 'lucide-react'
import { adminApi, coursesApi, type Enrollment } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../components/ui/useToast'

interface AdminCourse {
  id: string
  lecturer_id: string
  category_id: string | null
  title: string
  description: string | null
  thumbnail_url: string | null
  price_vnd: number
  status: string
  level: string
  language: string
  created_at: string | null
  updated_at: string | null
  lecturer_name: string | null
  category_name: string | null
  enrollment_count: number
}

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'default' | 'primary' | 'info'> = {
  published: 'success',
  draft: 'warning',
  archived: 'default',
  rejected: 'info',
}

export function AdminCourses() {
  const toast = useToast()
  const [courses, setCourses] = useState<AdminCourse[]>([])
  const [page, setPage] = useState(1)
  const [totalCourses, setTotalCourses] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const pageSize = 15

  const [deletingCourse, setDeletingCourse] = useState<AdminCourse | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<'draft' | 'published' | 'archived'>(() => 'draft')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const [selectedCourseDetail, setSelectedCourseDetail] = useState<AdminCourse | null>(null)
  const [enrolledStudents, setEnrolledStudents] = useState<Enrollment[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)

  const fetchCourses = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await adminApi.listAllCourses({
        page: p,
        page_size: pageSize,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
      })
      setCourses(res.data.items)
      setTotalCourses(res.data.total)
    } catch {
      toast({ type: 'error', title: 'Không thể tải danh sách khóa học' })
    } finally {
      setLoading(false)
    }
  }, [toast, searchQuery, statusFilter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCourses(page)
  }, [page, fetchCourses])

  const totalPages = Math.max(1, Math.ceil(totalCourses / pageSize))

  const handleDelete = async () => {
    if (!deletingCourse) return
    setDeleting(true)
    try {
      await adminApi.deleteCourse(deletingCourse.id)
      toast({ type: 'success', title: 'Xóa khóa học thành công' })
      setDeletingCourse(null)
      fetchCourses(page)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      toast({ type: 'error', title: err?.response?.data?.detail || 'Không thể xóa khóa học' })
    } finally {
      setDeleting(false)
    }
  }

  const handleViewDetails = async (course: AdminCourse) => {
    setSelectedCourseDetail(course)
    setLoadingStudents(true)
    setEnrolledStudents([])
    try {
      const res = await coursesApi.getEnrolledStudents(course.id)
      setEnrolledStudents(res.data.items)
    } catch (err) {
      console.error('Failed to fetch enrolled students:', err)
      toast({ type: 'error', title: 'Không thể tải danh sách học viên' })
    } finally {
      setLoadingStudents(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!editingCourse) return
    setUpdatingStatus(true)
    try {
      if (selectedStatus === 'published') {
        await coursesApi.publish(editingCourse.id)
      } else if (selectedStatus === 'archived') {
        await coursesApi.archive(editingCourse.id)
      } else {
        // Fallback to update if the status is draft or anything else
        await coursesApi.update(editingCourse.id, { status: selectedStatus })
      }
      toast({ type: 'success', title: 'Cập nhật trạng thái khóa học thành công' })
      setEditingCourse(null)
      fetchCourses(page)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      toast({ type: 'error', title: err?.response?.data?.detail || 'Không thể cập nhật trạng thái' })
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <div className="space-y-6 p-6 font-body">
      <div className="flex flex-col gap-1">
        <h1 className="text-fluid-2xl font-bold text-foreground">Quản lý khóa học</h1>
        <p className="text-muted-foreground text-sm">Tổng quan tất cả các khóa học trên hệ thống. Kiểm duyệt và quản lý theo nhu cầu.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Tìm kiếm khóa học..."
            value={searchQuery}
            onChange={setSearchQuery}
            prefixIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="published">Đã xuất bản</option>
            <option value="draft">Bản nháp</option>
            <option value="archived">Đã lưu trữ</option>
          </select>
          <Button variant="outline" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => fetchCourses(page)} loading={loading}>Làm mới</Button>
        </div>
      </div>

      {/* Courses table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 px-5">Khóa học</th>
                <th className="py-2.5 px-5">Giảng viên</th>
                <th className="py-2.5 px-5">Danh mục</th>
                <th className="py-2.5 px-5">Trạng thái</th>
                <th className="py-2.5 px-5">Học phí</th>
                <th className="py-2.5 px-5 text-center">Học viên</th>
                <th className="py-2.5 px-5">Ngày tạo</th>
                <th className="py-2.5 px-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="py-3 px-5"><Skeleton width={j === 0 ? 160 : 60} height={12} /></td>
                    ))}
                  </tr>
                ))
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground text-sm">Không tìm thấy khóa học nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                courses.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition">
                    <td className="py-3 px-5">
                      <button
                        onClick={() => handleViewDetails(c)}
                        className="font-medium text-foreground hover:text-primary transition truncate text-left max-w-[200px] hover:underline focus:outline-none"
                      >
                        {c.title}
                      </button>
                    </td>
                    <td className="py-3 px-5 text-muted-foreground text-xs">{c.lecturer_name || '—'}</td>
                    <td className="py-3 px-5 text-muted-foreground text-xs">{c.category_name || '—'}</td>
                    <td className="py-3 px-5">
                      <Badge
                        variant={STATUS_COLORS[c.status] || 'default'}
                        label={c.status === 'published' ? 'Đã xuất bản' : c.status === 'draft' ? 'Bản nháp' : c.status === 'archived' ? 'Đã lưu trữ' : c.status}
                      />
                    </td>
                    <td className="py-3 px-5 text-sm tabular-nums">
                      {c.price_vnd === 0 ? <span className="text-success">Miễn phí</span> : `${c.price_vnd.toLocaleString()} VND`}
                    </td>
                    <td className="py-3 px-5 text-sm tabular-nums text-center">{c.enrollment_count}</td>
                    <td className="py-3 px-5 text-xs text-muted-foreground tabular-nums">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="py-3 px-5 text-right flex justify-end gap-1">
                      <button
                        onClick={() => handleViewDetails(c)}
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition"
                        title="Xem chi tiết"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => { setEditingCourse(c); setSelectedStatus(c.status as 'draft' | 'published' | 'archived') }}
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition"
                        title="Cập nhật trạng thái"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingCourse(c)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                        title="Xóa khóa học"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <p className="text-xs text-muted-foreground">Tổng số {totalCourses} khóa học</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<ChevronLeft className="h-3.5 w-3.5" />} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>Trước</Button>
            <Button variant="outline" size="sm" iconRight={<ChevronRight className="h-3.5 w-3.5" />} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading}>Sau</Button>
          </div>
        </div>
      </Card>

      {/* Edit Status Modal */}
      <Modal open={!!editingCourse} onClose={() => setEditingCourse(null)} title="Cập nhật trạng thái khóa học" size="sm">
        {editingCourse && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Thay đổi trạng thái hiển thị của khóa học <span className="font-semibold text-foreground">"{editingCourse.title}"</span>.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Trạng thái khóa học</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'draft' | 'published' | 'archived')}
              >
                <option value="draft">Bản nháp</option>
                <option value="published">Đã xuất bản</option>
                <option value="archived">Đã lưu trữ</option>
              </select>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setEditingCourse(null)}>Hủy</Button>
          <Button onClick={handleUpdateStatus} loading={updatingStatus}>Lưu trạng thái</Button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deletingCourse} onClose={() => setDeletingCourse(null)} title="Xác nhận xóa khóa học" size="sm">
        {deletingCourse && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Bạn có chắc chắn muốn xóa khóa học <span className="font-semibold text-foreground">"{deletingCourse.title}"</span>? Tất cả học viên ghi danh và nội dung bài học liên quan sẽ bị xóa vĩnh viễn.
            </p>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setDeletingCourse(null)}>Hủy</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting} icon={<Trash2 className="h-4 w-4" />}>Xóa khóa học</Button>
        </div>
      </Modal>

      {/* Course Detail Modal */}
      <Modal
        open={!!selectedCourseDetail}
        onClose={() => setSelectedCourseDetail(null)}
        title="Chi tiết khóa học"
        size="4xl"
      >
        {selectedCourseDetail && (
          <div className="space-y-6">
            {/* Course Header Banner */}
            <div className="relative h-40 rounded-xl overflow-hidden bg-gradient-to-r from-primary/30 to-secondary/30 flex items-center justify-between px-6 border border-border">
              <div className="space-y-2 z-10 max-w-[70%]">
                <Badge
                  variant={STATUS_COLORS[selectedCourseDetail.status] || 'default'}
                  label={selectedCourseDetail.status === 'published' ? 'Đã xuất bản' : selectedCourseDetail.status === 'draft' ? 'Bản nháp' : 'Đã lưu trữ'}
                />
                <h3 className="text-xl font-bold text-foreground line-clamp-1">{selectedCourseDetail.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{selectedCourseDetail.description || 'Chưa có mô tả cho khóa học này.'}</p>
              </div>
              {selectedCourseDetail.thumbnail_url ? (
                <img
                  src={selectedCourseDetail.thumbnail_url}
                  alt={selectedCourseDetail.title}
                  className="w-32 h-20 rounded-lg object-cover border border-border shadow-sm shrink-0"
                />
              ) : (
                <div className="w-32 h-20 rounded-lg bg-muted/50 border border-border flex items-center justify-center shrink-0">
                  <BookOpen className="h-8 w-8 text-muted-foreground/30" />
                </div>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-xl border border-border bg-muted/10 space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">Giảng viên</span>
                <span className="text-xs font-semibold text-foreground truncate block">{selectedCourseDetail.lecturer_name || '—'}</span>
              </div>
              <div className="p-3 rounded-xl border border-border bg-muted/10 space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">Danh mục</span>
                <span className="text-xs font-semibold text-foreground truncate block">{selectedCourseDetail.category_name || '—'}</span>
              </div>
              <div className="p-3 rounded-xl border border-border bg-muted/10 space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">Học phí</span>
                <span className="text-xs font-semibold text-foreground block">
                  {selectedCourseDetail.price_vnd === 0 ? (
                    <span className="text-success font-semibold">Miễn phí</span>
                  ) : (
                    `${selectedCourseDetail.price_vnd.toLocaleString()} VND`
                  )}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-border bg-muted/10 space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">Tổng số học viên</span>
                <span className="text-xs font-bold text-primary block flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  {selectedCourseDetail.enrollment_count}
                </span>
              </div>
            </div>

            {/* General Info Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Ngày tạo: {selectedCourseDetail.created_at ? new Date(selectedCourseDetail.created_at).toLocaleDateString('vi-VN') : '—'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                <span className="capitalize">Ngôn ngữ: {selectedCourseDetail.language || 'Tiếng Việt'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5" />
                <span className="capitalize">Trình độ: {selectedCourseDetail.level || 'Tất cả trình độ'}</span>
              </div>
            </div>

            {/* Enrolled Students List */}
            <div className="border-t border-border pt-4 space-y-3">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                Danh sách học viên ghi danh
              </h4>

              {loadingStudents ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-muted/20 rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 w-1/4 bg-muted animate-pulse rounded" />
                        <div className="h-2 w-1/3 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : enrolledStudents.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-border rounded-xl">
                  <Users className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">Chưa có học viên nào ghi danh khóa học này.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-border rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                        <th className="py-2 px-3">Học viên</th>
                        <th className="py-2 px-3">Ngày tham gia</th>
                        <th className="py-2 px-3">Thanh toán</th>
                        <th className="py-2 px-3 text-center">Tiến độ</th>
                        <th className="py-2 px-3 text-right">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {enrolledStudents.map((enrollment) => {
                        const studentInitials = enrollment.student_name
                          ? enrollment.student_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                          : 'U'
                        return (
                          <tr key={enrollment.id} className="hover:bg-muted/10 transition">
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold overflow-hidden border border-border">
                                  {enrollment.student_avatar_url ? (
                                    <img src={enrollment.student_avatar_url} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    studentInitials
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-foreground truncate">{enrollment.student_name || 'Học viên'}</p>
                                  <p className="text-[9px] text-muted-foreground truncate">{enrollment.student_email || 'Chưa có email'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-muted-foreground whitespace-nowrap">
                              {new Date(enrollment.enrolled_at).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="py-2 px-3">
                              <div>
                                <p className="font-semibold text-foreground">
                                  {enrollment.payment_amount_vnd === 0 ? 'Miễn phí' : `${enrollment.payment_amount_vnd?.toLocaleString()} VND`}
                                </p>
                                <span className="text-[8px] text-muted-foreground capitalize">{enrollment.payment_method || '—'}</span>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2 justify-center max-w-[100px] mx-auto">
                                <div className="w-full bg-muted rounded-full h-1">
                                  <div
                                    className="bg-primary h-1 rounded-full"
                                    style={{ width: `${enrollment.progress_percent ?? 0}%` }}
                                  />
                                </div>
                                <span className="font-medium text-foreground tabular-nums text-[9px]">
                                  {enrollment.progress_percent ?? 0}%
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <Badge
                                variant={enrollment.status === 'completed' ? 'success' : 'primary'}
                                label={enrollment.status === 'completed' ? 'Đã hoàn thành' : 'Đang học'}
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={() => setSelectedCourseDetail(null)}>Đóng</Button>
        </div>
      </Modal>
    </div>
  )
}