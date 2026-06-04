import { useEffect } from 'react'
import { useAppStore } from '../../stores/appStore'
import { DocumentViewer } from './DocumentViewer'
import { Button } from '../../components/ui/Button'
import { Progress } from '../../components/ui/Progress'
import type { DocumentItem } from '../../types'
import { fileIcon } from '../../utils/fileIcon'
import { useDocumentStatus } from '../../hooks/useDocumentStatus'

function DocumentCard({ doc }: { doc: DocumentItem }) {
  const select = useAppStore((s) => s.documents.select)
  const remove = useAppStore((s) => s.documents.remove)
  const retry = useAppStore((s) => s.documents.retry)
  const selectedId = useAppStore((s) => s.documents.selectedId)
  const toasts = useAppStore((s) => s.toasts.add)
  const isSelected = selectedId === doc.id

  return (
    <div
      onClick={() => select(doc.id)}
      className={`group rounded-xl border px-4 py-3 transition cursor-pointer ${
        isSelected
          ? 'border-accent bg-accentSoft shadow-soft'
          : 'border-border bg-white hover:border-accent/40 hover:shadow-soft'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{fileIcon(doc.type)}</span>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-ink">{doc.name}</p>
          <p className="text-xs text-inkMute">{doc.size}</p>
        </div>
        <div className="opacity-0 transition group-hover:opacity-100 flex gap-1">
          {doc.status === 'failed' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                retry(doc.id)
                toasts({ type: 'info', title: 'Retrying...', message: doc.name })
              }}
              className="rounded-lg px-2 py-1 text-xs text-accent transition hover:bg-accentSoft"
            >
              Retry
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              remove(doc.id)
              toasts({ type: 'warning', title: 'Deleted', message: doc.name })
            }}
            className="rounded-lg px-2 py-1 text-xs text-danger transition hover:bg-danger/10"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-2.5">
        {doc.status === 'processing' && (
          <div className="space-y-1.5">
            <Progress value={doc.progress ?? 0} />
            <p className="text-xs text-inkMute">Processing • {doc.progress}%</p>
          </div>
        )}
        {doc.status === 'ready' && (
          <p className="text-xs text-success font-medium">✓ Ready • {doc.pageCount} pages</p>
        )}
        {doc.status === 'failed' && (
          <p className="text-xs text-danger font-medium">✕ Processing failed</p>
        )}
      </div>
    </div>
  )
}

export function DocumentHub() {
  const docs = useAppStore((s) => s.documents.items)
  const selectedId = useAppStore((s) => s.documents.selectedId)
  const openUpload = useAppStore((s) => s.ui.openUploadModal)
  const loadDocuments = useAppStore((s) => s.documents.loadDocuments)

  // Start polling processing document statuses
  useDocumentStatus()

  // Fetch document list from API gateway on component mount
  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const selectedDoc = docs.find((d) => d.id === selectedId)

  return (
    <div className="flex h-full gap-4">
      {/* Document List */}
      <div className="w-full shrink-0 lg:w-[320px] flex flex-col">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Documents</h2>
          <Button onClick={openUpload} size="sm" icon="＋">
            Upload
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface py-12">
              <span className="text-3xl">📁</span>
              <p className="text-sm text-inkMute">No documents yet</p>
              <Button onClick={openUpload} size="sm">
                Upload your first document
              </Button>
            </div>
          ) : (
            docs.map((doc) => <DocumentCard key={doc.id} doc={doc} />)
          )}
        </div>
      </div>

      {/* Document Viewer */}
      <div className="hidden flex-1 lg:block">
        {selectedDoc ? (
          <DocumentViewer doc={selectedDoc} />
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border bg-surface">
            <div className="text-center">
              <span className="text-4xl">📖</span>
              <p className="mt-3 text-sm text-inkMute">Select a document to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
