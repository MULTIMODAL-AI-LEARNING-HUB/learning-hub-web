/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Trophy,
} from 'lucide-react'
import {
  coursesApi,
  enrollmentsApi,
  lessonsApi,
  quizzesApi,
  assignmentsApi,
  sectionsApi,
  type Course,
  type Enrollment,
  type Lesson,
  type MaterialProgress,
  type QuizAttempt,
  type Section,
} from '../../services/api'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { cn } from '../../utils/cn'

import { FocusTopBar } from './learning/FocusTopBar'
import { CurriculumSidebar } from './learning/CurriculumSidebar'
import { LessonPlayer } from './learning/LessonPlayer'
import { LessonContextTabs } from './learning/LessonContextTabs'
import { CourseChatDrawer } from './learning/CourseChatDrawer'
import { AiTutorDrawer } from './learning/AiTutorDrawer'
import {
  itemKey,
  isVideoFile,
  materialTypeLabel,
  type ContextTab,
  type LearningItem,
  type LearningSection,
} from './learning/types'
import { LessonQuizModal } from './LessonQuizModal'
import { LessonAssignmentModal } from './LessonAssignmentModal'

export function CourseLearning() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  // Main data states
  const [course, setCourse] = useState<Course | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [progress, setProgress] = useState<Map<string, MaterialProgress>>(new Map())
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [currentItemKey, setCurrentItemKey] = useState<string | null>(null)
  const [currentLessonDetail, setCurrentLessonDetail] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // Layout UI states
  const [curriculumOpen, setCurriculumOpen] = useState(true)
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false)
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<ContextTab>('overview')

  // Modals for Quiz & Assignment
  const [quizModalOpen, setQuizModalOpen] = useState(false)
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false)

  // Status caches for Quiz & Assignment
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([])
  const [assignmentSubmissionsCount, setAssignmentSubmissionsCount] = useState<number>(0)
  const [assignmentMaxScore, setAssignmentMaxScore] = useState<number | null>(null)
  const [highestSubmissionScore, setHighestSubmissionScore] = useState<number | null>(null)

  // Load course, sections, and enrollment progress
  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [courseRes, sectionsRes, enrollRes] = await Promise.all([
        coursesApi.get(id),
        sectionsApi.list(id).catch(() => ({ data: [] as Section[] })),
        enrollmentsApi.list({ status: 'active' }).catch(() => ({ data: { items: [] as Enrollment[] } })),
      ])

      setCourse(courseRes.data)
      setSections(sectionsRes.data)

      const userEnrollment = enrollRes.data.items.find((item: Enrollment) => item.course_id === id)
      if (userEnrollment) {
        setEnrollment(userEnrollment)
        const progressRes = await enrollmentsApi.getProgress(userEnrollment.id).catch(() => null)
        if (progressRes) {
          setEnrollment((prev) => (prev ? { ...prev, progress_percent: progressRes.data.completion_percent } : null))
          const nextProgress = new Map<string, MaterialProgress>()
          progressRes.data.materials.forEach((item) => {
            nextProgress.set(item.material_id, { ...item } as MaterialProgress)
          })
          setProgress(nextProgress)
          setCompletedLessons(new Set(progressRes.data.completed_lesson_ids ?? []))
        }
      }
    } catch (err) {
      console.error('Failed to load course learning workspace:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Sync activeTab from URL with backward-compatibility
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (!tabParam) return

    if (tabParam === 'learn') {
      setActiveTab('overview')
    } else if (tabParam === 'discussion') {
      setActiveTab('discussion')
    } else if (tabParam === 'notes') {
      setActiveTab('notes')
    } else if (tabParam === 'mindmap') {
      setActiveTab('mindmap')
    } else if (tabParam === 'ai') {
      setAiDrawerOpen(true)
      setActiveTab('overview')
    } else if (tabParam === 'overview') {
      setActiveTab('overview')
    }
  }, [searchParams])

  // Group sections and materials into unified learning sections
  const learningSections = useMemo<LearningSection[]>(() => {
    const sectionGroups: LearningSection[] = sections
      .map((section) => ({
        id: section.id,
        title: section.title,
        description: section.description,
        items: (section.lessons || []).map((lesson) => ({
          kind: 'lesson' as const,
          id: lesson.id,
          sectionId: section.id,
          title: lesson.title,
          description: lesson.description,
          lesson,
        })),
      }))
      .filter((section) => section.items.length > 0)

    const materialItems = (course?.materials || []).map((material) => ({
      kind: 'material' as const,
      id: material.id,
      sectionId: 'materials' as const,
      title: material.title || material.file_name || 'Học liệu chưa đặt tên',
      description: material.file_name,
      material,
    }))

    if (materialItems.length > 0) {
      sectionGroups.push({
        id: 'materials',
        title: sectionGroups.length > 0 ? 'Học liệu bổ sung' : 'Học liệu khóa học',
        description: 'Tài nguyên tải xuống hoặc xem trực tiếp do giảng viên cung cấp.',
        items: materialItems,
      })
    }

    return sectionGroups
  }, [course?.materials, sections])

  const flatItems = useMemo(() => learningSections.flatMap((section) => section.items), [learningSections])
  const currentItem = flatItems.find((item) => itemKey(item) === currentItemKey) || flatItems[0]
  const currentIndex = currentItem ? flatItems.findIndex((item) => itemKey(item) === itemKey(currentItem)) : -1
  const previousItem = currentIndex > 0 ? flatItems[currentIndex - 1] : null
  const nextItem = currentIndex >= 0 && currentIndex < flatItems.length - 1 ? flatItems[currentIndex + 1] : null

  // URL query parameter resolution for current item
  useEffect(() => {
    if (flatItems.length === 0) return
    const itemFromParams = searchParams.get('item')
    const legacyMaterialId = searchParams.get('material')
    const nextKey = itemFromParams || (legacyMaterialId ? `material:${legacyMaterialId}` : itemKey(flatItems[0]))
    if (flatItems.some((item) => itemKey(item) === nextKey)) {
      setCurrentItemKey(nextKey)
    } else {
      setCurrentItemKey(itemKey(flatItems[0]))
    }
  }, [flatItems, searchParams])

  // Fetch full lesson detail when switching lessons
  useEffect(() => {
    if (!currentItem || currentItem.kind !== 'lesson') {
      setCurrentLessonDetail(null)
      return
    }

    let cancelled = false
    lessonsApi
      .get(currentItem.sectionId, currentItem.id)
      .then((res) => {
        if (!cancelled) setCurrentLessonDetail(res.data)
      })
      .catch(() => {
        if (!cancelled) setCurrentLessonDetail(currentItem.lesson)
      })

    return () => {
      cancelled = true
    }
  }, [currentItem])

  const currentLesson = currentItem?.kind === 'lesson' ? currentLessonDetail || currentItem.lesson : null

  // Fetch quiz and assignment status for current lesson
  const loadLessonExtras = useCallback(async () => {
    if (!currentLesson) return
    const lessonId = currentLesson.id

    if (currentLesson.has_quiz || currentLesson.quiz) {
      quizzesApi
        .getMyAttempts(lessonId)
        .then((res) => setQuizAttempts(res.data || []))
        .catch(() => setQuizAttempts([]))
    } else {
      setQuizAttempts([])
    }

    if (currentLesson.has_assignment || currentLesson.assignment) {
      assignmentsApi
        .getMySubmissions(lessonId)
        .then((res) => {
          const subs = res.data || []
          setAssignmentSubmissionsCount(subs.length)
          const scored = subs.filter((s) => s.score !== null)
          if (scored.length > 0) {
            setHighestSubmissionScore(Math.max(...scored.map((s) => s.score as number)))
          } else {
            setHighestSubmissionScore(null)
          }
        })
        .catch(() => {
          setAssignmentSubmissionsCount(0)
          setHighestSubmissionScore(null)
        })

      if (currentLesson.assignment) {
        setAssignmentMaxScore(currentLesson.assignment.max_score)
      } else {
        assignmentsApi
          .get(lessonId)
          .then((res) => setAssignmentMaxScore(res.data?.max_score || 100))
          .catch(() => setAssignmentMaxScore(null))
      }
    } else {
      setAssignmentSubmissionsCount(0)
      setHighestSubmissionScore(null)
      setAssignmentMaxScore(null)
    }
  }, [currentLesson])

  useEffect(() => {
    loadLessonExtras()
  }, [loadLessonExtras])

  const goToItem = (item: LearningItem | null) => {
    if (!item) return
    const nextKey = itemKey(item)
    setCurrentItemKey(nextKey)
    setSearchParams({ item: nextKey, tab: activeTab })
  }

  const changeTab = (tab: ContextTab) => {
    setActiveTab(tab)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', tab)
    setSearchParams(nextParams)
  }

  // Toggle lesson completion state with optimistic update & server sync
  const toggleLessonCompleted = async (lessonId: string) => {
    const isCurrentlyCompleted = completedLessons.has(lessonId)
    const nextCompleted = !isCurrentlyCompleted

    setCompletedLessons((prev) => {
      const next = new Set(prev)
      if (isCurrentlyCompleted) next.delete(lessonId)
      else next.add(lessonId)
      return next
    })

    if (enrollment) {
      try {
        await enrollmentsApi.updateLessonProgress(enrollment.id, lessonId, nextCompleted)
        const progressRes = await enrollmentsApi.getProgress(enrollment.id).catch(() => null)
        if (progressRes) {
          setEnrollment((prev) =>
            prev ? { ...prev, progress_percent: progressRes.data.completion_percent } : prev
          )
        }
      } catch (err) {
        console.error('Failed to sync lesson progress with server:', err)
        setCompletedLessons((prev) => {
          const rollback = new Set(prev)
          if (isCurrentlyCompleted) rollback.add(lessonId)
          else rollback.delete(lessonId)
          return rollback
        })
      }
    }
  }

  const updateMaterialProgress = useCallback(
    async (materialId: string, completionPercent: number) => {
      if (!enrollment) return
      setUpdating(true)
      try {
        await enrollmentsApi.updateProgress(enrollment.id, materialId, { completion_percent: completionPercent })
        const progressRes = await enrollmentsApi.getProgress(enrollment.id)
        setEnrollment((prev) => (prev ? { ...prev, progress_percent: progressRes.data.completion_percent } : prev))
        const nextProgress = new Map<string, MaterialProgress>()
        progressRes.data.materials.forEach((item) => {
          nextProgress.set(item.material_id, { ...item } as MaterialProgress)
        })
        setProgress(nextProgress)
      } catch (err) {
        console.error('Failed to update material progress:', err)
      } finally {
        setUpdating(false)
      }
    },
    [enrollment]
  )

  const markCurrentComplete = async () => {
    if (!currentItem) return
    if (currentItem.kind === 'material') {
      await updateMaterialProgress(currentItem.id, 100)
    } else {
      toggleLessonCompleted(currentItem.id)
    }
  }

  // Overall course completion calculations
  const totalLessons = sections.reduce((acc, sec) => acc + (sec.lessons?.length || sec.lesson_count || 0), 0)
  const totalMaterials = course?.materials?.length || 0
  const completedLessonsCount = sections.reduce(
    (acc, sec) => acc + (sec.lessons || []).filter((l) => completedLessons.has(l.id)).length,
    0
  )
  const completedMaterialsCount = Array.from(progress.values()).filter(
    (item) => item.completed || item.completion_percent >= 100
  ).length

  const totalCurriculumItems = totalLessons + totalMaterials
  const totalCompletedItems = completedLessonsCount + completedMaterialsCount
  const overallProgress =
    totalCurriculumItems > 0
      ? Math.min(100, Math.round((totalCompletedItems / totalCurriculumItems) * 100))
      : Math.round(enrollment?.progress_percent || 0)

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col bg-background">
        <div className="h-14 border-b border-border bg-card px-4 flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-6 space-y-4">
            <Skeleton className="aspect-video w-full max-w-4xl rounded-xl" />
            <Skeleton className="h-10 w-full max-w-4xl rounded-lg" />
          </div>
          <div className="w-80 border-l border-border p-4 hidden lg:block">
            <Skeleton className="h-full w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  // Un-enrolled State
  if (!course || !enrollment) {
    return (
      <div className="h-screen w-screen flex items-center justify-center p-4 bg-background">
        <EmptyState
          icon={<BookOpen className="h-8 w-8 text-muted-foreground" />}
          title="Bạn chưa ghi danh vào khóa học này"
          description="Vui lòng đăng ký khóa học trước khi mở không gian học tập."
          action={
            <Link to={`/app/student/courses/${id}`}>
              <Button variant="outline">Quay lại thông tin khóa học</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const isCurrentCompleted = currentItem
    ? currentItem.kind === 'lesson'
      ? completedLessons.has(currentItem.id)
      : (progress.get(currentItem.id)?.completion_percent || 0) >= 100
    : false

  const hasCurrentVideo = currentItem?.kind === 'lesson'
    ? Boolean((currentLesson || currentItem.lesson).video_url) || ((currentLesson || currentItem.lesson).attachments || []).some((a) => isVideoFile(a.file_name, a.file_type))
    : currentItem?.material.material_type === 'video'

  const completedMaterialsSet = new Set(
    Array.from(progress.entries())
      .filter(([, val]) => val.completed || val.completion_percent >= 100)
      .map(([key]) => key)
  )

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* 1. Slim Top Bar (LMS Standard Header) */}
      <FocusTopBar
        courseId={course.id}
        courseTitle={course.title}
        currentLessonTitle={currentItem?.title}
        currentLessonKind={currentItem?.kind}
        hasVideo={hasCurrentVideo}
        overallProgress={overallProgress}
        completedCount={totalCompletedItems}
        totalCount={totalCurriculumItems}
        curriculumOpen={curriculumOpen}
        onToggleCurriculum={() => setCurriculumOpen((v) => !v)}
        chatOpen={chatDrawerOpen}
        onToggleChat={() => setChatDrawerOpen((v) => !v)}
        aiOpen={aiDrawerOpen}
        onToggleAi={() => setAiDrawerOpen((v) => !v)}
      />

      {/* 2. Main 2-Column Workspace */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Center / Left Column: Primary Lecture Space */}
        <main className="flex-1 min-w-0 overflow-y-auto scrollbar-thin px-3 py-4 sm:px-6 sm:py-6 space-y-5">
          <div className="max-w-5xl mx-auto space-y-5">
            {currentItem ? (
              <>
                {/* Lesson Hero Header — ambient gradient, editorial title */}
                <Card padding="responsive" className="relative overflow-hidden border-border/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] ring-1 ring-border/40">
                  {/* Ambient wash */}
                  <div aria-hidden className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-24 -left-16 h-56 w-72 rounded-full bg-primary/[0.09] blur-3xl" />
                    <div className="absolute -top-20 right-0 h-52 w-64 rounded-full bg-accent/[0.10] blur-3xl" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                  </div>

                  <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={currentItem.kind === 'material' ? 'info' : 'primary'}
                          label={currentItem.kind === 'material' ? materialTypeLabel(currentItem.material.material_type) : 'Bài học'}
                        />
                        {currentItem.kind === 'lesson' && currentItem.lesson.is_preview && (
                          <Badge variant="info" label="Học thử miễn phí" />
                        )}
                        {isCurrentCompleted ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-success bg-success/15 ring-1 ring-success/25 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Đã hoàn thành
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground bg-muted/70 ring-1 ring-border/60 px-2.5 py-1 rounded-full tabular-nums">
                            Bài {currentIndex + 1} / {flatItems.length}
                          </span>
                        )}
                      </div>
                      <h1 className="mt-2.5 text-xl sm:text-2xl font-extrabold tracking-tight text-foreground leading-snug line-clamp-2 text-balance">
                        {currentItem.title}
                      </h1>
                      {currentItem.description && (
                        <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed line-clamp-2 max-w-2xl">
                          {currentItem.description}
                        </p>
                      )}
                    </div>

                    {/* Completion CTA */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        onClick={markCurrentComplete}
                        variant={isCurrentCompleted ? 'outline' : 'primary'}
                        size="sm"
                        loading={updating}
                        icon={<CheckCircle2 className={cn('h-4 w-4', isCurrentCompleted ? 'text-success' : '')} />}
                        className={cn(
                          'rounded-xl px-4 h-9 font-bold transition-all',
                          isCurrentCompleted
                            ? 'border-success/40 text-success hover:bg-success/10'
                            : 'shadow-[0_6px_20px_rgba(79,70,229,0.35)] hover:shadow-[0_8px_26px_rgba(79,70,229,0.45)] hover:-translate-y-px'
                        )}
                      >
                        {isCurrentCompleted ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Primary Player (Kept mounted above tabs so tab switching never pauses video) */}
                <LessonPlayer
                  item={currentItem.kind === 'lesson' && currentLesson ? { ...currentItem, lesson: currentLesson } : currentItem}
                  onVideoEnded={() => {
                    if (!isCurrentCompleted) markCurrentComplete()
                  }}
                />

                {/* Contextual Tabs (Overview, Notes, Q&A, Mindmap) */}
                <LessonContextTabs
                  courseId={course.id}
                  currentItem={currentItem}
                  currentLesson={currentLesson}
                  activeTab={activeTab}
                  onChangeTab={changeTab}
                  onOpenQuiz={() => setQuizModalOpen(true)}
                  onOpenAssignment={() => setAssignmentModalOpen(true)}
                  quizAttempts={quizAttempts}
                  assignmentSubmissionsCount={assignmentSubmissionsCount}
                  assignmentMaxScore={assignmentMaxScore}
                  highestSubmissionScore={highestSubmissionScore}
                />

                {/* Footer Navigation — lesson preview cards */}
                <div className="pt-5 pb-10">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      <Sparkles className="h-3 w-3 text-primary" />
                      Bài {currentIndex + 1} / {flatItems.length}
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Previous lesson card */}
                    <button
                      disabled={!previousItem}
                      onClick={() => goToItem(previousItem)}
                      className={cn(
                        'group flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all',
                        previousItem
                          ? 'border-border/60 bg-card hover:border-primary/40 hover:shadow-[0_8px_24px_rgba(79,70,229,0.12)] hover:-translate-y-px'
                          : 'border-border/40 bg-muted/30 opacity-50 cursor-not-allowed'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all',
                          previousItem
                            ? 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                            : 'bg-muted text-muted-foreground/50'
                        )}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Bài trước
                        </span>
                        <span className="block text-[13px] font-bold text-foreground truncate">
                          {previousItem ? previousItem.title : 'Đã là bài đầu tiên'}
                        </span>
                      </span>
                    </button>

                    {/* Next lesson card */}
                    <button
                      disabled={!nextItem}
                      onClick={() => goToItem(nextItem)}
                      className={cn(
                        'group relative flex items-center gap-3 overflow-hidden rounded-2xl border p-3.5 text-left transition-all',
                        nextItem
                          ? 'border-primary/25 bg-gradient-to-r from-primary/[0.08] to-accent/[0.06] hover:border-primary/50 hover:shadow-[0_8px_24px_rgba(79,70,229,0.18)] hover:-translate-y-px'
                          : 'border-success/30 bg-gradient-to-r from-success/[0.08] to-emerald-500/[0.06]'
                      )}
                    >
                      {nextItem && (
                        <span aria-hidden className="pointer-events-none absolute inset-0">
                          <span className="absolute -right-8 -top-10 h-28 w-32 rounded-full bg-primary/[0.12] blur-2xl" />
                        </span>
                      )}
                      <span className="relative min-w-0 flex-1">
                        <span
                          className={cn(
                            'flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider',
                            nextItem ? 'text-primary' : 'text-success'
                          )}
                        >
                          {nextItem ? (
                            <>Bài tiếp theo</>
                          ) : (
                            <>
                              <Trophy className="h-3 w-3" /> Hoàn tất chương trình
                            </>
                          )}
                        </span>
                        <span className="block text-[13px] font-bold text-foreground truncate">
                          {nextItem ? nextItem.title : 'Chúc mừng bạn đã học hết!'}
                        </span>
                      </span>
                      {nextItem && (
                        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-[0_4px_14px_rgba(79,70,229,0.4)] transition-transform group-hover:translate-x-0.5">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                icon={<BookOpen className="h-8 w-8 text-muted-foreground" />}
                title="Chọn một bài học để bắt đầu"
                description="Chọn bài học từ danh mục giáo trình bên cạnh để bắt đầu học tập."
              />
            )}
          </div>
        </main>

        {/* Right Column: Curriculum Sidebar (Collapsible) */}
        <CurriculumSidebar
          sections={learningSections}
          currentItem={currentItem}
          completedLessons={completedLessons}
          completedMaterials={completedMaterialsSet}
          open={curriculumOpen}
          onClose={() => setCurriculumOpen(false)}
          onSelectItem={goToItem}
        />
      </div>

      {/* Slide-over Drawers (Mounted only when open to save polling & network) */}
      <CourseChatDrawer
        courseId={course.id}
        open={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
      />

      <AiTutorDrawer
        courseId={course.id}
        courseTitle={course.title}
        currentLesson={currentLesson}
        open={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        onOpenQuiz={() => {
          setAiDrawerOpen(false)
          setQuizModalOpen(true)
        }}
      />

      {/* Quiz Modal */}
      {currentLesson && (
        <LessonQuizModal
          open={quizModalOpen}
          onClose={() => setQuizModalOpen(false)}
          lessonId={currentLesson.id}
          lessonTitle={currentLesson.title}
          onQuizCompleted={loadLessonExtras}
        />
      )}

      {/* Assignment Modal */}
      {currentLesson && (
        <LessonAssignmentModal
          open={assignmentModalOpen}
          onClose={() => {
            setAssignmentModalOpen(false)
            loadLessonExtras()
          }}
          lessonId={currentLesson.id}
          lessonTitle={currentLesson.title}
          assignmentData={currentLesson.assignment}
        />
      )}
    </div>
  )
}
