import { useState } from 'react'
import {
  BookOpen,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  Download,
  FileCheck,
  FileText,
  Headphones,
  HelpCircle,
  MessageSquare,
  Paperclip,
  Play,
  RotateCcw,
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
    <div className="space-y-4">
      {/* Tab Navigation Header */}
      <div className="border-b border-border bg-card/60 rounded-xl px-2 py-1 flex items-center gap-1 overflow-x-auto scrollbar-none shadow-xs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0',
                isActive
                  ? 'bg-primary/10 text-primary font-bold shadow-2xs'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
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
          <Card padding="responsive" className="shadow-xs border border-border/80">
            <NotesPanel
              courseId={courseId}
              lessonId={isLesson ? currentItem.id : undefined}
              lessonTitle={currentItem.title}
            />
          </Card>
        )}

        {activeTab === 'discussion' && (
          <Card padding="responsive" className="shadow-xs border border-border/80">
            <div className="mb-4 border-b border-border pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground text-sm">Hỏi đáp & Thảo luận</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{currentItem.title}</p>
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
              <Card padding="responsive">
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

  if (!lesson && currentItem.kind === 'material') {
    return (
      <Card padding="responsive" className="space-y-3">
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

  return (
    <div className="space-y-5">
      {/* Lesson Description */}
      {lesson.description && (
        <Card padding="responsive" className="border border-border/70 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
            Mục tiêu & Tóm tắt bài học
          </h3>
          <p className="text-sm leading-relaxed text-foreground/90">{lesson.description}</p>
        </Card>
      )}

      {/* Collapsible Audio Podcast TTS Summary */}
      <Card padding="none" className="border border-border/70 overflow-hidden shadow-xs">
        <button
          onClick={() => setAudioExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Headphones className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground">Tóm tắt âm thanh (Podcast AI)</span>
              <p className="text-[11px] text-muted-foreground">Nghe tóm tắt nội dung cốt lõi của bài học bằng giọng đọc AI</p>
            </div>
          </div>
          <div className="text-muted-foreground">
            {audioExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        {audioExpanded && (
          <div className="p-4 border-t border-border bg-card">
            <LessonAudioPlayer lessonId={lesson.id} lessonTitle={lesson.title} />
          </div>
        )}
      </Card>

      {/* Reading / Article Content */}
      {lesson.content && lesson.content.trim().length > 0 && (
        <Card padding="responsive" className="border border-border/70 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Nội dung bài đọc chi tiết
            </h3>
          </div>
          <div className="prose prose-sm max-w-none dark:prose-invert leading-relaxed text-foreground/90 whitespace-pre-wrap">
            {lesson.content}
          </div>
        </Card>
      )}

      {/* Attachments / Reference Documents */}
      {hasDocs && (
        <Card padding="responsive" className="border border-border/70 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <Paperclip className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Tài liệu & Tệp đính kèm ({documentAttachments.length})
            </h3>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {documentAttachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/20 p-3 transition-all hover:border-primary/40 hover:bg-muted/40 shadow-2xs"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-foreground" title={att.file_name}>
                    {att.file_name}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {att.file_size ? formatFileSize(att.file_size) : 'Tài liệu học tập'}
                  </p>
                </div>
                <a
                  href={att.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Button size="sm" variant="outline" className="h-7 text-xs" icon={<Download className="h-3 w-3" />}>
                    Tải về
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quiz Card */}
      {hasQuiz && (
        <Card padding="responsive" className="border-violet-500/20 bg-violet-500/[0.02] shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                  bestQuizAttempt?.passed
                    ? 'bg-success/15 text-success ring-1 ring-success/30'
                    : 'bg-violet-500/15 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/30'
                )}
              >
                {bestQuizAttempt?.passed ? <Trophy className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="primary" label="Trắc nghiệm" />
                  {bestQuizAttempt?.passed ? (
                    <Badge variant="success" label={`Đạt: ${Math.round(bestQuizAttempt.score || 0)}/100`} />
                  ) : bestQuizAttempt ? (
                    <Badge variant="error" label={`Điểm: ${Math.round(bestQuizAttempt.score || 0)}/100 (Chưa đạt)`} />
                  ) : (
                    <span className="text-xs text-muted-foreground">Chưa làm bài</span>
                  )}
                </div>

                <h4 className="mt-1 text-sm font-bold text-foreground">
                  {lesson.quiz?.title || 'Bài kiểm tra trắc nghiệm củng cố kiến thức'}
                </h4>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {quizAttempts.length > 0
                    ? `Đã làm ${quizAttempts.length} lần.`
                    : 'Làm bài kiểm tra để củng cố kiến thức và ghi nhận tiến độ.'}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <Button
                onClick={onOpenQuiz}
                variant={bestQuizAttempt?.passed ? 'outline' : 'primary'}
                size="sm"
                icon={bestQuizAttempt?.passed ? <RotateCcw className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              >
                {bestQuizAttempt?.passed ? 'Làm lại' : 'Làm bài trắc nghiệm'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Assignment Card */}
      {hasAssignment && (
        <Card padding="responsive" className="border-amber-500/20 bg-amber-500/[0.02] shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30">
                <FileCheck className="h-5 w-5" />
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

                <h4 className="mt-1 text-sm font-bold text-foreground">
                  {lesson.assignment?.title || 'Bài tập tự luận & thực hành'}
                </h4>
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
                size="sm"
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
