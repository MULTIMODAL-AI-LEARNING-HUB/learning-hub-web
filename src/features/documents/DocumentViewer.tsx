import { useState } from 'react'
import { ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight, Sparkles, AlertTriangle } from 'lucide-react'
import type { DocumentItem } from '../../types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { fileIconEmoji } from '../../utils/fileIcon'

const smartNotes = [
  'Học máy (Machine Learning) là một nhánh quan trọng của trí tuệ nhân tạo.',
  'Học sâu (Deep Learning) sử dụng các mạng nơ-ron nhân tạo đa tầng.',
  'Lan truyền ngược (Backpropagation) tối ưu hóa trọng số qua giải thuật hạ độ dốc.',
  'Học có giám sát (Supervised Learning) đòi hỏi tập dữ liệu huấn luyện đã được dán nhãn.',
  'Hiện tượng quá khớp (Overfitting) xuất hiện khi mô hình học vẹt dữ liệu nhiễu.'
]

export function DocumentViewer({ doc }: { doc: DocumentItem }) {
  const [zoom, setZoom] = useState(100)
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = doc.pageCount ?? 1

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
            title="Không thể tải tài liệu"
            description="Hệ thống chưa thể xử lý tệp này. Vui lòng thử tải lên lại hoặc liên hệ hỗ trợ."
          />
        )}

        {doc.status === 'ready' && (
          <div className="p-3 sm:p-6">
            <div
              className="mx-auto max-w-3xl rounded-xl border border-border bg-surface-elevated p-4 shadow-soft transition-transform origin-top sm:p-10"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              <div className="space-y-4">
                <Badge variant="primary" label={`Chương ${currentPage}`} />
                <h3 className="font-display text-2xl font-bold text-foreground text-balance">
                  Giới thiệu tổng quan: {doc.name.replace(/\.\w+$/, '')}
                </h3>
                <p className="text-sm leading-relaxed text-foreground/80">
                  Phần này trình bày tổng quan về các khái niệm cơ bản và nguyên lý cốt lõi.
                  Chúng ta sẽ cùng tìm hiểu các ý tưởng chính, phương pháp luận và ứng dụng thực tiễn
                  tạo nên nền tảng của chủ đề này.
                </p>
                <p className="text-sm leading-relaxed text-foreground/80">
                  Học máy là một phân nhánh của trí tuệ nhân tạo, tập trung vào việc xây dựng
                  các hệ thống có khả năng tự học hỏi và đưa ra quyết định dựa trên dữ liệu. Thay vì
                  được lập trình chi tiết từng bước, hệ thống sẽ tự tìm kiếm quy luật và cải thiện
                  độ chính xác theo thời gian.
                </p>
                <p className="text-sm leading-relaxed text-foreground/80">
                  Lĩnh vực này đã phát triển vượt bậc trong những năm gần đây, với nhiều ứng dụng
                  sâu rộng từ xử lý ngôn ngữ tự nhiên, thị giác máy tính đến hệ thống gợi ý và xe tự hành.
                </p>
              </div>
            </div>

            <div className="mt-6 max-w-3xl mx-auto rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-accent" />
                <p className="text-sm font-semibold text-foreground">Ghi chú thông minh AI</p>
                <Badge variant="primary" label="AI" className="ml-auto" />
              </div>
              <ul className="space-y-2">
                {smartNotes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <p className="leading-relaxed">{note}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
