import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Eye, Loader2, ShieldCheck, X } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { useAppStore } from '../../../stores/appStore'
import { withAuthToken } from '../../../services/api'

interface SecureDocumentViewerProps {
  fileUrl: string
  fileName: string
  open: boolean
  onClose: () => void
}

export function SecureDocumentViewer({ fileUrl, fileName, open, onClose }: SecureDocumentViewerProps) {
  const user = useAppStore((s) => s.auth.user)
  const [renderKey] = useState(() => Date.now())

  const secureUrl = useMemo(() => {
    if (!open) return ''
    const base = withAuthToken(fileUrl) || fileUrl
    const params = new URLSearchParams({
      t: String(renderKey),
      toolbar: '0',
      navpanes: '0',
      scrollbar: '0',
      zoom: 'page-width',
    })
    return `${base}#${params.toString()}`
  }, [open, fileUrl, renderKey])

  useEffect(() => {
    if (!open) return
    const blockKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['p', 's', 'c'].includes(e.key.toLowerCase())) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    const blockContext = (e: Event) => e.preventDefault()
    window.addEventListener('keydown', blockKeys, true)
    document.addEventListener('contextmenu', blockContext, true)
    return () => {
      window.removeEventListener('keydown', blockKeys, true)
      document.removeEventListener('contextmenu', blockContext, true)
    }
  }, [open])

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="4xl"
      title={fileName}
      description="Chế độ xem bảo mật — Tài liệu chỉ được xem trực tiếp, không tải về, không in ấn."
    >
      <div className="relative h-[70vh] w-full overflow-hidden rounded-xl border border-border bg-muted/20 select-none">
        {/* Secure iframe (no download/print toolbar, no context actions) */}
        <iframe
          key={secureUrl}
          src={secureUrl}
          title={`Xem tài liệu: ${fileName}`}
          className="h-full w-full border-0"
          onContextMenu={(e) => e.preventDefault()}
          sandbox="allow-scripts allow-same-origin"
        />

        {/* Dynamic learner watermark — deters screenshots / re-recording leaks */}
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="rotate-[-18deg] select-none whitespace-nowrap text-lg sm:text-2xl font-bold text-foreground/[0.06] tracking-wider font-mono">
            {user?.email || user?.name || 'Học viên'} • Bản quyền bảo lưu
          </div>
        </div>

        {/* Top protective strip (blocks simple iframe toolbar grab) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/10 to-transparent z-10" aria-hidden="true" />

        {/* Bottom notice banner */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-2 border-t border-border/60 bg-card/95 backdrop-blur px-3 py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5 min-w-0">
            <ShieldCheck className="h-3.5 w-3.5 text-success shrink-0" />
            <span className="truncate">
              {user?.email ? `Đang xem bởi: ${user.email}` : 'Nội dung độc quyền của khóa học'}
            </span>
          </span>
          <span className="hidden sm:flex items-center gap-1.5 shrink-0">
            <Eye className="h-3.5 w-3.5" /> Chỉ xem trực tiếp
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-muted-foreground">
        <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Vì lý do bản quyền, tài liệu này <strong className="text-foreground">không hỗ trợ tải về, in ấn hay sao chép</strong>.
          Mọi hành vi chụp/quay lại màn hình để phát tán đều có thể bị truy vết qua thông tin tài khoản hiển thị mờ trên tài liệu.
        </p>
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="outline" size="sm" icon={<X className="h-4 w-4" />} onClick={onClose}>
          Đóng trình xem
        </Button>
      </div>
    </Modal>
  )
}

export function SecureDocumentFallback() {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(t)
  }, [])
  if (!loading) return null
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải trình xem bảo mật...
    </div>
  )
}
