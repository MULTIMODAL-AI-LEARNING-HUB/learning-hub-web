import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ZoomIn, ZoomOut, Maximize2, Minimize2, ChevronLeft, ChevronRight, AlertTriangle, ExternalLink, FileText, RefreshCw } from 'lucide-react'
import type { DocumentItem } from '../../types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { fileIconEmoji } from '../../utils/fileIcon'
import { documentsApi, resolveViewerUrl, withAuthToken } from '../../services/api'

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
  // Same-origin iframe URL (query-token auth) for direct streaming.
  const directUrl = useMemo(
    () => withAuthToken(resolveViewerUrl(doc.fileUrl)),
    [doc.fileUrl],
  )
  // Authenticated blob fallback: fetch bytes with the axios Bearer header and
  // render from an object URL. This is what actually fixes the grey viewer —
  // <iframe> cannot send Authorization headers, and the in-memory ?token= is
  // never set after a reload (accessToken lives in module memory only).
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [blobLoading, setBlobLoading] = useState(false)
  const [blobError, setBlobError] = useState<string | null>(null)
  const blobObjectUrl = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const loadBlob = useCallback(async () => {
    if (!doc.id || (!isPdf && !mediaKind)) return
    setBlobLoading(true)
    setBlobError(null)
    try {
      const blob = await documentsApi.getContentBlob(doc.id)
      if (blobObjectUrl.current) URL.revokeObjectURL(blobObjectUrl.current)
      const objectUrl = URL.createObjectURL(
        isPdf && blob.type !== 'application/pdf'
          ? new Blob([blob], { type: 'application/pdf' })
          : blob,
      )
      blobObjectUrl.current = objectUrl
      setBlobUrl(objectUrl)
    } catch {
      setBlobError('Không tải được nội dung tệp. Hãy kiểm tra đăng nhập rồi bấm thử lại.')
    } finally {
      setBlobLoading(false)
    }
  }, [doc.id, isPdf, mediaKind])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBlobUrl(null)
    setBlobError(null)
    setCurrentPage(1)
    if (doc.status === 'ready' && (isPdf || mediaKind)) {
      void loadBlob()
    }
    return () => {
      if (blobObjectUrl.current) {
        URL.revokeObjectURL(blobObjectUrl.current)
        blobObjectUrl.current = null
      }
    }
  }, [doc.id, doc.status, isPdf, mediaKind, loadBlob])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1)
  }, [doc.id])

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else if (containerRef.current) {
        await containerRef.current.requestFullscreen()
      }
    } catch {
      // Fullscreen API may be unavailable (older browsers, nested iframes).
    }
  }, [])

  const viewerUrl = blobUrl ?? directUrl

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

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            aria-label={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
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
          <div ref={containerRef} className="bg-background p-3 sm:p-6">
            {blobLoading && (isPdf || mediaKind) ? (
              <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded-xl border border-border bg-surface-elevated py-16 shadow-soft">
                <Spinner size="lg" />
                <p className="mt-3 text-sm font-medium text-foreground">Đang tải nội dung tài liệu…</p>
              </div>
            ) : blobError && (isPdf || mediaKind) && !viewerUrl ? (
              <EmptyState
                icon={<AlertTriangle />}
                title="Không tải được nội dung tệp"
                description={blobError}
                action={
                  <Button variant="outline" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => void loadBlob()}>
                    Thử lại
                  </Button>
                }
              />
            ) : viewerUrl && (isPdf || mediaKind) ? (
              <div className="mx-auto max-w-5xl overflow-auto rounded-xl border border-border bg-surface-elevated shadow-soft">
                <div className="mx-auto" style={{ width: `${zoom}%`, minWidth: '100%' }}>
                {isPdf && (
                  <iframe
                    key={`${viewerUrl}#page=${currentPage}`}
                    src={`${viewerUrl}#page=${currentPage}&zoom=${zoom}`}
                    title={doc.name}
                    className={isFullscreen ? 'h-screen w-full' : 'h-[70vh] w-full'}
                  />
                )}
                {mediaKind === 'video' && (
                  <video key={viewerUrl} src={viewerUrl} controls className="w-full" preload="metadata" />
                )}
                {mediaKind === 'audio' && (
                  <div className="p-6">
                    <audio key={viewerUrl} src={viewerUrl} controls className="w-full" preload="metadata" />
                  </div>
                )}
                </div>
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
                  {viewerUrl && (
                    <a
                      href={viewerUrl}
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
