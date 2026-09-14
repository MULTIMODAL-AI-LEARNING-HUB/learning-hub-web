import { Bot, X } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { CourseAiTutorPanel } from '../CourseAiTutorPanel'
import type { Lesson } from '../../../services/api'

interface AiTutorDrawerProps {
  courseId: string
  courseTitle: string
  lessonTitle?: string
  currentLesson?: Lesson | null
  open: boolean
  onClose: () => void
  onOpenQuiz?: () => void
}

export function AiTutorDrawer({
  courseId,
  courseTitle,
  lessonTitle,
  currentLesson,
  open,
  onClose,
  onOpenQuiz,
}: AiTutorDrawerProps) {
  if (!open) return null

  const activeLessonTitle = lessonTitle || currentLesson?.title

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative w-full max-w-md sm:max-w-xl md:max-w-2xl h-full bg-card shadow-2xl animate-slide-in-right flex flex-col overflow-hidden rounded-l-2xl border-l border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-surface-elevated/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-foreground truncate">Gia sư AI Khóa học</h2>
                <span className="inline-flex items-center text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.2 rounded">
                  Chuyên biệt
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate" title={activeLessonTitle ? `${activeLessonTitle} • ${courseTitle}` : courseTitle}>
                {activeLessonTitle ? `${activeLessonTitle} • ${courseTitle}` : courseTitle}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            onClick={onClose}
            title="Đóng trợ lý AI"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* In-place AI Tutor Panel */}
        <div className="flex-1 overflow-hidden p-0">
          <CourseAiTutorPanel
            courseId={courseId}
            courseTitle={courseTitle}
            currentLesson={currentLesson}
            onOpenQuiz={onOpenQuiz}
            className="h-full max-h-full border-0 shadow-none rounded-none"
          />
        </div>
      </div>
    </div>
  )
}
