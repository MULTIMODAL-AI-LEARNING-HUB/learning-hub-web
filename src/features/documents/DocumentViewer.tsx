import { useState } from 'react'
import type { DocumentItem } from '../../types'
import { Button } from '../../components/ui/Button'

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
    <div className="flex h-full flex-col rounded-2xl border border-border bg-panel shadow-soft">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-inkMute">
            {doc.type.toUpperCase()} Viewer
          </p>
          <p className="text-base font-semibold text-ink">{doc.name}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Page navigation */}
          {doc.type === 'pdf' && (
            <div className="flex items-center gap-1.5 rounded-xl border border-border px-2 py-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="rounded-lg px-2 py-0.5 text-xs transition hover:bg-surface disabled:opacity-30"
              >
                ‹
              </button>
              <input
                type="number"
                value={currentPage}
                onChange={(e) => setCurrentPage(Math.min(totalPages, Math.max(1, Number(e.target.value) || 1)))}
                className="w-10 bg-transparent text-center text-xs text-ink outline-none"
              />
              <span className="text-xs text-inkMute">/ {totalPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-lg px-2 py-0.5 text-xs transition hover:bg-surface disabled:opacity-30"
              >
                ›
              </button>
            </div>
          )}

          {/* Zoom controls */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border px-2 py-1">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="rounded-lg px-2 py-0.5 text-xs transition hover:bg-surface"
            >
              −
            </button>
            <span className="w-10 text-center text-xs text-ink">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
              className="rounded-lg px-2 py-0.5 text-xs transition hover:bg-surface"
            >
              +
            </button>
          </div>

          <Button variant="ghost" size="sm">
            ⛶
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto">
        {doc.status === 'processing' && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              <p className="mt-3 text-sm text-inkMute">Processing document...</p>
            </div>
          </div>
        )}

        {doc.status === 'failed' && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <span className="text-4xl">⚠️</span>
              <p className="mt-3 text-sm text-danger">Failed to load document</p>
              <p className="mt-1 text-xs text-inkMute">Please try again later</p>
            </div>
          </div>
        )}

        {doc.status === 'ready' && (
          <div className="p-6">
            {/* Mock PDF page */}
            <div
              className="mx-auto rounded-xl border border-border bg-white p-8 shadow-sm transition-transform"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            >
              <div className="space-y-4">
                <h3 className="font-display text-xl font-semibold text-ink">
                  Chapter {currentPage}: Introduction to {doc.name.replace(/\.\w+$/, '')}
                </h3>
                <p className="text-sm leading-relaxed text-inkSoft">
                  This chapter provides an overview of the fundamental concepts and principles.
                  We will explore the key ideas, methodologies, and applications that form the
                  foundation of this topic.
                </p>
                <p className="text-sm leading-relaxed text-inkSoft">
                  Machine learning is a branch of artificial intelligence that focuses on building
                  systems that learn from and make decisions based on data. Rather than being
                  explicitly programmed to perform a task, these systems use algorithms to identify
                  patterns in data and improve their performance over time.
                </p>
                <p className="text-sm leading-relaxed text-inkSoft">
                  The field has grown tremendously in recent years, with applications ranging from
                  natural language processing and computer vision to recommendation systems and
                  autonomous vehicles.
                </p>
              </div>
            </div>

            {/* Smart Notes */}
            <div className="mt-6 rounded-xl bg-surface px-4 py-3">
              <p className="text-sm font-semibold text-ink">📝 Smart Notes</p>
              <ul className="mt-2 space-y-1.5">
                {smartNotes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-inkMute">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <p>{note}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
