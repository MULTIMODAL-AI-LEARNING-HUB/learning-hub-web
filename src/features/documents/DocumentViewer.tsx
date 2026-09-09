import { useMemo, useState } from 'react'
import { ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight, AlertTriangle, ExternalLink, FileText } from 'lucide-react'
import type { DocumentItem } from '../../types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { fileIconEmoji } from '../../utils/fileIcon'

export function DocumentViewer({ doc }: { doc: DocumentItem }) {
  const [zoom, setZoom] = useState(100)
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = doc.pageCount ?? 1
  const docType = doc.type.toLowerCase()
  const isPdf = docType === 'pdf'
  const isMedia = ['mp4', 'webm', 'mp3', 'wav', 'video', 'audio'].includes(docType)
  const mediaKind = useMemo(() => {
    if (['mp4', 'webm', 'video'].includes(docType)) return 'video' as const
    if (['mp3', 'wav', 'audio'].includes(docType)) return 'audio' as const
    return null
  }, [docType])

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-2 border-b border-border px-3 py-2 sm:items-center sm:gap-3 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2 min-w-0 sm:gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-base sm:h-9 sm:w-9 sm:text-lg">
            {fileIconEmoji(doc.type)}
          </div>
          <div className="min-w-0">
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Xem tệp {doc.type.toUpperCase()}
            </p>
            <p className="text-xs font-semibold text-foreground truncate sm:text-sm">{doc.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 sm:gap-2">
          {doc.type === 'pdf' && totalPages > 1 && (
            <div className="flex items-center gap-0.5 rounded-lg border border-input bg-surface-elevated p-0.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="h-6 w-6 sm:h-7 sm:w-7"
                aria-label="Trang trước"
                title="Trang trước"
              >
                <ChevronLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
              <div className="px-1 text-2xs font-medium text-foreground tabular-nums min-w-8 text-center sm:px-2 sm:text-xs sm:min-w-12">
                {currentPage} / {totalPages}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="h-6 w-6 sm:h-7 sm:w-7"
                aria-label="Trang sau"
                title="Trang sau"
              >
                <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
            </div>
          )}

          <div className="flex items-center gap-0.5 rounded-lg border border-input bg-surface-elevated p-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="h-6 w-6 sm:h-7 sm:w-7"
              aria-label="Thu nhỏ"
              title="Thu nhỏ"
            >
              <ZoomOut className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Button>
            <div className="px-1 text-2xs font-medium text-foreground tabular-nums min-w-8 text-center sm:px-2 sm:text-xs sm:min-w-12">
              {zoom}%
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
              className="h-6 w-6 sm:h-7 sm:w-7"
              aria-label="Phóng to"
              title="Phóng to"
            >
              <ZoomIn className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Button>
          </div>

          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" aria-label="Toàn màn hình" title="Toàn màn hình">
            <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin">
        {doc.status === 'processing' && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Spinner size="lg" />
              <p className="mt-3 text-sm font-medium text-foreground">Đang xử lý tài liệu</p>
              <p className="mt-1 text-xs text-muted-foreground">Quá trình này thường mất 1-2 phút</p>
            </div>
          </div>
        )}

        {doc.status === 'failed' && (
          <EmptyState
            icon={<AlertTriangle />}
            title="Không thể xử lý tài liệu"
            description={
              doc.error ||
              'Hệ thống chưa thể xử lý tệp này (có thể là PDF scan không có lớp chữ). Hãy bấm "Thử lại" hoặc tải lên bản TXT/DOCX.'
            }
          />
        )}

        {doc.status === 'ready' && (
          <div className="p-3 sm:p-6">
            {doc.fileUrl && (isPdf || mediaKind) ? (
              <div
                className="mx-auto max-w-3xl overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-soft transition-transform origin-top"
                style={{ transform: `scale(${zoom / 100})` }}
              >
                {isPdf && (
                  <iframe
                    key={doc.fileUrl}
                    src={doc.fileUrl}
                    title={doc.name}
                    className="h-[70vh] w-full"
                  />
                )}
                {mediaKind === 'video' && (
                  <video key={doc.fileUrl} src={doc.fileUrl} controls className="w-full" preload="metadata" />
                )}
                {mediaKind === 'audio' && (
                  <div className="p-6">
                    <audio key={doc.fileUrl} src={doc.fileUrl} controls className="w-full" preload="metadata" />
                  </div>
                )}
              </div>
            ) : (
              <div className="mx-auto max-w-3xl rounded-xl border border-border bg-surface-elevated p-4 shadow-soft sm:p-10">
                <div className="space-y-4">
                  <Badge variant="primary" label={isMedia ? 'Tệp media' : `Chương ${currentPage}`} />
                  <h3 className="font-display text-2xl font-bold text-foreground text-balance">
                    {doc.name.replace(/\.\w+$/, '')}
                  </h3>
                  <div className="flex items-start gap-2.5 rounded-lg bg-muted/40 p-3 text-sm text-foreground/80">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p className="leading-relaxed">
                      Tài liệu đã được xử lý và lập chỉ mục
                      {doc.pageCount ? ` (${doc.pageCount} trang/phân đoạn)` : ''}.
                      Dùng Trò chuyện AI, Quiz, Flashcards hoặc Chấm essay để học từ nội dung thật của tệp này.
                    </p>
                  </div>
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Mở tệp gốc trong tab mới
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
