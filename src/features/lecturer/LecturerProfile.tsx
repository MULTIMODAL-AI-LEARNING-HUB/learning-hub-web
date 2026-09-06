import { useEffect, useMemo, useState } from 'react'
import { Award, BookOpen, CalendarDays, Check, Edit2, Mail, ShieldCheck, Star, TrendingUp, User, Users, X } from 'lucide-react'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/useToast'
import { authApi, coursesApi } from '../../services/api'

interface LecturerUser {
  full_name: string | null
  email: string
  avatar_url?: string | null
  created_at: string | null
}

interface LecturerStats {
  total_courses: number
  total_students: number
  total_revenue: number
  avg_rating: number
  course_stats: Array<{
    course_id: string
    title: string
    enrollment_count: number
    revenue: number
    rating_avg: number
  }>
}

function formatDate(value: string | null) {
  if (!value) return 'Không có ngày'
  return new Date(value).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}

export function LecturerProfile() {
  const toast = useToast()
  const [user, setUser] = useState<LecturerUser | null>(null)
  const [stats, setStats] = useState<LecturerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      setLoading(true)
      try {
        const [profileRes, statsRes] = await Promise.all([
          authApi.me(),
          coursesApi.getStats().catch(() => null),
        ])

        if (cancelled) return
        setUser(profileRes.data)
        setFullName(profileRes.data.full_name ?? '')
        if (statsRes) setStats(statsRes.data)
      } catch {
        if (!cancelled) toast({ type: 'error', title: 'Không thể tải thông tin hồ sơ' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [toast])

  const displayName = fullName.trim() || user?.full_name || 'Giảng viên'
  const initials = useMemo(() => {
    return displayName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [displayName])

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast({ type: 'warning', title: 'Vui lòng nhập họ và tên' })
      return
    }

    setSaving(true)
    try {
      const res = await authApi.updateMe({ full_name: fullName.trim() })
      setUser(res.data)
      setFullName(res.data.full_name ?? '')
      setEditing(false)
      toast({ type: 'success', title: 'Hồ sơ đã được cập nhật' })
    } catch {
      toast({ type: 'error', title: 'Cập nhật hồ sơ thất bại' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Hồ Sơ Giảng Viên"
        description="Quản lý danh tính giảng dạy công khai và thông tin tài khoản của bạn."
        icon={<User />}
      />

      <Card padding="none" className="overflow-hidden">
        <div className="relative border-b border-border bg-gradient-to-br from-primary/20 via-accent/10 to-transparent p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar src={user?.avatar_url ?? undefined} fallback={initials} size="xl" status="online" className="ring-4 ring-surface-elevated" />
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="primary" label="Giảng viên" dot />
                  <Badge variant="success" label="Tài khoản hoạt động" dot />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">{displayName}</h2>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {!editing ? (
                <Button variant="outline" icon={<Edit2 className="h-4 w-4" />} onClick={() => setEditing(true)}>
                  Chỉnh sửa hồ sơ
                </Button>
              ) : (
                <>
                  <Button variant="ghost" icon={<X className="h-4 w-4" />} onClick={() => { setEditing(false); setFullName(user?.full_name ?? '') }}>
                    Hủy
                  </Button>
                  <Button icon={<Check className="h-4 w-4" />} onClick={handleSave} loading={saving}>
                    Lưu
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={<BookOpen />} label="Khóa học" value={String(stats?.total_courses ?? 0)} />
          <MetricCard icon={<Users />} label="Học viên" value={String(stats?.total_students ?? 0)} />
          <MetricCard icon={<Star />} label="Đánh giá TB" value={(stats?.avg_rating ?? 0).toFixed(1)} />
          <MetricCard icon={<TrendingUp />} label="Doanh thu" value={formatCurrency(stats?.total_revenue ?? 0)} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card padding="responsive" className="space-y-5">
            <div>
              <h3 className="text-base font-semibold text-foreground">Chi tiết hồ sơ</h3>
              <p className="mt-1 text-sm text-muted-foreground">Thông tin này được hiển thị trong không gian làm việc của giảng viên.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Họ và tên</label>
                {editing ? (
                  <Input value={fullName} onChange={setFullName} placeholder="Nhập họ và tên của bạn" />
                ) : (
                  <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
                    {user?.full_name || 'Chưa thiết lập'}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Địa chỉ email</label>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {user?.email}
                </div>
              </div>
            </div>
          </Card>

          <Card padding="responsive" className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">Hiệu quả khóa học</h3>
                <p className="mt-1 text-sm text-muted-foreground">Các khóa học có nhiều học viên nhất trong danh mục của bạn.</p>
              </div>
              <Badge variant="outline" label={`${stats?.course_stats?.length ?? 0} khóa học`} />
            </div>

            {stats?.course_stats?.length ? (
              <div className="divide-y divide-border rounded-xl border border-border">
                {stats.course_stats.slice(0, 5).map((course) => (
                  <div key={course.course_id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{course.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{course.enrollment_count} học viên ghi danh</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-warning" />
                        {course.rating_avg.toFixed(1)}
                      </span>
                      <span className="font-medium text-foreground">{formatCurrency(course.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium text-foreground">Chưa có dữ liệu hiệu quả khóa học</p>
                <p className="mt-1 text-xs text-muted-foreground">Khóa học đã xuất bản và số lượt ghi danh sẽ hiển thị tại đây.</p>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card padding="responsive" className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-success" />
              <h3 className="font-semibold text-foreground">Tài khoản</h3>
            </div>
            <InfoRow icon={<CalendarDays />} label="Thành viên từ" value={formatDate(user?.created_at ?? null)} />
            <InfoRow icon={<Award />} label="Vai trò" value="Giảng viên" />
            <InfoRow icon={<ShieldCheck />} label="Trạng thái" value="Hoạt động" />
          </Card>

          <Card padding="responsive" className="space-y-3">
            <h3 className="font-semibold text-foreground">Mẹo hồ sơ giảng dạy</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Duy trì tên hiển thị đồng nhất với thông tin tác giả khóa học.</li>
              <li>Sử dụng thông báo khóa học và trò chuyện để tương tác cùng học viên.</li>
              <li>Kiểm tra và chấm bài tập định kỳ trong không gian Chấm bài.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-lg font-semibold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
      <div className="text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}
