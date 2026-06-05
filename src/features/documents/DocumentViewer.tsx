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
  'Machine learning is a subset of artificial intelligence.',
  'Deep learning uses multi-layer neural networks.',
  'Backpropagation optimizes weights via gradient descent.',
  'Supervised learning requires labeled training data.',
  'Overfitting occurs when a model memorizes noise.'
]

export function DocumentViewer({ doc }: { doc: DocumentItem }) {
  const [zoom, setZoom] = useState(100)
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = doc.pageCount ?? 1

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
            {fileIconEmoji(doc.type)}
          </div>
          <div className="min-w-0">
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              {doc.type.toUpperCase()} Viewer
            </p>
            <p className="text-sm font-semibold text-foreground truncate">{doc.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {doc.type === 'pdf' && totalPages > 1 && (
            <div className="flex items-center gap-1 rounded-lg border border-input bg-surface-elevated p-0.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="h-7 w-7"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <div className="px-2 text-xs font-medium text-foreground tabular-nums min-w-12 text-center">
                {currentPage} / {totalPages}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="h-7 w-7"
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          <div className="flex items-center gap-1 rounded-lg border border-input bg-surface-elevated p-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="h-7 w-7"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <div className="px-2 text-xs font-medium text-foreground tabular-nums min-w-12 text-center">
              {zoom}%
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
              className="h-7 w-7"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Fullscreen">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin">
        {doc.status === 'processing' && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Spinner size="lg" />
              <p className="mt-3 text-sm font-medium text-foreground">Processing document</p>
              <p className="mt-1 text-xs text-muted-foreground">This usually takes 1-2 minutes</p>
            </div>
          </div>
        )}

        {doc.status === 'failed' && (
          <EmptyState
            icon={<AlertTriangle />}
            title="Failed to load document"
            description="We couldn't process this file. Try uploading it again or contact support."
          />
        )}

        {doc.status === 'ready' && (
          <div className="p-6">
            <div
              className="mx-auto max-w-3xl rounded-xl border border-border bg-surface-elevated p-10 shadow-soft transition-transform origin-top"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              <div className="space-y-4">
                <Badge variant="primary" label={`Chapter ${currentPage}`} />
                <h3 className="font-display text-2xl font-bold text-foreground text-balance">
                  Introduction to {doc.name.replace(/\.\w+$/, '')}
                </h3>
                <p className="text-sm leading-relaxed text-foreground/80">
                  This chapter provides an overview of the fundamental concepts and principles.
                  We will explore the key ideas, methodologies, and applications that form the
                  foundation of this topic.
                </p>
                <p className="text-sm leading-relaxed text-foreground/80">
                  Machine learning is a branch of artificial intelligence that focuses on building
                  systems that learn from and make decisions based on data. Rather than being
                  explicitly programmed to perform a task, these systems use algorithms to identify
                  patterns in data and improve their performance over time.
                </p>
                <p className="text-sm leading-relaxed text-foreground/80">
                  The field has grown tremendously in recent years, with applications ranging from
                  natural language processing and computer vision to recommendation systems and
                  autonomous vehicles.
                </p>
              </div>
            </div>

            <div className="mt-6 max-w-3xl mx-auto rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-accent" />
                <p className="text-sm font-semibold text-foreground">Smart Notes</p>
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
