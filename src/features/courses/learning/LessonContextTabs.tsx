import { useState } from 'react'
import {
  AlarmClock,
  BookOpen,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  Eye,
  FileCheck,
  FileText,
  Headphones,
  HelpCircle,
  MessageSquare,
  Paperclip,
  Play,
  RotateCcw,
  Sparkles,
  StickyNote,
  Trophy,
} from 'lucide-react'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { cn } from '../../../utils/cn'
import type { Lesson, QuizAttempt } from '../../../services/api'
import { DiscussionPanel } from '../DiscussionPanel'
import { LessonAudioPlayer } from '../LessonAudioPlayer'
import { LessonMindmapView } from '../LessonMindmapView'
import { NotesPanel } from './NotesPanel'
import { SecureDocumentViewer } from './SecureDocumentViewer'
import {
  formatFileSize,
  isVideoFile,
  type ContextTab,
  type LearningItem,
} from './types'

interface LessonContextTabsProps {
  courseId: string
  currentItem: LearningItem
  currentLesson: Lesson | null
  activeTab: ContextTab
  onChangeTab: (tab: ContextTab) => void
  onOpenQuiz: () => void
  onOpenAssignment: () => void
  quizAttempts: QuizAttempt[]
  assignmentSubmissionsCount: number
  assignmentMaxScore: number | null
  highestSubmissionScore: number | null
}

export function LessonContextTabs({
  courseId,
  currentItem,
  currentLesson,
  activeTab,
  onChangeTab,
  onOpenQuiz,
  onOpenAssignment,
  quizAttempts,
  assignmentSubmissionsCount,
  assignmentMaxScore,
  highestSubmissionScore,
}: LessonContextTabsProps) {
  const isLesson = currentItem.kind === 'lesson'
  const lesson = currentLesson || (isLesson ? currentItem.lesson : null)

  const tabs: Array<{ id: ContextTab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Tổng quan & Học liệu', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'notes', label: 'Ghi chú', icon: <StickyNote className="h-4 w-4" /> },
    { id: 'discussion', label: 'Hỏi đáp bài học', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'mindmap', label: 'Sơ đồ tư duy', icon: <BrainCircuit className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-5">
      {/* Tab Navigation — floating segmented control */}
      <div className="sticky top-16 z-10 rounded-2xl bg-surface-elevated/80 backdrop-blur-xl ring-1 ring-border/60 shadow-[0_2px_16px_rgba(0,0,0,0.05)] px-2 py-1.5 flex items-center gap-1 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 shrink-0',
                isActive
                  ? 'bg-gradient-to-r from-primary to-accent text-white shadow-[0_4px_14px_rgba(79,70,229,0.35)]'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content Panes */}
      <div className="animate-fade-in min-h-[300px]">
        {activeTab === 'overview' && (
          <OverviewTabContent
            currentItem={currentItem}
            lesson={lesson}
            onOpenQuiz={onOpenQuiz}
            onOpenAssignment={onOpenAssignment}
            quizAttempts={quizAttempts}
            assignmentSubmissionsCount={assignmentSubmissionsCount}
            assignmentMaxScore={assignmentMaxScore}
            highestSubmissionScore={highestSubmissionScore}
          />
        )}

        {activeTab === 'notes' && (
          <Card padding="responsive" className="rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.05)] border border-border/60">
            <NotesPanel
              courseId={courseId}
              lessonId={isLesson ? currentItem.id : undefined}
              lessonTitle={currentItem.title}
            />
          </Card>
        )}

        {activeTab === 'discussion' && (
          <Card padding="responsive" className="rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.05)] border border-border/60">
            <div className="mb-4 border-b border-border/60 pb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-[15px]">Hỏi đáp & Thảo luận</h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{currentItem.title}</p>
              </div>
            </div>
            {isLesson ? (
              <DiscussionPanel key={currentItem.id} lessonId={currentItem.id} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Học liệu này chưa có diễn đàn thảo luận. Vui lòng mở bài học tương ứng.
              </p>
            )}
          </Card>
        )}

        {activeTab === 'mindmap' && (
          <div className="space-y-4">
            {lesson ? (
              <LessonMindmapView lessonId={lesson.id} lessonTitle={lesson.title} />
            ) : (
              <Card padding="responsive" className="rounded-2xl">
                <p className="text-sm text-muted-foreground">
                  Vui lòng chọn một bài học để xem sơ đồ tư duy AI.
                </p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Estimate reading time from plain text (Vietnamese ~200 wpm)
function estimateReadingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

function OverviewTabContent({
  currentItem,
  lesson,
  onOpenQuiz,
  onOpenAssignment,
  quizAttempts,
  assignmentSubmissionsCount,
  assignmentMaxScore,
  highestSubmissionScore,
}: {
  currentItem: LearningItem
  lesson: Lesson | null
  onOpenQuiz: () => void
  onOpenAssignment: () => void
  quizAttempts: QuizAttempt[]
  assignmentSubmissionsCount: number
  assignmentMaxScore: number | null
  highestSubmissionScore: number | null
}) {
  const [audioExpanded, setAudioExpanded] = useState(false)
  const [viewingDoc, setViewingDoc] = useState<{ url: string; name: string } | null>(null)

  if (!lesson && currentItem.kind === 'material') {
    return (
      <Card padding="responsive" className="rounded-2xl space-y-3 border-border/60">
        <h3 className="text-base font-bold text-foreground">{currentItem.title}</h3>
        {currentItem.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{currentItem.description}</p>
        )}
      </Card>
    )
  }

  if (!lesson) return null

  const attachments = lesson.attachments || []
  const documentAttachments = attachments.filter((a) => !isVideoFile(a.file_name, a.file_type))
  const hasDocs = documentAttachments.length > 0
  const hasQuiz = Boolean(lesson.has_quiz || lesson.quiz)
  const hasAssignment = Boolean(lesson.has_assignment || lesson.assignment)
  const bestQuizAttempt = quizAttempts.length > 0
    ? [...quizAttempts].sort((a, b) => (b.score || 0) - (a.score || 0))[0]
    : null

  const readingMinutes = lesson.content?.trim() ? estimateReadingMinutes(lesson.content) : null

  return (
    <div className="space-y-5">
      {/* Lesson goals summary */}
      {lesson.description && (
        <Card padding="responsive" className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/[0.04] via-transparent to-accent/[0.04] shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-primary">
              Mục tiêu & Tóm tắt bài học
            </h3>
          </div>
          <p className="text-[14px] leading-relaxed text-foreground/90">{lesson.description}</p>
        </Card>
      )}

      {/* Audio podcast summary — accent gradient */}
      <Card padding="none" className="rounded-2xl border border-violet-500/20 overflow-hidden shadow-[0_2px_16px_rgba(124,58,237,0.08)]">
        <button
          onClick={() => setAudioExpanded((v) => !v)}
          className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-4 bg-gradient-to-r from-violet-500/[0.07] via-fuchsia-500/[0.05] to-transparent hover:from-violet-500/[0.12] transition-all text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_4px_12px_rgba(139,92,246,0.4)]">
              <Headphones className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-foreground">Tóm tắt âm thanh (Podcast AI)</span>
                <Badge variant="primary" label="AI Voice" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">Nghe tóm tắt nội dung cốt lõi bằng giọng đọc AI</p>
            </div>
          </div>
          <div className={cn(
            'shrink-0 flex h-8 w-8 items-center justify-center rounded-full ring-1 transition-all',
            audioExpanded ? 'bg-violet-500 text-white ring-violet-500' : 'bg-muted/60 text-muted-foreground ring-border'
          )}>
            {audioExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        {audioExpanded && (
          <div className="p-4 sm:p-5 border-t border-border/60 bg-card animate-fade-in">
            <LessonAudioPlayer lessonId={lesson.id} lessonTitle={lesson.title} />
          </div>
        )}
      </Card>

      {/* Reading content — editorial typography */}
      {lesson.content && lesson.content.trim().length > 0 && (
        <Card padding="responsive" className="rounded-2xl border border-border/60 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                <FileText className="h-4 w-4" />
              </span>
              <h3 className="text-[13px] font-extrabold uppercase tracking-[0.06em] text-foreground">
                Nội dung bài đọc chi tiết
              </h3>
            </div>
            {readingMinutes !== null && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">
                <AlarmClock className="h-3 w-3" /> ~{readingMinutes} phút đọc
              </span>
            )}
          </div>
          <div className="prose prose-sm sm:prose-[15px] max-w-none dark:prose-invert leading-[1.85] text-foreground/90 whitespace-pre-wrap font-normal">
            {lesson.content}
          </div>
        </Card>
      )}

      {/* Attachments */}
      {hasDocs && (
        <Card padding="responsive" className="rounded-2xl border border-border/60 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2.5 border-b border-border/60 pb-4 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
              <Paperclip className="h-4 w-4" />
            </span>
            <h3 className="text-[13px] font-extrabold uppercase tracking-[0.06em] text-foreground">
              Tài liệu & Tệp đính kèm
            </h3>
            <span className="ml-auto text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full tabular-nums">
              {documentAttachments.length}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {documentAttachments.map((att) => (
              <div
                key={att.id}
                className="group flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 p-3.5 transition-all hover:border-blue-500/40 hover:bg-blue-500/[0.04] hover:shadow-[0_4px_14px_rgba(59,130,246,0.12)]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-foreground" title={att.file_name}>
                      {att.file_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {att.file_size ? formatFileSize(att.file_size) : 'Tài liệu học tập'}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs shrink-0 rounded-lg group-hover:border-blue-500/50 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                  icon={<Eye className="h-3 w-3" />}
                  onClick={() => setViewingDoc({ url: att.file_url, name: att.file_name })}
                >
                  Xem
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* In-app secure document viewer modal */}
      {viewingDoc && (
        <SecureDocumentViewer
          open={Boolean(viewingDoc)}
          fileUrl={viewingDoc.url}
          fileName={viewingDoc.name}
          onClose={() => setViewingDoc(null)}
        />
      )}

      {/* Quiz card — premium violet gradient */}
      {hasQuiz && (
        <Card padding="responsive" className="rounded-2xl border-0 bg-gradient-to-br from-violet-600/[0.08] via-violet-500/[0.04] to-fuchsia-500/[0.07] ring-1 ring-violet-500/25 shadow-[0_4px_24px_rgba(124,58,237,0.12)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm',
                  bestQuizAttempt?.passed
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.4)]'
                    : 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_4px_12px_rgba(139,92,246,0.4)]'
                )}
              >
                {bestQuizAttempt?.passed ? <Trophy className="h-6 w-6" /> : <HelpCircle className="h-6 w-6" />}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="primary" label="Trắc nghiệm" />
                  {bestQuizAttempt?.passed ? (
                    <Badge variant="success" label={`Đạt: ${Math.round(bestQuizAttempt.score || 0)}/100`} />
                  ) : bestQuizAttempt ? (
                    <Badge variant="error" label={`Điểm: ${Math.round(bestQuizAttempt.score || 0)}/100 (Chưa đạt)`} />
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">Chưa làm bài</span>
                  )}
                </div>

                <h4 className="mt-1.5 text-[15px] font-bold text-foreground">
                  {lesson.quiz?.title || 'Bài kiểm tra trắc nghiệm củng cố kiến thức'}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {quizAttempts.length > 0
                    ? `Đã làm ${quizAttempts.length} lần — tiếp tục luyện tập để nâng cao điểm số.`
                    : 'Làm bài kiểm tra để củng cố kiến thức và ghi nhận tiến độ học tập.'}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <Button
                onClick={onOpenQuiz}
                variant={bestQuizAttempt?.passed ? 'outline' : 'primary'}
                size="sm"
                className={cn(
                  'rounded-xl h-10 px-5 font-bold',
                  !bestQuizAttempt?.passed && 'bg-gradient-to-r from-violet-600 to-fuchsia-600 border-0 shadow-[0_4px_14px_rgba(139,92,246,0.4)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.5)]'
                )}
                icon={bestQuizAttempt?.passed ? <RotateCcw className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              >
                {bestQuizAttempt?.passed ? 'Làm lại' : 'Làm bài trắc nghiệm'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Assignment card — warm amber gradient */}
      {hasAssignment && (
        <Card padding="responsive" className="rounded-2xl border-0 bg-gradient-to-br from-amber-500/[0.09] via-orange-500/[0.04] to-yellow-500/[0.07] ring-1 ring-amber-500/25 shadow-[0_4px_24px_rgba(245,158,11,0.10)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-[0_4px_12px_rgba(245,158,11,0.4)]">
                <FileCheck className="h-6 w-6" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="warning" label="Bài tập thực hành" />
                  {highestSubmissionScore !== null ? (
                    <Badge variant="success" label={`Điểm: ${highestSubmissionScore}/${assignmentMaxScore || 100}`} />
                  ) : assignmentSubmissionsCount > 0 ? (
                    <Badge variant="info" label={`Đã nộp (${assignmentSubmissionsCount} lần)`} />
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">Chưa nộp bài</span>
                  )}
                </div>

                <h4 className="mt-1.5 text-[15px] font-bold text-foreground">
                  {lesson.assignment?.title || 'Bài tập tự luận & thực hành'}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  {lesson.assignment?.deadline
                    ? `Hạn nộp: ${new Date(lesson.assignment.deadline).toLocaleString('vi-VN')}`
                    : 'Không giới hạn thời hạn nộp — bạn có thể nộp bất cứ lúc nào.'}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <Button
                onClick={onOpenAssignment}
                variant="outline"
                size="sm"
                className="rounded-xl h-10 px-5 font-bold border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                icon={<FileCheck className="h-3.5 w-3.5" />}
              >
                {assignmentSubmissionsCount > 0 ? 'Xem bài nộp' : 'Xem đề & Nộp bài'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
