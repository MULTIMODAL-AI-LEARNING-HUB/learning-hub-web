import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Bot,
  ChevronRight,
  FileText,
  MessageCircle,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  Video,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Progress } from '../../../components/ui/Progress'
import { ThemeToggle } from '../../../components/ui/ThemeToggle'
import { cn } from '../../../utils/cn'

interface FocusTopBarProps {
  courseId: string
  courseTitle: string
  currentLessonTitle?: string
  currentLessonKind?: 'lesson' | 'material'
  hasVideo?: boolean
  overallProgress: number
  completedCount: number
  totalCount: number
  curriculumOpen: boolean
  onToggleCurriculum: () => void
  chatOpen: boolean
  onToggleChat: () => void
  aiOpen: boolean
  onToggleAi: () => void
}

export function FocusTopBar({
  courseId,
  courseTitle,
  currentLessonTitle,
  currentLessonKind = 'lesson',
  hasVideo = false,
  overallProgress,
  completedCount,
  totalCount,
  curriculumOpen,
  onToggleCurriculum,
  chatOpen,
  onToggleChat,
  aiOpen,
  onToggleAi,
}: FocusTopBarProps) {
  return (
    <header className="sticky top-0 h-16 shrink-0 border-b border-border/60 bg-surface-elevated/80 backdrop-blur-xl px-3 sm:px-5 flex items-center justify-between gap-3 z-30 shadow-[0_1px_12px_rgba(0,0,0,0.04)]">
      {/* Left: Back + Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Link to={`/app/student/courses/${courseId}`}>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-xl p-0 text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all"
            title="Quay lại thông tin khóa học"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        <div className="min-w-0 flex-1 flex items-center gap-1.5">
          <span
            className="text-[13px] font-semibold text-muted-foreground truncate max-w-[180px] md:max-w-[260px] hidden md:inline hover:text-foreground transition-colors cursor-default"
            title={courseTitle}
          >
            {courseTitle}
          </span>

          {currentLessonTitle && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 hidden md:inline" />
              <div className="flex items-center gap-2 min-w-0">
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary bg-gradient-to-r from-primary/15 to-accent/15 ring-1 ring-primary/20 px-2.5 py-1 rounded-full shrink-0">
                  {currentLessonKind === 'material' ? (
                    <BookOpen className="h-3 w-3" />
                  ) : hasVideo ? (
                    <Video className="h-3 w-3" />
                  ) : (
                    <FileText className="h-3 w-3" />
                  )}
                  {currentLessonKind === 'material' ? 'Học liệu' : hasVideo ? 'Video' : 'Bài đọc'}
                </span>
                <span className="text-[13px] font-bold text-foreground truncate" title={currentLessonTitle}>
                  {currentLessonTitle}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Center: Progress pill */}
      <div className="hidden lg:flex items-center gap-3 shrink-0 rounded-2xl bg-muted/40 ring-1 ring-border/60 px-4 py-1.5">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Tiến độ</span>
          <div className="w-28">
            <Progress value={overallProgress} size="sm" className="h-1.5" />
          </div>
          <span className="text-xs font-extrabold text-primary tabular-nums">{overallProgress}%</span>
        </div>
        <span className="h-4 w-px bg-border" />
        <span className="text-[11px] font-medium text-muted-foreground tabular-nums whitespace-nowrap">
          {completedCount}/{totalCount} bài
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          variant={chatOpen ? 'primary' : 'outline'}
          size="sm"
          onClick={onToggleChat}
          className={cn(
            'h-9 px-3 rounded-xl text-xs font-semibold transition-all',
            chatOpen
              ? 'shadow-[0_4px_14px_rgba(79,70,229,0.35)]'
              : 'hover:border-primary/40 hover:text-primary'
          )}
          title="Mở phòng chat khóa học"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline ml-1.5">Phòng chat</span>
        </Button>

        {/* AI Tutor — Copilot gradient highlight */}
        <Button
          size="sm"
          onClick={onToggleAi}
          className={cn(
            'h-9 px-3 rounded-xl text-xs font-bold transition-all border-0',
            aiOpen
              ? 'bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] text-white shadow-[0_4px_18px_rgba(124,58,237,0.45)]'
              : 'bg-gradient-to-r from-primary/10 to-accent/10 text-primary ring-1 ring-primary/25 hover:ring-primary/50 hover:shadow-[0_2px_12px_rgba(124,58,237,0.25)]'
          )}
          title="Trợ lý AI ôn tập & giải đáp"
        >
          {aiOpen ? <Bot className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline ml-1.5">Hỏi AI</span>
        </Button>

        <ThemeToggle />

        <Button
          variant={curriculumOpen ? 'secondary' : 'outline'}
          size="sm"
          onClick={onToggleCurriculum}
          className="h-9 px-3 rounded-xl text-xs font-semibold transition-all hover:border-primary/40"
          title={curriculumOpen ? 'Thu gọn danh sách bài học' : 'Mở danh sách bài học'}
        >
          {curriculumOpen ? (
            <>
              <PanelRightClose className="h-3.5 w-3.5" />
              <span className="hidden xl:inline ml-1.5">Thu gọn</span>
            </>
          ) : (
            <>
              <PanelRightOpen className="h-3.5 w-3.5" />
              <span className="hidden xl:inline ml-1.5">Giáo trình</span>
            </>
          )}
        </Button>
      </div>
    </header>
  )
}
