/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  ListChecks,
  Menu,
  MessageSquare,
  PlayCircle,
  Sparkles,
  StickyNote,
  X,
} from 'lucide-react'
import {
  coursesApi,
  enrollmentsApi,
  lessonsApi,
  sectionsApi,
  type Course,
  type CourseMaterial,
  type Enrollment,
  type Lesson,
  type MaterialProgress,
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
import { StudentAssignmentsPanel } from './StudentAssignmentsPanel'

type LearningItem =
  | { kind: 'lesson'; id: string; sectionId: string; title: string; description: string | null; lesson: Lesson }
  | { kind: 'material'; id: string; sectionId: 'materials'; title: string; description: string | null; material: CourseMaterial }
type WorkspaceTab = 'learn' | 'discussion' | 'assignments' | 'resources' | 'ai' | 'notes'

const WORKSPACE_TABS: WorkspaceTab[] = ['learn', 'discussion', 'assignments', 'resources', 'ai', 'notes']

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
  return `${mins} min`
}

function materialTypeLabel(type: string) {
  if (!type) return 'Resource'
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
}

export function CourseLearning() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [progress, setProgress] = useState<Map<string, MaterialProgress>>(new Map())
  const [currentItemKey, setCurrentItemKey] = useState<string | null>(null)
  const [currentLessonDetail, setCurrentLessonDetail] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<WorkspaceTab>('learn')

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
          setEnrollment((prev) => prev ? { ...prev, progress_percent: progressRes.data.completion_percent } : null)
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
    const sectionGroups: LearningSection[] = sections.map((section) => ({
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
    })).filter((section) => section.items.length > 0)

    const materialItems = (course?.materials || []).map((material) => ({
      kind: 'material' as const,
      id: material.id,
      sectionId: 'materials' as const,
      title: material.title || material.file_name || 'Untitled material',
      description: material.file_name,
      material,
    }))

    if (materialItems.length > 0) {
      sectionGroups.push({
        id: 'materials',
        title: sectionGroups.length > 0 ? 'Additional Materials' : 'Course Materials',
        description: 'Downloadable or embedded resources provided by the lecturer.',
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

  useEffect(() => {
    if (!currentItem || currentItem.kind !== 'lesson') {
      setCurrentLessonDetail(null)
      return
    }

    let cancelled = false
    lessonsApi.get(currentItem.sectionId, currentItem.id)
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

  const updateMaterialProgress = useCallback(async (materialId: string, completionPercent: number) => {
    if (!enrollment) return
    setUpdating(true)
    try {
      await enrollmentsApi.updateProgress(enrollment.id, materialId, { completion_percent: completionPercent })
      const progressRes = await enrollmentsApi.getProgress(enrollment.id)
      setEnrollment((prev) => prev ? { ...prev, progress_percent: progressRes.data.completion_percent } : prev)
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
  }, [enrollment])

  const markCurrentComplete = async () => {
    if (!currentItem || currentItem.kind !== 'material') return
    await updateMaterialProgress(currentItem.id, 100)
  }

  const completedMaterials = Array.from(progress.values()).filter((item) => item.completed || item.completion_percent >= 100).length
  const totalMaterials = course?.materials?.length || 0
  const overallProgress = Math.round(enrollment?.progress_percent || 0)
  const currentLesson = currentItem?.kind === 'lesson' ? (currentLessonDetail || currentItem.lesson) : null

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
        title="You are not enrolled in this course"
        description="Enroll in the course before opening the learning workspace."
        action={(
          <Link to={`/app/student/courses/${id}`}>
            <Button variant="outline">Back to course details</Button>
          </Link>
        )}
      />
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link to={`/app/student/courses/${id}`}>
            <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
              Back to course
            </Button>
          </Link>
          <h1 className="mt-2 text-fluid-xl font-semibold text-foreground">{course.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Focused learning workspace with lessons, resources, AI help, and course discussion.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden"
          onClick={() => setSidebarOpen((value) => !value)}
          icon={sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        >
          {sidebarOpen ? 'Hide curriculum' : 'Show curriculum'}
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
        <aside className={cn('lg:block', sidebarOpen ? 'block' : 'hidden')}>
          <Card padding="none" className="overflow-hidden lg:sticky lg:top-4">
            <div className="border-b border-border p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Course progress</span>
                <span className="font-semibold text-foreground tabular-nums">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} />
              <p className="mt-2 text-xs text-muted-foreground">
                {totalMaterials > 0
                  ? `${completedMaterials}/${totalMaterials} tracked materials completed`
                  : 'Lesson progress tracking is not available for this course yet.'}
              </p>
            </div>

            <div className="max-h-[calc(100vh-15rem)] space-y-4 overflow-y-auto p-3">
              {learningSections.length === 0 ? (
                <EmptyState
                  compact
                  icon={<ListChecks />}
                  title="No curriculum yet"
                  description="The lecturer has not added lessons or materials."
                />
              ) : (
                learningSections.map((section) => (
                  <div key={section.id}>
                    <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{section.title}</p>
                    <div className="mt-2 space-y-1">
                      {section.items.map((item, index) => (
                        <CurriculumButton
                          key={itemKey(item)}
                          item={item}
                          index={index}
                          active={currentItem ? itemKey(item) === itemKey(currentItem) : false}
                          completed={item.kind === 'material' && (progress.get(item.id)?.completed || (progress.get(item.id)?.completion_percent || 0) >= 100)}
                          onClick={() => goToItem(item)}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </aside>

        <main className="min-w-0 space-y-5">
          {currentItem ? (
            <>
              <Card padding="none" className="overflow-hidden">
                <WorkspaceTabs activeTab={activeWorkspaceTab} onChange={changeWorkspaceTab} />
              </Card>

              {activeWorkspaceTab === 'learn' && (
                <>
                  <Card padding="responsive">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <Badge
                          variant={currentItem.kind === 'lesson' ? 'primary' : 'info'}
                          label={currentItem.kind === 'lesson' ? currentItem.lesson.type : materialTypeLabel(currentItem.material.material_type)}
                        />
                        <h2 className="mt-3 text-fluid-lg font-semibold text-foreground">{currentItem.title}</h2>
                        {currentItem.description && (
                          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{currentItem.description}</p>
                        )}
                      </div>

                      {currentItem.kind === 'material' && (
                        progress.get(currentItem.id)?.completed || (progress.get(currentItem.id)?.completion_percent || 0) >= 100 ? (
                          <Badge variant="success" label="Completed" />
                        ) : (
                          <Button onClick={markCurrentComplete} loading={updating} icon={<CheckCircle2 className="h-4 w-4" />}>
                            Mark complete
                          </Button>
                        )
                      )}
                    </div>
                  </Card>

                  <div className="space-y-4">
                      {currentItem.kind === 'material' ? (
                        <MaterialViewer item={currentItem.material} onVideoEnded={markCurrentComplete} />
                      ) : (
                        <LessonViewer lesson={currentLesson || currentItem.lesson} />
                      )}

                      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex gap-2">
                          <Button variant="outline" disabled={!previousItem} onClick={() => goToItem(previousItem)}>
                            Previous
                          </Button>
                          <Button variant="outline" disabled={!nextItem} onClick={() => goToItem(nextItem)}>
                            Next
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {currentIndex + 1} of {flatItems.length} learning items
                        </div>
                      </div>
                  </div>
                </>
              )}

              {activeWorkspaceTab === 'discussion' && (
                <CourseChatPanel courseId={course.id} compact />
              )}

              {activeWorkspaceTab === 'assignments' && (
                <StudentAssignmentsPanel courseId={course.id} />
              )}

              {activeWorkspaceTab === 'resources' && (
                <Card padding="responsive">
                  <ResourcesPanel item={currentItem} lesson={currentLesson} />
                </Card>
              )}

              {activeWorkspaceTab === 'ai' && (
                <AiTutorPanel courseId={id} />
              )}

              {activeWorkspaceTab === 'notes' && (
                <Card padding="responsive">
                  <NotesPanel />
                </Card>
              )}
            </>
          ) : (
            <EmptyState
              icon={<BookOpen />}
              title="Choose a lesson to start"
              description="Select a lesson or material from the curriculum."
            />
          )}
        </main>
      </div>
    </div>
  )
}

function CurriculumButton({
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
  const Icon = item.kind === 'lesson'
    ? item.lesson.type === 'VIDEO'
      ? PlayCircle
      : BookOpen
    : FileText

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full rounded-lg border px-3 py-2.5 text-left transition',
        active ? 'border-primary bg-primary/10 text-foreground' : 'border-transparent hover:bg-muted/70'
      )}
    >
      <div className="flex gap-3">
        <div className={cn(
          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium',
          completed ? 'bg-success/10 text-success' : active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}>
          {completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium">{item.title}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
            {item.kind === 'lesson' ? item.lesson.type : materialTypeLabel(item.material.material_type)}
          </p>
        </div>
      </div>
    </button>
  )
}

function WorkspaceTabs({ activeTab, onChange }: { activeTab: WorkspaceTab; onChange: (tab: WorkspaceTab) => void }) {
  const tabs: Array<{ id: WorkspaceTab; label: string; icon: ReactNode }> = [
    { id: 'learn', label: 'Learn', icon: <BookOpen /> },
    { id: 'discussion', label: 'Discussion', icon: <MessageSquare /> },
    { id: 'assignments', label: 'Assignments', icon: <ClipboardCheck /> },
    { id: 'resources', label: 'Resources', icon: <FileText /> },
    { id: 'ai', label: 'AI Tutor', icon: <Sparkles /> },
    { id: 'notes', label: 'Notes', icon: <StickyNote /> },
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
                'inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition [&>svg]:h-4 [&>svg]:w-4',
                active
                  ? 'bg-surface-elevated text-foreground shadow-soft'
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

function ResourcesPanel({ item, lesson }: { item: LearningItem; lesson: Lesson | null }) {
  const attachments = lesson?.attachments || []

  if (item.kind === 'material') {
    const resourceUrl = item.material.external_url || item.material.file_url
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Current material</h3>
        <div className="rounded-lg border border-border p-4">
          <p className="font-medium text-foreground">{item.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{materialTypeLabel(item.material.material_type)}</p>
          {resourceUrl ? (
            <a href={resourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex">
              <Button variant="outline" size="sm">Open resource</Button>
            </a>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No downloadable resource is attached.</p>
          )}
        </div>
      </div>
    )
  }

  if (attachments.length === 0) {
    return (
      <EmptyState
        compact
        icon={<FileText />}
        title="No resources for this lesson"
        description="Lesson attachments and downloadable resources will appear here."
      />
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Lesson resources</h3>
      <div className="grid gap-2">
        {attachments.map((attachment) => (
          <a
            key={attachment.id}
            href={attachment.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg border border-border p-3 text-sm transition hover:bg-muted/60"
          >
            <span className="font-medium text-foreground">{attachment.file_name}</span>
            <span className="text-xs text-muted-foreground">Open</span>
          </a>
        ))}
      </div>
    </div>
  )
}

function AiTutorPanel({ courseId }: { courseId: string | undefined }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card padding="responsive" variant="outlined">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="mt-3 font-semibold text-foreground">Ask about this course</h3>
        <p className="mt-1 text-sm text-muted-foreground">Open the AI tutor with this course context and ask for explanations, summaries, or practice ideas.</p>
        <Link to={`/app/student/chat?course_id=${courseId}`} className="mt-4 inline-flex">
          <Button size="sm">Open AI Tutor</Button>
        </Link>
      </Card>
      <Card padding="responsive" variant="outlined">
        <ListChecks className="h-5 w-5 text-primary" />
        <h3 className="mt-3 font-semibold text-foreground">Generate practice quiz</h3>
        <p className="mt-1 text-sm text-muted-foreground">Create a quiz from course context to check understanding after a lesson.</p>
        <Link to={`/app/student/quiz?course_id=${courseId}`} className="mt-4 inline-flex">
          <Button size="sm" variant="outline">Generate Quiz</Button>
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
      title="Lesson notes are not connected yet"
      description="The note-taking UI is planned, but it needs a notes API before saving real student notes."
      action={<Button variant="outline" disabled>Coming soon</Button>}
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
          <iframe src={item.external_url} className="h-full w-full" title={item.title ?? undefined} />
        ) : item.file_url ? (
          <iframe src={item.file_url} className="h-full w-full" title={item.title ?? undefined} />
        ) : (
          <EmptyState
            compact
            icon={<FileText />}
            title="Preview unavailable"
            description="Open the attached resource in a new tab if a link is provided."
          />
        )}
      </div>
      {(item.external_url || item.file_url) && (
        <div className="border-t border-border p-4">
          <a href={item.external_url || item.file_url || '#'} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">Open resource</Button>
          </a>
        </div>
      )}
    </Card>
  )
}

function LessonViewer({ lesson }: { lesson: Lesson }) {
  const hasVideo = lesson.type === 'VIDEO' && lesson.video_url
  const attachments = lesson.attachments || []

  return (
    <Card padding="responsive" className="space-y-5">
      {hasVideo && (
        <div className="overflow-hidden rounded-lg border border-border bg-muted">
          <iframe
            src={lesson.video_url || undefined}
            title={lesson.title}
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <div className="prose prose-sm max-w-none dark:prose-invert">
        {lesson.content ? (
          <div className="whitespace-pre-wrap text-sm leading-6 text-foreground">{lesson.content}</div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/25 p-4">
            <p className="text-sm text-muted-foreground">
              {lesson.description || 'This lesson currently contains overview information only. Check resources or ask the course chat for more context.'}
            </p>
          </div>
        )}
      </div>

      {lesson.video_duration && (
        <p className="text-xs text-muted-foreground">Estimated video duration: {formatDuration(lesson.video_duration)}</p>
      )}

      {attachments.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Resources</h3>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-border p-3 text-sm transition hover:bg-muted/60"
              >
                <span className="font-medium text-foreground">{attachment.file_name}</span>
                <span className="text-xs text-muted-foreground">Open</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg bg-info/10 p-4 text-sm text-info">
        Lesson completion tracking is coming next. Materials with progress support can already be marked complete.
      </div>
    </Card>
  )
}
