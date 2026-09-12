/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileText,
  HelpCircle,
  Layers,
  ListChecks,
  Menu,
  MessageSquare,
  Paperclip,
  Play,
  PlayCircle,
  RotateCcw,
  Sparkles,
  StickyNote,
  Trophy,
  Video,
  X,
} from 'lucide-react'
import {
  coursesApi,
  enrollmentsApi,
  lessonsApi,
  quizzesApi,
  assignmentsApi,
  sectionsApi,
  type Course,
  type CourseMaterial,
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
import { Progress } from '../../components/ui/Progress'
import { Skeleton } from '../../components/ui/Skeleton'
import { cn } from '../../utils/cn'
import { CourseChatPanel } from './CourseChatPanel'
import { DiscussionPanel } from './DiscussionPanel'
import { LessonAudioPlayer } from './LessonAudioPlayer'
import { LessonMindmapView } from './LessonMindmapView'
import { LessonQuizModal } from './LessonQuizModal'
import { LessonAssignmentModal } from './LessonAssignmentModal'

type LearningItem =
  | { kind: 'lesson'; id: string; sectionId: string; title: string; description: string | null; lesson: Lesson }
  | { kind: 'material'; id: string; sectionId: 'materials'; title: string; description: string | null; material: CourseMaterial }

type WorkspaceTab = 'learn' | 'mindmap' | 'discussion' | 'ai' | 'notes'
type LessonSubSection = 'all' | 'video' | 'content' | 'attachments' | 'quiz' | 'assignment'

const WORKSPACE_TABS: WorkspaceTab[] = ['learn', 'mindmap', 'discussion', 'ai', 'notes']

interface LearningSection {
  id: string
  title: string
  description: string | null
  items: LearningItem[]
}

function itemKey(item: LearningItem) {
  return `${item.kind}:${item.id}`
}

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return null
  const mins = Math.max(1, Math.round(seconds / 60))
  return `${mins} phút`
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isVideoFile(fileName: string, fileType?: string | null): boolean {
  if (fileType && fileType.toLowerCase().startsWith('video/')) return true
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  return ['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v'].includes(ext)
}

function getFileCategory(fileName: string): { label: string; colorClass: string } {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  if (['pdf'].includes(ext)) {
    return { label: 'PDF', colorClass: 'text-rose-500 bg-rose-500/10 border-rose-500/20' }
  }
  if (['doc', 'docx'].includes(ext)) {
    return { label: 'Word', colorClass: 'text-blue-500 bg-blue-500/10 border-blue-500/20' }
  }
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return { label: 'Excel', colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' }
  }
  if (['ppt', 'pptx'].includes(ext)) {
    return { label: 'PowerPoint', colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20' }
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return { label: 'Nén', colorClass: 'text-purple-500 bg-purple-500/10 border-purple-500/20' }
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
    return { label: 'Ảnh', colorClass: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' }
  }
  return { label: ext.toUpperCase() || 'FILE', colorClass: 'text-muted-foreground bg-muted border-border' }
}

function materialTypeLabel(type: string) {
  if (!type) return 'Học liệu'
  const t = type.toLowerCase()
  if (t === 'video') return 'Video bài giảng'
  if (t === 'pdf') return 'Tài liệu PDF'
  if (t === 'docx') return 'Văn bản Word'
  if (t === 'image') return 'Hình ảnh'
  if (t === 'url') return 'Liên kết ngoài'
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
}

export function CourseLearning() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [progress, setProgress] = useState<Map<string, MaterialProgress>>(new Map())
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [currentItemKey, setCurrentItemKey] = useState<string | null>(null)
  const [currentLessonDetail, setCurrentLessonDetail] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<WorkspaceTab>('learn')

  // Modals for Quiz & Assignment
  const [quizModalOpen, setQuizModalOpen] = useState(false)
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false)

  // Status caches for Quiz & Assignment
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([])
  const [assignmentSubmissionsCount, setAssignmentSubmissionsCount] = useState<number>(0)
  const [assignmentMaxScore, setAssignmentMaxScore] = useState<number | null>(null)
  const [highestSubmissionScore, setHighestSubmissionScore] = useState<number | null>(null)

  // Load completed lessons from local storage per course
  useEffect(() => {
    if (!id) return
    try {
      const saved = localStorage.getItem(`completed_lessons_${id}`)
      if (saved) {
        setCompletedLessons(new Set(JSON.parse(saved)))
      }
    } catch {
      // ignore
    }
  }, [id])

  const toggleLessonCompleted = (lessonId: string) => {
    setCompletedLessons((prev) => {
      const next = new Set(prev)
      if (next.has(lessonId)) {
        next.delete(lessonId)
      } else {
        next.add(lessonId)
      }
      try {
        if (id) {
          localStorage.setItem(`completed_lessons_${id}`, JSON.stringify(Array.from(next)))
        }
      } catch {
        // ignore
      }
      return next
    })
  }

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

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && WORKSPACE_TABS.includes(tab as WorkspaceTab)) {
      setActiveWorkspaceTab(tab as WorkspaceTab)
    }
  }, [searchParams])

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
        description: 'Tài nguyên tải xuống hoặc nhúng trực tiếp do giảng viên cung cấp.',
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

  // Fetch full lesson detail including attachments, quiz and assignment
  useEffect(() => {
    if (!currentItem || currentItem.kind !== 'lesson') {
      setCurrentLessonDetail(null)
      return
    }

    let cancelled = false
    lessonsApi
      .get(currentItem.sectionId, currentItem.id)
      .then((res) => {
        if (!cancelled) {
          setCurrentLessonDetail(res.data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCurrentLessonDetail(currentItem.lesson)
        }
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
    setSearchParams({ item: nextKey, tab: activeWorkspaceTab })
    setSidebarOpen(false)
  }

  const changeWorkspaceTab = (tab: WorkspaceTab) => {
    setActiveWorkspaceTab(tab)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', tab)
    setSearchParams(nextParams)
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

  // Calculate overall course progress
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

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <Skeleton className="h-[34rem] rounded-xl" />
        <Skeleton className="h-[34rem] rounded-xl" />
      </div>
    )
  }

  if (!course || !enrollment) {
    return (
      <EmptyState
        icon={<BookOpen />}
        title="Bạn chưa ghi danh vào khóa học này"
        description="Vui lòng đăng ký khóa học trước khi mở không gian học tập."
        action={
          <Link to={`/app/student/courses/${id}`}>
            <Button variant="outline">Quay lại thông tin khóa học</Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link to={`/app/student/courses/${id}`}>
            <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
              Quay lại khóa học
            </Button>
          </Link>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">{course.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Không gian học tập đa phương tiện tích hợp bài đọc, video, bài kiểm tra trắc nghiệm và trợ lý AI.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden"
          onClick={() => setSidebarOpen((value) => !value)}
          icon={sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        >
          {sidebarOpen ? 'Ẩn giáo trình' : 'Hiện giáo trình'}
        </Button>
      </div>

      {/* Main Learning Grid */}
      <div className="grid gap-5 lg:grid-cols-[21rem_1fr]">
        {/* Left Sidebar: Curriculum */}
        <aside className={cn('lg:block', sidebarOpen ? 'block' : 'hidden')}>
          <Card padding="none" className="overflow-hidden lg:sticky lg:top-4">
            <div className="border-b border-border p-4 bg-muted/20">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">Tiến độ học tập</span>
                <span className="font-bold text-primary tabular-nums">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} />
              <p className="mt-2 text-xs text-muted-foreground">
                {totalCurriculumItems > 0
                  ? `Đã hoàn thành ${totalCompletedItems}/${totalCurriculumItems} nội dung học`
                  : 'Theo dõi tiến độ học tập tự động.'}
              </p>
            </div>

            <div className="max-h-[calc(100vh-14rem)] space-y-4 overflow-y-auto p-3">
              {learningSections.length === 0 ? (
                <EmptyState
                  compact
                  icon={<ListChecks />}
                  title="Chưa có giáo trình"
                  description="Giảng viên chưa thêm bài học hoặc tài liệu nào."
                />
              ) : (
                learningSections.map((section) => (
                  <div key={section.id} className="space-y-1.5">
                    <p className="px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {section.title}
                    </p>
                    <div className="space-y-1">
                      {section.items.map((item, index) => {
                        const isLesson = item.kind === 'lesson'
                        const isCompleted = isLesson
                          ? completedLessons.has(item.id)
                          : (progress.get(item.id)?.completion_percent || 0) >= 100

                        return (
                          <CurriculumLessonItem
                            key={itemKey(item)}
                            item={item}
                            index={index}
                            active={currentItem ? itemKey(item) === itemKey(currentItem) : false}
                            completed={isCompleted}
                            onClick={() => goToItem(item)}
                          />
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </aside>

        {/* Right Main Content */}
        <main className="min-w-0 space-y-5">
          {currentItem ? (
            <>
              {/* Workspace Top Tabs */}
              <Card padding="none" className="overflow-hidden">
                <WorkspaceTabs activeTab={activeWorkspaceTab} onChange={changeWorkspaceTab} />
              </Card>

              {/* TAB 1: LEARN (Primary learning interface) */}
              {activeWorkspaceTab === 'learn' && (
                <>
                  {currentItem.kind === 'material' ? (
                    <div className="space-y-4">
                      <Card padding="responsive">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <Badge variant="info" label={materialTypeLabel(currentItem.material.material_type)} />
                            <h2 className="mt-3 text-lg font-bold text-foreground sm:text-xl">{currentItem.title}</h2>
                            {currentItem.description && (
                              <p className="mt-1 text-sm text-muted-foreground">{currentItem.description}</p>
                            )}
                          </div>
                          {(progress.get(currentItem.id)?.completion_percent || 0) >= 100 ? (
                            <Badge variant="success" label="Đã hoàn thành" />
                          ) : (
                            <Button onClick={markCurrentComplete} loading={updating} icon={<CheckCircle2 className="h-4 w-4" />}>
                              Đánh dấu hoàn thành
                            </Button>
                          )}
                        </div>
                      </Card>

                      <MaterialViewer item={currentItem.material} onVideoEnded={markCurrentComplete} />
                    </div>
                  ) : (
                    <LessonMultiModalWorkspace
                      lesson={currentLesson || currentItem.lesson}
                      isCompleted={completedLessons.has(currentItem.id)}
                      onToggleCompleted={() => toggleLessonCompleted(currentItem.id)}
                      onOpenQuiz={() => setQuizModalOpen(true)}
                      onOpenAssignment={() => setAssignmentModalOpen(true)}
                      onOpenMindmap={() => changeWorkspaceTab('mindmap')}
                      quizAttempts={quizAttempts}
                      assignmentSubmissionsCount={assignmentSubmissionsCount}
                      assignmentMaxScore={assignmentMaxScore}
                      highestSubmissionScore={highestSubmissionScore}
                    />
                  )}

                  {/* Lesson Navigation Footer */}
                  <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!previousItem}
                        onClick={() => goToItem(previousItem)}
                        icon={<ArrowLeft className="h-4 w-4" />}
                      >
                        Bài trước
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!nextItem}
                        onClick={() => goToItem(nextItem)}
                      >
                        Bài tiếp theo
                        <ArrowRight className="ml-1.5 h-4 w-4 inline" />
                      </Button>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      Nội dung {currentIndex + 1} trên {flatItems.length}
                    </div>
                  </div>
                </>
              )}

              {/* TAB: MINDMAP (Interactive Knowledge Mindmap) */}
              {activeWorkspaceTab === 'mindmap' && (
                <div className="space-y-4">
                  {currentLesson ? (
                    <LessonMindmapView
                      lessonId={currentLesson.id}
                      lessonTitle={currentLesson.title}
                    />
                  ) : (
                    <Card padding="responsive">
                      <p className="text-sm text-muted-foreground">
                        Vui lòng chọn một bài học để xem sơ đồ tư duy tương tác.
                      </p>
                    </Card>
                  )}
                </div>
              )}

              {/* TAB 2: DISCUSSION (Lesson-specific + Course Chat) */}
              {activeWorkspaceTab === 'discussion' && (
                <div className="space-y-5">
                  {currentItem.kind === 'lesson' ? (
                    <Card padding="responsive">
                      <div className="mb-4 border-b border-border pb-3">
                        <h3 className="font-semibold text-foreground">Thảo luận về bài học này</h3>
                        <p className="text-xs text-muted-foreground">{currentItem.title}</p>
                      </div>
                      <DiscussionPanel lessonId={currentItem.id} />
                    </Card>
                  ) : null}

                  <div>
                    <div className="mb-3 px-1">
                      <h3 className="text-sm font-semibold text-foreground">Phòng chat toàn khóa học</h3>
                      <p className="text-xs text-muted-foreground">Trò chuyện cùng tất cả học viên và giảng viên</p>
                    </div>
                    <CourseChatPanel courseId={course.id} />
                  </div>
                </div>
              )}

              {/* TAB 3: AI TUTOR */}
              {activeWorkspaceTab === 'ai' && <AiTutorPanel courseId={id} />}

              {/* TAB 4: NOTES */}
              {activeWorkspaceTab === 'notes' && (
                <Card padding="responsive">
                  <NotesPanel />
                </Card>
              )}
            </>
          ) : (
            <EmptyState
              icon={<BookOpen />}
              title="Chọn bài học để bắt đầu"
              description="Chọn một bài học hoặc học liệu từ giáo trình bên cạnh."
            />
          )}
        </main>
      </div>

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

/* ==========================================================================
   COMPONENT: CurriculumLessonItem (Enhanced Sidebar Item with multi-type badges)
   ========================================================================== */
function CurriculumLessonItem({
  item,
  index,
  active,
  completed,
  onClick,
}: {
  item: LearningItem
  index: number
  active: boolean
  completed?: boolean
  onClick: () => void
}) {
  if (item.kind === 'material') {
    return (
      <button
        onClick={onClick}
        className={cn(
          'w-full rounded-xl border px-3 py-2.5 text-left transition-all',
          active
            ? 'border-primary bg-primary/10 text-foreground font-medium shadow-xs'
            : 'border-transparent hover:bg-muted/70 text-muted-foreground hover:text-foreground'
        )}
      >
        <div className="flex gap-3 items-center">
          <div
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
              completed
                ? 'bg-success/15 text-success'
                : active
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-xs font-medium text-foreground">{item.title}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{materialTypeLabel(item.material.material_type)}</p>
          </div>
        </div>
      </button>
    )
  }

  const lesson = item.lesson
  const attachments = lesson.attachments || []
  const hasVideo = Boolean(lesson.video_url) || attachments.some((a) => isVideoFile(a.file_name, a.file_type))
  const hasContent = Boolean(lesson.content && lesson.content.trim().length > 0)
  const docAttachmentsCount = attachments.filter((a) => !isVideoFile(a.file_name, a.file_type)).length
  const hasQuiz = Boolean(lesson.has_quiz || lesson.quiz)
  const hasAssignment = Boolean(lesson.has_assignment || lesson.assignment)

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border px-3 py-2.5 text-left transition-all',
        active
          ? 'border-primary bg-primary/10 text-foreground font-medium shadow-xs'
          : 'border-transparent hover:bg-muted/70 text-foreground/80 hover:text-foreground'
      )}
    >
      <div className="flex gap-2.5 items-start">
        <div
          className={cn(
            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
            completed
              ? 'bg-success/20 text-success'
              : active
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-xs font-semibold leading-snug">{item.title}</p>

          {/* Sub-item indicators mimicking lecturer view */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {hasVideo && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                <Video className="h-2.5 w-2.5" /> Video
              </span>
            )}
            {hasContent && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                <FileText className="h-2.5 w-2.5" /> Bài đọc
              </span>
            )}
            {docAttachmentsCount > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                <Paperclip className="h-2.5 w-2.5" /> Tài liệu ({docAttachmentsCount})
              </span>
            )}
            {hasQuiz && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">
                <HelpCircle className="h-2.5 w-2.5" /> Trắc nghiệm
              </span>
            )}
            {hasAssignment && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                <FileCheck className="h-2.5 w-2.5" /> Bài tập
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

/* ==========================================================================
   COMPONENT: LessonMultiModalWorkspace (Multi-modal lecture viewer with steps)
   ========================================================================== */
interface LessonMultiModalWorkspaceProps {
  lesson: Lesson
  isCompleted: boolean
  onToggleCompleted: () => void
  onOpenQuiz: () => void
  onOpenAssignment: () => void
  onOpenMindmap: () => void
  quizAttempts: QuizAttempt[]
  assignmentSubmissionsCount: number
  assignmentMaxScore: number | null
  highestSubmissionScore: number | null
}

function LessonMultiModalWorkspace({
  lesson,
  isCompleted,
  onToggleCompleted,
  onOpenQuiz,
  onOpenAssignment,
  onOpenMindmap,
  quizAttempts,
  assignmentSubmissionsCount,
  assignmentMaxScore,
  highestSubmissionScore,
}: LessonMultiModalWorkspaceProps) {
  const [activeSubSection, setActiveSubSection] = useState<LessonSubSection>('all')

  const attachments = lesson.attachments || []

  // Identify video: either lesson.video_url OR an attachment with video extension / video MIME
  const videoAttachment = attachments.find((a) => isVideoFile(a.file_name, a.file_type))
  const videoSourceUrl = lesson.video_url || videoAttachment?.file_url || null
  const hasVideo = Boolean(videoSourceUrl)

  // Identify content: text markdown / article
  const hasContent = Boolean(lesson.content && lesson.content.trim().length > 0)

  // Identify non-video document attachments
  const documentAttachments = attachments.filter((a) => !isVideoFile(a.file_name, a.file_type))
  const hasDocs = documentAttachments.length > 0

  // Quiz & Assignment
  const hasQuiz = Boolean(lesson.has_quiz || lesson.quiz)
  const hasAssignment = Boolean(lesson.has_assignment || lesson.assignment)

  // Reset to 'all' when lesson changes if active section does not exist
  useEffect(() => {
    setActiveSubSection('all')
  }, [lesson.id])

  // Quiz status calculation
  const bestQuizAttempt = useMemo(() => {
    if (quizAttempts.length === 0) return null
    return [...quizAttempts].sort((a, b) => (b.score || 0) - (a.score || 0))[0]
  }, [quizAttempts])

  return (
    <div className="space-y-5">
      {/* 1. Header Card with Lesson Summary & Actions */}
      <Card padding="responsive" className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" label="Bài học" />
              {lesson.is_preview && <Badge variant="info" label="Học thử miễn phí" />}
              {hasVideo && (
                <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  <Video className="h-3 w-3" /> Video
                </span>
              )}
              {hasContent && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <FileText className="h-3 w-3" /> Bài đọc
                </span>
              )}
              {hasDocs && (
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <Paperclip className="h-3 w-3" /> {documentAttachments.length} tài liệu
                </span>
              )}
              {hasQuiz && (
                <span className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-2 py-0.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
                  <HelpCircle className="h-3 w-3" /> Trắc nghiệm
                </span>
              )}
              {hasAssignment && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <FileCheck className="h-3 w-3" /> Bài tập
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{lesson.title}</h2>

            {lesson.description && (
              <p className="text-sm leading-relaxed text-muted-foreground max-w-3xl">{lesson.description}</p>
            )}
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-2">
            <Button
              onClick={onOpenMindmap}
              variant="outline"
              size="sm"
              icon={<BrainCircuit className="h-4 w-4 text-primary" />}
            >
              Sơ đồ tư duy AI
            </Button>
            <Button
              onClick={onToggleCompleted}
              variant={isCompleted ? 'outline' : 'primary'}
              size="sm"
              icon={<CheckCircle2 className={cn('h-4 w-4', isCompleted ? 'text-success' : '')} />}
            >
              {isCompleted ? 'Đã hoàn thành bài học' : 'Đánh dấu hoàn thành'}
            </Button>
          </div>
        </div>

        {/* 2. Step / Section Quick Navigation Bar */}
        <div className="border-t border-border/70 pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveSubSection('all')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                activeSubSection === 'all'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              Tất cả nội dung
            </button>

            {hasVideo && (
              <button
                onClick={() => setActiveSubSection('video')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  activeSubSection === 'video'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Video className="h-3.5 w-3.5" />
                Video bài giảng
              </button>
            )}

            {hasContent && (
              <button
                onClick={() => setActiveSubSection('content')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  activeSubSection === 'content'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                Bài đọc lý thuyết
              </button>
            )}

            {hasDocs && (
              <button
                onClick={() => setActiveSubSection('attachments')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  activeSubSection === 'attachments'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Paperclip className="h-3.5 w-3.5" />
                Tài liệu ({documentAttachments.length})
              </button>
            )}

            {hasQuiz && (
              <button
                onClick={() => setActiveSubSection('quiz')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  activeSubSection === 'quiz'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                Trắc nghiệm
                {bestQuizAttempt?.passed && (
                  <CheckCircle2 className="h-3 w-3 text-success inline" />
                )}
              </button>
            )}

            {hasAssignment && (
              <button
                onClick={() => setActiveSubSection('assignment')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  activeSubSection === 'assignment'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <FileCheck className="h-3.5 w-3.5" />
                Bài tập
                {assignmentSubmissionsCount > 0 && (
                  <span className="text-[10px] bg-primary/20 text-primary px-1 rounded-full">
                    {assignmentSubmissionsCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 1b. Audio Podcast TTS Summary */}
        <LessonAudioPlayer lessonId={lesson.id} lessonTitle={lesson.title} />
      </Card>

      {/* 3. SUB-SECTION: VIDEO PLAYER */}
      {hasVideo && (activeSubSection === 'all' || activeSubSection === 'video') && (
        <Card padding="none" className="overflow-hidden border border-border/90 shadow-xs">
          <div className="border-b border-border bg-muted/30 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Video bài giảng
              </span>
              {videoAttachment && (
                <span className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-md">
                  ({videoAttachment.file_name})
                </span>
              )}
            </div>
            {lesson.video_duration && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(lesson.video_duration)}
              </span>
            )}
          </div>

          <div className="aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
            {videoAttachment ? (
              <video
                src={videoAttachment.file_url}
                controls
                className="h-full w-full object-contain"
                controlsList="nodownload"
                poster={undefined}
              >
                Trình duyệt của bạn không hỗ trợ phát video HTML5.
              </video>
            ) : lesson.video_url?.includes('youtube.com') ||
              lesson.video_url?.includes('youtu.be') ||
              lesson.video_url?.includes('vimeo.com') ? (
              <iframe
                src={lesson.video_url}
                title={lesson.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : videoSourceUrl ? (
              <video
                src={videoSourceUrl}
                controls
                className="h-full w-full object-contain"
              >
                Trình duyệt của bạn không hỗ trợ phát video.
              </video>
            ) : (
              <EmptyState
                compact
                icon={<PlayCircle />}
                title="Không thể phát video"
                description="Liên kết video bài giảng không hợp lệ hoặc đang bảo trì."
              />
            )}
          </div>

          {videoAttachment && (
            <div className="flex items-center justify-between bg-muted/20 px-4 py-2 text-xs text-muted-foreground border-t border-border">
              <span>Tệp video: {videoAttachment.file_name} {videoAttachment.file_size ? `(${formatFileSize(videoAttachment.file_size)})` : ''}</span>
              <a
                href={videoAttachment.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-semibold text-primary hover:underline"
              >
                <Download className="h-3.5 w-3.5" /> Tải về máy
              </a>
            </div>
          )}
        </Card>
      )}

      {/* 4. SUB-SECTION: ARTICLE / READING CONTENT */}
      {(hasContent || (!hasVideo && !hasDocs && !hasQuiz && !hasAssignment)) &&
        (activeSubSection === 'all' || activeSubSection === 'content') && (
          <Card padding="responsive" className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Nội dung bài học
              </h3>
            </div>

            <div className="prose prose-sm max-w-none dark:prose-invert leading-relaxed text-foreground/90">
              {lesson.content ? (
                <div className="whitespace-pre-wrap text-sm leading-7 text-foreground font-normal">
                  {lesson.content}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center text-sm text-muted-foreground">
                  Bài học này chưa có nội dung văn bản chi tiết.
                </div>
              )}
            </div>
          </Card>
        )}

      {/* 5. SUB-SECTION: ATTACHMENTS & DOCUMENTS */}
      {hasDocs && (activeSubSection === 'all' || activeSubSection === 'attachments') && (
        <Card padding="responsive" className="space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Tài liệu & Học liệu đính kèm ({documentAttachments.length})
              </h3>
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {documentAttachments.map((att) => {
              const cat = getFileCategory(att.file_name)
              return (
                <div
                  key={att.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-3 transition-all hover:border-primary/40 hover:bg-muted/30 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-bold',
                        cat.colorClass
                      )}
                    >
                      {cat.label}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground" title={att.file_name}>
                        {att.file_name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {att.file_size ? formatFileSize(att.file_size) : 'Tài liệu tham khảo'}
                      </p>
                    </div>
                  </div>

                  <a
                    href={att.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Button size="sm" variant="outline" icon={<Download className="h-3.5 w-3.5" />}>
                      Mở
                    </Button>
                  </a>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* 6. SUB-SECTION: QUIZ CARD */}
      {hasQuiz && (activeSubSection === 'all' || activeSubSection === 'quiz') && (
        <Card padding="responsive" className="border-violet-500/20 bg-violet-500/[0.02]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                  bestQuizAttempt?.passed
                    ? 'bg-success/15 text-success ring-1 ring-success/30'
                    : 'bg-violet-500/15 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/30'
                )}
              >
                {bestQuizAttempt?.passed ? <Trophy className="h-6 w-6" /> : <HelpCircle className="h-6 w-6" />}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="primary" label="Bài kiểm tra trắc nghiệm" />
                  {bestQuizAttempt?.passed ? (
                    <Badge variant="success" label={`Đã đạt: ${Math.round(bestQuizAttempt.score || 0)}/100`} />
                  ) : bestQuizAttempt ? (
                    <Badge variant="error" label={`Điểm gần nhất: ${Math.round(bestQuizAttempt.score || 0)}/100 (Chưa đạt)`} />
                  ) : (
                    <span className="text-xs text-muted-foreground">Chưa làm bài</span>
                  )}
                </div>

                <h3 className="mt-1.5 text-base font-bold text-foreground">
                  {lesson.quiz?.title || 'Bài kiểm tra trắc nghiệm củng cố kiến thức'}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {quizAttempts.length > 0
                    ? `Bạn đã thực hiện ${quizAttempts.length} lần làm bài.`
                    : 'Làm bài kiểm tra để đánh giá mức độ hiểu bài và tích lũy điểm tiến độ.'}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <Button
                onClick={onOpenQuiz}
                variant={bestQuizAttempt?.passed ? 'outline' : 'primary'}
                icon={bestQuizAttempt?.passed ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                className="w-full sm:w-auto shadow-xs"
              >
                {bestQuizAttempt?.passed ? 'Làm lại trắc nghiệm' : 'Làm bài trắc nghiệm'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 7. SUB-SECTION: ASSIGNMENT CARD */}
      {hasAssignment && (activeSubSection === 'all' || activeSubSection === 'assignment') && (
        <Card padding="responsive" className="border-amber-500/20 bg-amber-500/[0.02]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30">
                <FileCheck className="h-6 w-6" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning" label="Bài tập thực hành" />
                  {highestSubmissionScore !== null ? (
                    <Badge variant="success" label={`Điểm: ${highestSubmissionScore}/${assignmentMaxScore || 100}`} />
                  ) : assignmentSubmissionsCount > 0 ? (
                    <Badge variant="info" label={`Đã nộp (${assignmentSubmissionsCount} lần)`} />
                  ) : (
                    <span className="text-xs text-muted-foreground">Chưa nộp bài</span>
                  )}
                </div>

                <h3 className="mt-1.5 text-base font-bold text-foreground">
                  {lesson.assignment?.title || 'Bài tập tự luận & thực hành'}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {lesson.assignment?.deadline
                    ? `Hạn nộp: ${new Date(lesson.assignment.deadline).toLocaleString('vi-VN')}`
                    : 'Không giới hạn thời hạn nộp.'}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <Button
                onClick={onOpenAssignment}
                variant="outline"
                icon={<FileCheck className="h-4 w-4" />}
                className="w-full sm:w-auto shadow-xs"
              >
                {assignmentSubmissionsCount > 0 ? 'Xem bài đã nộp' : 'Xem đề & Nộp bài tập'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

/* ==========================================================================
   COMPONENT: WorkspaceTabs (Cleaned up workspace tabs)
   ========================================================================== */
function WorkspaceTabs({
  activeTab,
  onChange,
}: {
  activeTab: WorkspaceTab
  onChange: (tab: WorkspaceTab) => void
}) {
  const tabs: Array<{ id: WorkspaceTab; label: string; icon: ReactNode }> = [
    { id: 'learn', label: 'Bài học', icon: <BookOpen /> },
    { id: 'mindmap', label: 'Sơ đồ tư duy', icon: <BrainCircuit /> },
    { id: 'discussion', label: 'Thảo luận', icon: <MessageSquare /> },
    { id: 'ai', label: 'Gia sư AI', icon: <Sparkles /> },
    { id: 'notes', label: 'Ghi chú', icon: <StickyNote /> },
  ]

  return (
    <div className="overflow-x-auto border-b border-border bg-muted/20 p-2">
      <div className="inline-flex min-w-max gap-1">
        {tabs.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-medium transition [&>svg]:h-4 [&>svg]:w-4',
                active
                  ? 'bg-surface-elevated text-foreground shadow-soft font-semibold'
                  : 'text-muted-foreground hover:bg-surface-elevated/70 hover:text-foreground'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function AiTutorPanel({ courseId }: { courseId: string | undefined }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card padding="responsive" variant="outlined" className="hover:border-primary/40 transition">
        <Sparkles className="h-6 w-6 text-primary" />
        <h3 className="mt-3 font-semibold text-foreground">Hỏi đáp về khóa học</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Mở gia sư AI với ngữ cảnh khóa học để yêu cầu giải thích, tóm tắt bài học hoặc gợi ý giải pháp.
        </p>
        <Link to={`/app/student/chat?course_id=${courseId}`} className="mt-4 inline-flex">
          <Button size="sm">Mở Gia sư AI</Button>
        </Link>
      </Card>
      <Card padding="responsive" variant="outlined" className="hover:border-primary/40 transition">
        <ListChecks className="h-6 w-6 text-primary" />
        <h3 className="mt-3 font-semibold text-foreground">Tạo bài trắc nghiệm ôn tập bằng AI</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Tạo bộ đề kiểm tra trắc nghiệm tức thì từ nội dung bài học để kiểm tra kiến thức của bản thân.
        </p>
        <Link to={`/app/student/quiz?course_id=${courseId}`} className="mt-4 inline-flex">
          <Button size="sm" variant="outline">
            Tạo bài trắc nghiệm
          </Button>
        </Link>
      </Card>
    </div>
  )
}

function NotesPanel() {
  return (
    <EmptyState
      compact
      icon={<StickyNote />}
      title="Tính năng ghi chú bài học đang hoàn thiện"
      description="Giao diện ghi chú đang được chuẩn bị và sẽ sớm hỗ trợ lưu ghi chú cá nhân của bạn trong bài học này."
      action={
        <Button variant="outline" disabled>
          Sắp ra mắt
        </Button>
      }
    />
  )
}

function MaterialViewer({ item, onVideoEnded }: { item: CourseMaterial; onVideoEnded: () => void }) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex aspect-video items-center justify-center bg-muted/50">
        {item.material_type === 'video' && item.file_url ? (
          <video src={item.file_url} controls className="h-full w-full" onEnded={onVideoEnded} />
        ) : item.material_type === 'image' && item.file_url ? (
          <img src={item.file_url} alt={item.title ?? undefined} className="max-h-full max-w-full object-contain" />
        ) : item.material_type === 'url' && item.external_url ? (
          <iframe
            src={item.external_url}
            className="h-full w-full"
            title={item.title ?? undefined}
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-scripts"
          />
        ) : item.file_url ? (
          <iframe
            src={item.file_url}
            className="h-full w-full"
            title={item.title ?? undefined}
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-scripts"
          />
        ) : (
          <EmptyState
            compact
            icon={<FileText />}
            title="Không thể xem trước"
            description="Mở tài nguyên đính kèm trong tab mới nếu có liên kết."
          />
        )}
      </div>
      {(item.external_url || item.file_url) && (
        <div className="border-t border-border p-4 flex justify-between items-center bg-muted/10">
          <span className="text-xs text-muted-foreground">{item.file_name}</span>
          <a href={item.external_url || item.file_url || '#'} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              Mở học liệu
            </Button>
          </a>
        </div>
      )}
    </Card>
  )
}
