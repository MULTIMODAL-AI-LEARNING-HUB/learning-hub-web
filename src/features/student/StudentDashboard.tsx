import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  FileText,
  MessageSquare,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Clock,
  Award,
  PlayCircle,
  TrendingUp,
  Search,
  CheckCircle2,
  BrainCircuit,
  Compass,
  Zap,
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useStudentDashboard } from '../../hooks/useStudentDashboard'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { cn } from '../../utils/cn'

export function StudentDashboard() {
  const navigate = useNavigate()
  const user = useAppStore((s) => s.auth.user)
  const { courses, stats, recentActivity, loading, fetchDashboard } = useStudentDashboard()
  const [aiPrompt, setAiPrompt] = useState('')

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const getGreeting = () => {
    const hr = new Date().getHours()
    if (hr < 12) return 'Chào buổi sáng'
    if (hr < 18) return 'Chào buổi chiều'
    return 'Chào buổi tối'
  }

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays < 7) return `${diffDays} ngày trước`
    return date.toLocaleDateString('vi-VN')
  }

  const handleAiAsk = (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiPrompt.trim()) return
    navigate(`/app/student/chat?initialQuery=${encodeURIComponent(aiPrompt.trim())}`)
  }

  // Find course to continue: first non-completed course with highest progress, or first enrolled course
  const continueCourse = courses.find((c) => c.completion_percent < 100) || courses[0]

  return (
    <div className="space-y-8 animate-fade-in font-body pb-12">
      {/* 1. Welcome & AI Quick Prompt Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-surface-elevated via-primary/5 to-surface p-6 md:p-8 shadow-soft">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" />
              <span>Không gian học tập AI thế hệ mới</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              {getGreeting()},{' '}
              <span className="bg-gradient-to-r from-blue-600 via-primary to-cyan-500 bg-clip-text text-transparent">
                {user?.name?.split(' ')[0]}
              </span>{' '}
              👋
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Hôm nay bạn muốn tiếp thu kiến thức gì? Hãy tiếp tục bài giảng hoặc nhờ trợ lý AI hỗ trợ giải đáp thắc mắc.
            </p>

            {/* Interactive AI Quick Search Bar */}
            <form onSubmit={handleAiAsk} className="pt-3">
              <div className="relative flex items-center max-w-xl">
                <div className="absolute left-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Search className="h-4 w-4 text-primary/70" />
                </div>
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Hỏi trợ lý AI bất kỳ điều gì (VD: Giải thích thuật toán, tóm tắt bài học...)"
                  className="w-full h-11 pl-10 pr-24 rounded-2xl border border-border bg-background/90 text-sm placeholder:text-muted-foreground/70 focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200 shadow-xs"
                />
                <button
                  type="submit"
                  disabled={!aiPrompt.trim()}
                  className="absolute right-1.5 h-8 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                >
                  <span>Hỏi AI</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {/* Quick Prompt Tags */}
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <span className="text-3xs font-semibold uppercase tracking-wider text-muted-foreground">Gợi ý:</span>
                {[
                  'Tóm tắt bài học gần nhất',
                  'Luyện tập trắc nghiệm nhanh',
                  'Giải thích thuật ngữ khó',
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setAiPrompt(tag)
                    }}
                    className="text-3xs font-medium px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Quick AI Action Card */}
          <div className="flex lg:flex-col gap-3 shrink-0">
            <Button
              onClick={() => navigate('/app/student/quiz')}
              icon={<BrainCircuit className="h-4 w-4 text-purple-400" />}
              className="h-11 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-primary text-white hover:from-blue-700 hover:to-primary/90 shadow-md hover:shadow-lg transition-all duration-200"
            >
              Tạo đề ôn thi AI
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/app/student/browse')}
              icon={<Compass className="h-4 w-4 text-primary" />}
              className="h-11 px-5 rounded-2xl border-border bg-background/80 hover:bg-muted"
            >
              Khám phá khóa học
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Key Learning Metrics (4 Modern Stat Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Enrolled Courses */}
        <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-surface-elevated p-4.5 hover:border-blue-500/40 hover:shadow-soft transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">Khóa học</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 group-hover:scale-110 transition-transform">
              <BookOpen className="h-4.5 w-4.5" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16 mt-3" />
          ) : (
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground tabular-nums">{stats?.total_enrolled ?? 0}</span>
              <span className="text-3xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">Đang học</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">Đã tham gia tích cực</p>
        </div>

        {/* Completed Lessons */}
        <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-surface-elevated p-4.5 hover:border-emerald-500/40 hover:shadow-soft transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">Bài học xong</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16 mt-3" />
          ) : (
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground tabular-nums">{stats?.total_completed ?? 0}</span>
              <span className="text-3xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Hoàn tất</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">Bài giảng đã hoàn thành</p>
        </div>

        {/* Reference Materials */}
        <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-surface-elevated p-4.5 hover:border-cyan-500/40 hover:shadow-soft transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">Tài liệu</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/20 group-hover:scale-110 transition-transform">
              <FileText className="h-4.5 w-4.5" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16 mt-3" />
          ) : (
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground tabular-nums">{stats?.total_materials ?? 0}</span>
              <span className="text-3xs font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">Tài nguyên</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">Học liệu & bài tập</p>
        </div>

        {/* Average Progress */}
        <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-surface-elevated p-4.5 hover:border-amber-500/40 hover:shadow-soft transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">Tiến độ TB</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20 group-hover:scale-110 transition-transform">
              <Award className="h-4.5 w-4.5" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16 mt-3" />
          ) : (
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground tabular-nums">{stats?.avg_progress ?? 0}%</span>
              <span className="text-3xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Tất cả khóa</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">Tỷ lệ hoàn thành chung</p>
        </div>
      </div>

      {/* 3. Hero "Tiếp tục bài học gần nhất" (Resume Learning Banner) */}
      {continueCourse && (
        <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-r from-blue-600/10 via-primary/10 to-cyan-500/10 p-5 md:p-6 shadow-soft">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-primary overflow-hidden ring-2 ring-primary/30 shadow-md">
                {continueCourse.course_thumbnail ? (
                  <img
                    src={continueCourse.course_thumbnail}
                    alt={continueCourse.course_title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <BookOpen className="h-8 w-8 text-primary" />
                )}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <PlayCircle className="h-8 w-8 text-white drop-shadow" />
                </div>
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-3xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                    <Zap className="h-2.5 w-2.5" />
                    Đang học dở
                  </span>
                  <span className="text-2xs font-semibold text-muted-foreground">
                    {continueCourse.completed_materials}/{continueCourse.total_materials} bài giảng
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-bold text-foreground truncate">
                  {continueCourse.course_title}
                </h3>
                <div className="flex items-center gap-3 pt-1">
                  <div className="h-2 w-48 md:w-64 bg-muted/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-primary to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, continueCourse.completion_percent)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-primary tabular-nums">
                    {Math.round(continueCourse.completion_percent)}%
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => navigate(`/app/student/courses/${continueCourse.course_id}/learn`)}
              iconRight={<ArrowRight className="h-4 w-4" />}
              className="h-11 px-6 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90 hover:scale-102 transition-all duration-200 shrink-0"
            >
              Tiếp tục học ngay
            </Button>
          </div>
        </div>
      )}

      {/* 4. Main Section: Courses Grid + Right Panel (Activity & Tools) */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column (2/3): Enrolled Courses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Khóa học của bạn
              </h2>
              <p className="text-xs text-muted-foreground">Theo dõi và tiếp tục quá trình học tập</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/student/courses')}
              iconRight={<ArrowRight className="h-3.5 w-3.5" />}
              className="text-xs text-primary hover:text-primary/80 hover:bg-primary/5"
            >
              Xem tất cả
            </Button>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <Skeleton className="h-6 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </Card>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-border/80 bg-surface-elevated/40 p-10 text-center space-y-4">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <BookOpen className="h-8 w-8" />
              </div>
              <div className="max-w-sm mx-auto space-y-1">
                <h3 className="text-base font-bold text-foreground">Bạn chưa ghi danh khóa học nào</h3>
                <p className="text-xs text-muted-foreground">
                  Khám phá kho tàng khóa học với bài giảng chất lượng cao, bài tập trắc nghiệm và trợ lý AI thông minh.
                </p>
              </div>
              <Button
                onClick={() => navigate('/app/student/browse')}
                iconRight={<Compass className="h-4 w-4" />}
                className="rounded-xl px-5"
              >
                Khám phá khóa học ngay
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {courses.slice(0, 4).map((course) => {
                const percent = Math.round(course.completion_percent)
                return (
                  <div
                    key={course.course_id}
                    onClick={() => navigate(`/app/student/courses/${course.course_id}`)}
                    className="group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-surface-elevated p-4 cursor-pointer hover:border-primary/40 hover:shadow-soft hover:-translate-y-1 transition-all duration-200"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-cyan-500/15 text-primary overflow-hidden ring-1 ring-primary/20 group-hover:scale-105 transition-transform">
                          {course.course_thumbnail ? (
                            <img
                              src={course.course_thumbnail}
                              alt={course.course_title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <BookOpen className="h-5 w-5" />
                          )}
                        </div>

                        <Badge
                          variant={percent >= 100 ? 'success' : percent >= 50 ? 'primary' : 'default'}
                          label={`${percent}%`}
                          className="font-bold text-2xs"
                        />
                      </div>

                      <h3 className="font-bold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                        {course.course_title}
                      </h3>
                      <p className="text-2xs text-muted-foreground mt-1.5">
                        {course.completed_materials} / {course.total_materials} bài giảng đã học
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/40 space-y-2">
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-primary transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-2xs text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Vào học tiếp</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column (1/3): Quick AI Tools & Activity Timeline */}
        <div className="space-y-6">
          {/* Quick AI Study Tools Launchpad */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              Công cụ AI tiện ích
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/app/student/chat')}
                className="group flex flex-col items-start p-3.5 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-surface-elevated text-left hover:border-purple-500/40 hover:shadow-xs transition-all duration-150"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-2 group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  AI Tutor Chat
                </span>
                <span className="text-3xs text-muted-foreground mt-0.5">Hỏi đáp trực tiếp</span>
              </button>

              <button
                onClick={() => navigate('/app/student/quiz')}
                className="group flex flex-col items-start p-3.5 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-surface-elevated text-left hover:border-blue-500/40 hover:shadow-xs transition-all duration-150"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform">
                  <BrainCircuit className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Tạo Đề Thi AI
                </span>
                <span className="text-3xs text-muted-foreground mt-0.5">Tự động hóa đề</span>
              </button>

              <button
                onClick={() => navigate('/app/student/flashcards')}
                className="group flex flex-col items-start p-3.5 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-surface-elevated text-left hover:border-amber-500/40 hover:shadow-xs transition-all duration-150"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-2 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Flashcards
                </span>
                <span className="text-3xs text-muted-foreground mt-0.5">Ghi nhớ ngắt quãng</span>
              </button>

              <button
                onClick={() => navigate('/app/student/documents')}
                className="group flex flex-col items-start p-3.5 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-surface-elevated text-left hover:border-cyan-500/40 hover:shadow-xs transition-all duration-150"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mb-2 group-hover:scale-110 transition-transform">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  Tài Liệu Của Tôi
                </span>
                <span className="text-3xs text-muted-foreground mt-0.5">Đã tải & phân tích</span>
              </button>
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-500" />
              Hoạt động gần đây
            </h2>

            <div className="rounded-2xl border border-border/70 bg-surface-elevated overflow-hidden shadow-xs divide-y divide-border/60">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-3/4" />
                        <Skeleton className="h-2.5 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="p-6 text-center space-y-2">
                  <Clock className="h-8 w-8 mx-auto text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground font-medium">Chưa có phiên học nào được ghi lại</p>
                </div>
              ) : (
                recentActivity.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="p-3.5 flex items-start gap-3 hover:bg-muted/40 transition-colors"
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1',
                        activity.activity_type === 'quiz' && 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
                        activity.activity_type === 'chat' && 'bg-purple-500/10 text-purple-600 ring-purple-500/20',
                        activity.activity_type !== 'quiz' && activity.activity_type !== 'chat' && 'bg-blue-500/10 text-blue-600 ring-blue-500/20'
                      )}
                    >
                      {activity.activity_type === 'quiz' ? (
                        <Award className="h-4 w-4" />
                      ) : activity.activity_type === 'chat' ? (
                        <MessageSquare className="h-4 w-4" />
                      ) : (
                        <BookOpen className="h-4 w-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{activity.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {activity.activity_type === 'quiz' && activity.score !== null && (
                          <span className="text-3xs font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Điểm: {activity.score}%
                          </span>
                        )}
                        <span className="text-3xs text-muted-foreground">
                          {formatRelativeTime(activity.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
