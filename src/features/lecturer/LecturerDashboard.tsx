import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Plus,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { useLecturerCourses } from '../../hooks/useLecturerCourses'
import { cn } from '../../utils/cn'

const statusLabels: Record<string, string> = {
  draft: 'Bản nháp',
  published: 'Đã xuất bản',
  archived: 'Đã lưu trữ',
  pending: 'Chờ duyệt',
}

export function LecturerDashboard() {
  const navigate = useNavigate()
  const user = useAppStore((state) => state.auth.user)
  const { courses, stats, loading, fetchCourses, fetchStats } = useLecturerCourses()

  useEffect(() => {
    fetchCourses()
    fetchStats()
  }, [fetchCourses, fetchStats])

  const draftCourses = courses.filter((course) => course.status === 'draft')
  const publishedCourses = courses.filter((course) => course.status === 'published')
  const courseStats = stats?.course_stats ?? []
  const recentCourses = courses.slice(0, 4)

  const statCards = [
    { label: 'Khóa học đang hoạt động', value: publishedCourses.length, icon: BookOpen, tone: 'violet' },
    { label: 'Tổng sinh viên', value: stats?.total_students ?? 0, icon: Users, tone: 'blue' },
    { label: 'Đánh giá trung bình', value: stats?.avg_rating ? stats.avg_rating.toFixed(1) : '—', icon: Star, tone: 'amber' },
    { label: 'Tổng doanh thu', value: formatCurrency(stats?.total_revenue ?? 0), icon: TrendingUp, tone: 'emerald' },
  ]

  const workItems = [
    {
      title: 'Hoàn thiện khóa học nháp',
      description: draftCourses.length
        ? `${draftCourses.length} khóa học cần bổ sung nội dung trước khi xuất bản.`
        : 'Không có khóa học nháp cần xử lý.',
      count: draftCourses.length,
      icon: BookOpen,
      action: () => navigate('/app/lecturer/courses'),
    },
    {
      title: 'Theo dõi hoạt động sinh viên',
      description: `${stats?.total_students ?? 0} sinh viên đang tham gia các khóa học của bạn.`,
      count: stats?.total_students ?? 0,
      icon: Users,
      action: () => navigate('/app/lecturer/students'),
    },
    {
      title: 'Kiểm tra hiệu quả khóa học',
      description: 'Xem mức độ tham gia, doanh thu và phản hồi theo từng khóa học.',
      count: courseStats.length,
      icon: BarChart3,
      action: () => navigate('/app/lecturer/analytics'),
    },
  ]

  return (
    <div className="space-y-7 animate-fade-in pb-8 font-body">
      <PageHeader
        subtitle="Không gian giảng dạy"
        title={`Chào ${user?.name?.split(' ')[0] ?? 'giảng viên'}`}
        description="Theo dõi công việc cần xử lý và tiếp tục xây dựng nội dung khóa học của bạn."
        actions={(
          <Button
            onClick={() => navigate('/app/lecturer/courses')}
            icon={<Plus className="h-4 w-4" />}
            className="min-h-11"
          >
            Tạo khóa học
          </Button>
        )}
      />

      <section aria-labelledby="overview-title">
        <h2 id="overview-title" className="sr-only">Tổng quan</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="border-border bg-surface-elevated shadow-soft" padding="responsive">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="supporting-text font-medium text-muted-foreground">{stat.label}</p>
                    <p className="mt-2 text-[1.75rem] font-bold leading-tight tracking-tight text-foreground tabular-nums">
                      {stat.value}
                    </p>
                  </div>
                  <div className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    stat.tone === 'violet' && 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
                    stat.tone === 'blue' && 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                    stat.tone === 'amber' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                    stat.tone === 'emerald' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                  )}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="work-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="work-title" className="section-title text-foreground">Việc cần quan tâm</h2>
            <p className="mt-1 supporting-text text-muted-foreground">Các đầu việc giúp bạn duy trì lớp học hiệu quả.</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {workItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.title}
                type="button"
                onClick={item.action}
                className="group rounded-2xl border border-border bg-surface-elevated p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-violet-500/30 hover:shadow-lift"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-sm font-semibold text-foreground tabular-nums">
                    {item.count}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 supporting-text text-muted-foreground">{item.description}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 dark:text-violet-400">
                  Xem chi tiết
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]" aria-labelledby="courses-title">
        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 id="courses-title" className="section-title text-foreground">Khóa học gần đây</h2>
              <p className="mt-1 supporting-text text-muted-foreground">Tiếp tục chỉnh sửa hoặc xem nhanh hiệu quả.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/app/lecturer/courses')} iconRight={<ArrowRight className="h-4 w-4" />}>
              Xem tất cả
            </Button>
          </div>

          <Card className="overflow-hidden border-border bg-surface-elevated shadow-soft">
            {loading ? (
              <div className="p-10 text-center supporting-text text-muted-foreground">Đang tải khóa học…</div>
            ) : recentCourses.length ? (
              <div className="divide-y divide-border">
                {recentCourses.map((course) => {
                  const metrics = courseStats.find((item) => item.course_id === course.id)
                  return (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => navigate(`/app/lecturer/courses/${course.id}`)}
                      className="group grid w-full gap-3 px-4 py-4 text-left transition hover:bg-muted/45 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400">
                            {course.title}
                          </h3>
                          <span className="rounded-full bg-muted px-2 py-0.5 metadata-text font-medium text-muted-foreground">
                            {statusLabels[course.status] ?? course.status}
                          </span>
                        </div>
                        <p className="mt-1 supporting-text text-muted-foreground">
                          {metrics?.enrollment_count ?? 0} sinh viên · {metrics?.rating_avg ? `${metrics.rating_avg.toFixed(1)} điểm đánh giá` : 'Chưa có đánh giá'}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 dark:text-violet-400">
                        Tiếp tục chỉnh sửa <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center p-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10 text-violet-600">
                  <BookOpen className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">Bắt đầu khóa học đầu tiên</h3>
                <p className="mt-1 max-w-sm supporting-text text-muted-foreground">Tạo cấu trúc khóa học, thêm bài giảng và xuất bản khi đã sẵn sàng.</p>
                <Button className="mt-4" onClick={() => navigate('/app/lecturer/courses')} icon={<Plus className="h-4 w-4" />}>
                  Tạo khóa học
                </Button>
              </div>
            )}
          </Card>
        </div>

        <aside aria-labelledby="progress-title">
          <div className="mb-4">
            <h2 id="progress-title" className="section-title text-foreground">Tình trạng giảng dạy</h2>
            <p className="mt-1 supporting-text text-muted-foreground">Tổng hợp nhanh toàn bộ không gian.</p>
          </div>
          <Card className="border-border bg-surface-elevated shadow-soft" padding="responsive">
            <div className="space-y-5">
              <SummaryRow icon={CheckCircle2} label="Đã xuất bản" value={publishedCourses.length} />
              <SummaryRow icon={ClipboardCheck} label="Đang soạn" value={draftCourses.length} />
              <SummaryRow icon={Users} label="Sinh viên tiếp cận" value={stats?.total_students ?? 0} />
            </div>
            <Button variant="outline" className="mt-6 w-full min-h-11" onClick={() => navigate('/app/lecturer/analytics')} icon={<BarChart3 className="h-4 w-4" />}>
              Mở báo cáo phân tích
            </Button>
          </Card>
        </aside>
      </section>
    </div>
  )
}

function SummaryRow({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <span className="flex-1 supporting-text font-medium text-foreground">{label}</span>
      <span className="text-base font-bold text-foreground tabular-nums">{value}</span>
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}
