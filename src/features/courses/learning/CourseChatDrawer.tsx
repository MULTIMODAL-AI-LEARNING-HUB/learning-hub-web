import { CourseChatPanel } from '../CourseChatPanel'

interface CourseChatDrawerProps {
  courseId: string
  open: boolean
  onClose: () => void
}

export function CourseChatDrawer({ courseId, open, onClose }: CourseChatDrawerProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer content - mounted ONLY when open to stop polling when closed */}
      <div className="relative w-full max-w-sm sm:max-w-md h-full bg-surface-elevated shadow-2xl animate-slide-in-right flex flex-col overflow-hidden rounded-l-2xl border-l border-border z-10">
        <CourseChatPanel
          courseId={courseId}
          onClose={onClose}
          className="h-full border-0 shadow-none rounded-none bg-surface-elevated"
        />
      </div>
    </div>
  )
}
