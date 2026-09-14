import { useState } from 'react'
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileCheck,
  FileText,
  HelpCircle,
  Paperclip,
  Video,
  X,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { cn } from '../../../utils/cn'
import {
  isVideoFile,
  itemKey,
  materialTypeLabel,
  type LearningItem,
  type LearningSection,
} from './types'

interface CurriculumSidebarProps {
  sections: LearningSection[]
  currentItem: LearningItem | null
  completedLessons: Set<string>
  completedMaterials: Set<string>
  open: boolean
  onClose: () => void
  onSelectItem: (item: LearningItem) => void
}

export function CurriculumSidebar({
  sections,
  currentItem,
  completedLessons,
  completedMaterials,
  open,
  onClose,
  onSelectItem,
}: CurriculumSidebarProps) {
  // Track collapsed sections (default all expanded)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  const content = (
    <div className="flex flex-col h-full bg-card">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-foreground">Nội dung khóa học</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {sections.reduce((acc, s) => acc + s.items.length, 0)} bài học & tài liệu
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          onClick={onClose}
          title="Đóng giáo trình"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/60 scrollbar-thin">
        {sections.length === 0 ? (
          <div className="p-6">
            <EmptyState
              compact
              title="Chưa có nội dung"
              description="Khóa học chưa có bài học nào."
            />
          </div>
        ) : (
          sections.map((section, sIndex) => {
            const isCollapsed = collapsedSections.has(section.id)
            const completedCount = section.items.filter((item) =>
              item.kind === 'lesson'
                ? completedLessons.has(item.id)
                : completedMaterials.has(item.id)
            ).length

            return (
              <div key={section.id} className="bg-card">
                {/* Section Header Accordion */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Chương {sIndex + 1}
                    </p>
                    <p className="text-xs font-bold text-foreground line-clamp-1 mt-0.5">
                      {section.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {completedCount}/{section.items.length} hoàn thành
                    </span>
                  </div>
                  <div className="shrink-0 text-muted-foreground">
                    {isCollapsed ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </div>
                </button>

                {/* Lesson Items */}
                {!isCollapsed && (
                  <div className="py-1 px-2 space-y-0.5 bg-muted/10">
                    {section.items.map((item, index) => {
                      const active = currentItem ? itemKey(item) === itemKey(currentItem) : false
                      const isCompleted =
                        item.kind === 'lesson'
                          ? completedLessons.has(item.id)
                          : completedMaterials.has(item.id)

                      return (
                        <CurriculumLessonItem
                          key={itemKey(item)}
                          item={item}
                          index={index}
                          active={active}
                          completed={isCompleted}
                          onClick={() => {
                            onSelectItem(item)
                            // On mobile, auto-close sidebar after selection
                            if (window.innerWidth < 1024) onClose()
                          }}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )

  // Desktop view (collapsible column on right)
  // Mobile view (slide-over drawer with backdrop)
  return (
    <>
      {/* Desktop Column */}
      {open && (
        <aside className="hidden lg:flex flex-col w-80 xl:w-96 shrink-0 border-l border-border h-full overflow-hidden z-10">
          {content}
        </aside>
      )}

      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-fade-in"
            onClick={onClose}
          />

          {/* Drawer content */}
          <div className="relative w-full max-w-sm h-full shadow-2xl animate-slide-in-right">
            {content}
          </div>
        </div>
      )}
    </>
  )
}

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
          'w-full rounded-lg px-2.5 py-2 text-left transition-all text-xs flex items-center gap-2.5',
          active
            ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary'
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
        )}
      >
        <div
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
            completed
              ? 'bg-success/15 text-success'
              : active
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {completed ? <CheckCircle2 className="h-3 w-3" /> : index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-foreground">{item.title}</p>
          <span className="text-[10px] text-muted-foreground font-normal">
            {materialTypeLabel(item.material.material_type)}
          </span>
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
        'w-full rounded-lg px-2.5 py-2 text-left transition-all text-xs flex items-start gap-2.5',
        active
          ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary'
          : 'text-foreground/80 hover:bg-muted/60 hover:text-foreground'
      )}
    >
      <div
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors',
          completed
            ? 'bg-success/15 text-success'
            : active
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {completed ? <CheckCircle2 className="h-3 w-3" /> : index + 1}
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn('line-clamp-2 leading-snug', active ? 'text-foreground font-semibold' : 'text-foreground/90')}>
          {item.title}
        </p>

        {/* Feature badges */}
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {hasVideo && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-primary bg-primary/10 px-1 py-0.2 rounded">
              <Video className="h-2.5 w-2.5" /> Video
            </span>
          )}
          {hasContent && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded">
              <FileText className="h-2.5 w-2.5" /> Bài đọc
            </span>
          )}
          {docAttachmentsCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1 py-0.2 rounded">
              <Paperclip className="h-2.5 w-2.5" /> {docAttachmentsCount}
            </span>
          )}
          {hasQuiz && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-violet-600 dark:text-violet-400 bg-violet-500/10 px-1 py-0.2 rounded">
              <HelpCircle className="h-2.5 w-2.5" /> Quiz
            </span>
          )}
          {hasAssignment && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded">
              <FileCheck className="h-2.5 w-2.5" /> Bài tập
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
