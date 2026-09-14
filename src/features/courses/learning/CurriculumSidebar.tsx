import { useState } from 'react'
import {
  BookOpen,
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
import { Progress } from '../../../components/ui/Progress'
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

  const totalItemsCount = sections.reduce((acc, s) => acc + s.items.length, 0)
  const totalCompletedCount = sections.reduce(
    (acc, s) =>
      acc +
      s.items.filter((item) =>
        item.kind === 'lesson' ? completedLessons.has(item.id) : completedMaterials.has(item.id)
      ).length,
    0
  )
  const percentComplete = totalItemsCount > 0 ? Math.round((totalCompletedCount / totalItemsCount) * 100) : 0

  const content = (
    <div className="flex flex-col h-full bg-card">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border/60 bg-surface-elevated/80 backdrop-blur-md shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-foreground">Giáo trình khóa học</h2>
              <p className="text-[11px] text-muted-foreground">
                {totalCompletedCount}/{totalItemsCount} hoàn thành
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<X className="h-4 w-4" />}
            className="h-8 w-8 rounded-lg p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80"
            onClick={onClose}
            title="Đóng giáo trình"
          />
        </div>

        {/* Micro progress meter */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-semibold">
            <span className="text-muted-foreground">Tiến độ tổng quan</span>
            <span className="text-primary tabular-nums font-bold">{percentComplete}%</span>
          </div>
          <Progress value={percentComplete} size="sm" className="h-1.5" />
        </div>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/40 scrollbar-thin">
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
            const isSectionDone = completedCount === section.items.length && section.items.length > 0

            return (
              <div key={section.id} className="bg-card transition-colors">
                {/* Section Header Accordion */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-3.5 sm:px-4 text-left hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0 pr-2 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        Chương {sIndex + 1}
                      </span>
                      {isSectionDone && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-success bg-success/15 px-1.5 py-0.2 rounded-full">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Xong
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] font-bold text-foreground line-clamp-1">
                      {section.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {completedCount}/{section.items.length} bài đã hoàn thành
                    </p>
                  </div>
                  <div className={cn(
                    'shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-all',
                    isCollapsed ? 'bg-transparent' : 'bg-muted/60'
                  )}>
                    {isCollapsed ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </div>
                </button>

                {/* Lesson Items */}
                {!isCollapsed && (
                  <div className="py-1 px-2 pb-2 space-y-1 bg-muted/[0.15]">
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
        <aside className="hidden lg:flex flex-col w-80 xl:w-96 shrink-0 border-l border-border/60 h-full overflow-hidden z-10 shadow-[0_0_24px_rgba(0,0,0,0.03)]">
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
          'w-full rounded-xl px-3 py-2.5 text-left transition-all text-xs flex items-center gap-3 relative overflow-hidden group',
          active
            ? 'bg-gradient-to-r from-primary/[0.12] to-accent/[0.08] text-primary font-semibold ring-1 ring-primary/30 shadow-xs'
            : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary" />
        )}
        <div
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold transition-all',
            completed
              ? 'bg-success/15 text-success ring-1 ring-success/30'
              : active
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/20'
          )}
        >
          {completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-[13px] text-foreground font-medium">{item.title}</p>
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
        'w-full rounded-xl px-3 py-2.5 text-left transition-all text-xs flex items-start gap-3 relative overflow-hidden group',
        active
          ? 'bg-gradient-to-r from-primary/[0.12] via-primary/[0.06] to-accent/[0.08] text-foreground ring-1 ring-primary/30 shadow-[0_2px_12px_rgba(79,70,229,0.1)]'
          : 'text-foreground/80 hover:bg-muted/70 hover:text-foreground'
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1 rounded-r-full bg-gradient-to-b from-primary to-accent" />
      )}

      <div
        className={cn(
          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold transition-all',
          completed
            ? 'bg-success/15 text-success ring-1 ring-success/30'
            : active
            ? 'bg-gradient-to-br from-primary to-accent text-white shadow-xs'
            : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/20'
        )}
      >
        {completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className={cn('line-clamp-2 text-[13px] leading-snug', active ? 'text-foreground font-bold' : 'text-foreground/90 font-medium')}>
          {item.title}
        </p>

        {/* Feature micro-badges */}
        <div className="flex flex-wrap items-center gap-1">
          {hasVideo && (
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-primary bg-primary/10 px-1.5 py-0.2 rounded-md">
              <Video className="h-2.5 w-2.5" /> Video
            </span>
          )}
          {hasContent && (
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-md">
              <FileText className="h-2.5 w-2.5" /> Bài đọc
            </span>
          )}
          {docAttachmentsCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded-md">
              <Paperclip className="h-2.5 w-2.5" /> {docAttachmentsCount}
            </span>
          )}
          {hasQuiz && (
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-1.5 py-0.2 rounded-md">
              <HelpCircle className="h-2.5 w-2.5" /> Quiz
            </span>
          )}
          {hasAssignment && (
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded-md">
              <FileCheck className="h-2.5 w-2.5" /> Bài tập
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
