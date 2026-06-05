import { useEffect } from 'react'
import { Upload, FileText } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { DocumentViewer } from './DocumentViewer'
import { DocumentCard } from './DocumentCard'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import { useDocumentStatus } from '../../hooks/useDocumentStatus'

export function DocumentHub() {
  const docs = useAppStore((s) => s.documents.items)
  const selectedId = useAppStore((s) => s.documents.selectedId)
  const openUpload = useAppStore((s) => s.ui.openUploadModal)
  const loadDocuments = useAppStore((s) => s.documents.loadDocuments)
  const removeDoc = useAppStore((s) => s.documents.remove)
  const retryDoc = useAppStore((s) => s.documents.retry)
  const selectDoc = useAppStore((s) => s.documents.select)

  useDocumentStatus()

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const selectedDoc = docs.find((d) => d.id === selectedId)
  const readyDocs = docs.filter((d) => d.status === 'ready').length

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        subtitle="Workspace"
        title="Documents"
        description={`${docs.length} document${docs.length === 1 ? '' : 's'} · ${readyDocs} ready to study`}
        icon={<FileText />}
        actions={
          <Button onClick={openUpload} icon={<Upload className="h-4 w-4" />}>
            Upload
          </Button>
        }
      />

      <div className="flex flex-1 gap-4 min-h-0">
        <div className="w-full shrink-0 lg:w-[340px] flex flex-col min-h-0">
          {docs.length === 0 ? (
            <EmptyState
              icon={<FileText />}
              title="No documents yet"
              description="Upload PDFs, videos, audio files, or URLs to get started with your AI study workspace."
              action={
                <Button onClick={openUpload} icon={<Upload className="h-4 w-4" />}>
                  Upload your first document
                </Button>
              }
              className="flex-1"
            />
          ) : (
            <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 space-y-2">
              {docs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  isSelected={selectedId === doc.id}
                  onSelect={() => selectDoc(doc.id)}
                  onRemove={removeDoc}
                  onRetry={retryDoc}
                />
              ))}
            </div>
          )}
        </div>

        <div className="hidden flex-1 lg:block min-h-0">
          {selectedDoc ? (
            <DocumentViewer doc={selectedDoc} />
          ) : (
            <EmptyState
              icon={<FileText />}
              title="Select a document"
              description="Pick a document from the list to view its content, ask questions, and generate study materials."
              className="h-full"
            />
          )}
        </div>
      </div>
    </div>
  )
}
