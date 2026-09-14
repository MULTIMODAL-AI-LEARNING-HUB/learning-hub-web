import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Bot,
  MessageCircle,
  PanelRightClose,
  PanelRightOpen,
  Video,
  FileText,
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
    <header className="h-14 shrink-0 border-b border-border bg-surface-elevated/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between gap-3 z-20">
      {/* Left section: Back + Course & Lesson Titles */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <Link to={`/app/student/courses/${courseId}`}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8.5 px-2 text-muted-foreground hover:text-foreground"
            title="Quay lại thông tin khóa học"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1 text-xs font-medium">Khóa học</span>
          </Button>
        </Link>

        <div className="h-4 w-[1px] bg-border shrink-0 hidden sm:block" />

        <div className="min-w-0 flex-1 flex items-center gap-2">
          <span className="text-xs font-bold text-foreground truncate max-w-[200px] md:max-w-[320px] hidden md:inline" title={courseTitle}>
            {courseTitle}
          </span>

          {currentLessonTitle && (
            <>
              <span className="text-muted-foreground text-xs hidden md:inline">/</span>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md shrink-0">
                  {currentLessonKind === 'material' ? (
                    <BookOpen className="h-3 w-3" />
                  ) : hasVideo ? (
                    <Video className="h-3 w-3" />
                  ) : (
                    <FileText className="h-3 w-3" />
                  )}
                  <span className="hidden sm:inline">
                    {currentLessonKind === 'material' ? 'Học liệu' : hasVideo ? 'Video' : 'Bài đọc'}
                  </span>
                </span>
                <span className="text-xs font-medium text-foreground truncate" title={currentLessonTitle}>
                  {currentLessonTitle}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Center/Right section: Progress Indicator */}
      <div className="hidden lg:flex items-center gap-3 w-48 shrink-0 px-2">
        <div className="flex-1">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-muted-foreground">Tiến độ</span>
            <span className="font-bold text-primary tabular-nums">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} size="sm" />
        </div>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* Right action controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Toggle Course Chat */}
        <Button
          variant={chatOpen ? 'primary' : 'outline'}
          size="sm"
          onClick={onToggleChat}
          className={cn('h-8 px-2.5 text-xs', chatOpen ? 'shadow-xs' : '')}
          title="Mở phòng chat khóa học"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline ml-1.5">Phòng chat</span>
        </Button>

        {/* Toggle AI Tutor */}
        <Button
          variant={aiOpen ? 'primary' : 'outline'}
          size="sm"
          onClick={onToggleAi}
          className={cn('h-8 px-2.5 text-xs', aiOpen ? 'shadow-xs' : '')}
          title="Trợ lý AI ôn tập & giải đáp"
        >
          <Bot className="h-3.5 w-3.5" />
          <span className="hidden sm:inline ml-1.5">Hỏi AI</span>
        </Button>

        <ThemeToggle />

        {/* Toggle Curriculum Sidebar */}
        <Button
          variant={curriculumOpen ? 'secondary' : 'outline'}
          size="sm"
          onClick={onToggleCurriculum}
          className="h-8 px-2.5 text-xs"
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
