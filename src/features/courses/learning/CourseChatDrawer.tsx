import { X } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
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
      <div className="relative w-full max-w-sm sm:max-w-md h-full bg-card shadow-2xl animate-slide-in-right flex flex-col overflow-hidden rounded-l-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div>
            <h2 className="text-sm font-bold text-foreground">Phòng chat khóa học</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Trò chuyện cùng học viên & giảng viên
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            onClick={onClose}
            title="Đóng phòng chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <CourseChatPanel courseId={courseId} compact={false} />
        </div>
      </div>
    </div>
  )
}
